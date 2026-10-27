import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
    addTeacher,
    updateTeacher,
    getTeacherById,
    getAllSubjects,
    getClasses,
} from "../../services/principalApi";
import { useState, useEffect } from "react";
import Breadcrumb from "../../components/breadcrumb";
import Modal from "../../components/modal";

type FormData = {
    name: string;
    uid: string;
    password: string;
    employeeID: string;
};

type SubjectOption = {
    _id: string;
    name: string;
    subjectCode: string;
    class: string;
};

type ClassOption = {
    _id: string;
    class: string;
};

type AssignmentFormRow = {
    subjectId: string;
    classId: string;
};

type ExistingAssignment = {
    subjectId:
        | string
        | {
              _id: string;
              name: string;
              subjectCode: string;
              class?: string;
          }
        | null;
    classId:
        | string
        | {
              _id: string;
              class: string;
          }
        | null;
};

type ApiError = {
    response?: {
        data?: {
            message?: string;
        };
    };
};

const EMPTY_ASSIGNMENT: AssignmentFormRow = {
    subjectId: "",
    classId: "",
};

const CLASS_ORDER: Record<string, number> = {
    "1st": 1,
    "2nd": 2,
    "3rd": 3,
    "4th": 4,
    "5th": 5,
    "6th": 6,
    "7th": 7,
    "8th": 8,
    "9th": 9,
    "10th": 10,
    "11th": 11,
    "12th": 12,
};

function TeacherForm() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const mode = searchParams.get("mode");
    const id = searchParams.get("id");
    const isAdding = mode === "add";

    const [formData, setFormData] = useState<FormData>({
        name: "",
        uid: "",
        password: "",
        employeeID: "",
    });

    const [subjects, setSubjects] = useState<SubjectOption[]>([]);
    const [classes, setClasses] = useState<ClassOption[]>([]);

    const [assignments, setAssignments] = useState<AssignmentFormRow[]>([
        { ...EMPTY_ASSIGNMENT },
    ]);

    const [loadingOptions, setLoadingOptions] = useState(true);
    const [loadingTeacher, setLoadingTeacher] = useState(false);
    const [saving, setSaving] = useState(false);

    const [modalOpen, setModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    const [modalTitle, setModalTitle] = useState("");

    const showModal = (title: string, message: string) => {
        setModalTitle(title);
        setModalMessage(message);
        setModalOpen(true);
    };

    const getErrorMessage = (
        error: unknown,
        fallback: string
    ): string => {
        const err = error as ApiError;

        return err.response?.data?.message || fallback;
    };

    // Load all available subject documents and classes.
    useEffect(() => {
        let cancelled = false;

        const fetchOptions = async () => {
            setLoadingOptions(true);

            try {
                const [subjectsResponse, classesResponse] =
                    await Promise.all([
                        getAllSubjects(),
                        getClasses(),
                    ]);

                const subjectsData = subjectsResponse.data;
                const classesData = classesResponse.data;

                const subjectList: SubjectOption[] = Array.isArray(
                    subjectsData
                )
                    ? subjectsData
                    : subjectsData.subjects ?? [];

                const classList: ClassOption[] = Array.isArray(
                    classesData
                )
                    ? classesData
                    : classesData.classes ?? [];

                if (cancelled) {
                    return;
                }

                setSubjects(subjectList);

                setClasses(
                    [...classList].sort(
                        (a, b) =>
                            (CLASS_ORDER[a.class] ?? 99) -
                            (CLASS_ORDER[b.class] ?? 99)
                    )
                );
            } catch (error) {
                if (cancelled) {
                    return;
                }

                console.error(
                    "Failed to load teacher form options:",
                    error
                );

                showModal(
                    "Error",
                    getErrorMessage(
                        error,
                        "Failed to load subjects and classes."
                    )
                );
            } finally {
                if (!cancelled) {
                    setLoadingOptions(false);
                }
            }
        };

        void fetchOptions();

        return () => {
            cancelled = true;
        };
    }, []);

    // Load teacher details and existing assignments when editing.
    useEffect(() => {
        if (isAdding || !id) {
            setLoadingTeacher(false);
            return;
        }

        let cancelled = false;

        const fetchTeacher = async () => {
            setLoadingTeacher(true);

            try {
                const response = await getTeacherById(id);

                if (cancelled) {
                    return;
                }

                const teacher = response.data;

                setFormData({
                    name: teacher.userId?.name ?? "",
                    uid: teacher.userId?.uid ?? "",
                    password: "",
                    employeeID: teacher.employeeID ?? "",
                });

                const existingAssignments: ExistingAssignment[] =
                    teacher.assignments ?? [];

                if (existingAssignments.length > 0) {
                    const rows = existingAssignments.map(
                        (assignment) => {
                            const subjectId =
                                typeof assignment.subjectId === "object" &&
                                assignment.subjectId !== null
                                    ? assignment.subjectId._id
                                    : assignment.subjectId ?? "";

                            const classId =
                                typeof assignment.classId === "object" &&
                                assignment.classId !== null
                                    ? assignment.classId._id
                                    : assignment.classId ?? "";

                            return {
                                subjectId,
                                classId,
                            };
                        }
                    );

                    setAssignments(rows);
                } else {
                    setAssignments([{ ...EMPTY_ASSIGNMENT }]);
                }
            } catch (error) {
                if (cancelled) {
                    return;
                }

                console.error("Failed to fetch teacher:", error);

                showModal(
                    "Error",
                    getErrorMessage(
                        error,
                        "Failed to fetch teacher details."
                    )
                );
            } finally {
                if (!cancelled) {
                    setLoadingTeacher(false);
                }
            }
        };

        void fetchTeacher();

        return () => {
            cancelled = true;
        };
    }, [id, isAdding]);

    // Update one assignment field.
    const updateAssignment = (
        index: number,
        field: keyof AssignmentFormRow,
        value: string
    ) => {
        setAssignments((previous) =>
            previous.map((assignment, currentIndex) =>
                currentIndex === index
                    ? {
                          ...assignment,
                          [field]: value,
                      }
                    : assignment
            )
        );
    };

    // Change the class and clear an incompatible subject atomically.
    const handleClassChange = (
        index: number,
        classId: string
    ) => {
        const selectedClass = classes.find(
            (item) => item._id === classId
        );

        setAssignments((previous) =>
            previous.map((assignment, currentIndex) => {
                if (currentIndex !== index) {
                    return assignment;
                }

                const selectedSubject = subjects.find(
                    (subject) =>
                        subject._id === assignment.subjectId
                );

                const subjectIsValid =
                    selectedClass &&
                    selectedSubject &&
                    selectedSubject.class === selectedClass.class;

                return {
                    classId,
                    subjectId: subjectIsValid
                        ? assignment.subjectId
                        : "",
                };
            })
        );
    };

    const addAssignmentRow = () => {
        setAssignments((previous) => [
            ...previous,
            { ...EMPTY_ASSIGNMENT },
        ]);
    };

    const removeAssignmentRow = (index: number) => {
        setAssignments((previous) => {
            const updated = previous.filter(
                (_, currentIndex) => currentIndex !== index
            );

            return updated.length > 0
                ? updated
                : [{ ...EMPTY_ASSIGNMENT }];
        });
    };

    // Return only subjects available for the selected class.
    const getSubjectsForClass = (classId: string) => {
        const selectedClass = classes.find(
            (item) => item._id === classId
        );

        if (!selectedClass) {
            return [];
        }

        return subjects.filter(
            (subject) => subject.class === selectedClass.class
        );
    };

    // Check whether another row contains the same subject/class pair.
    const isDuplicateAssignment = (
        index: number,
        subjectId: string,
        classId: string
    ) => {
        if (!subjectId || !classId) {
            return false;
        }

        return assignments.some(
            (assignment, currentIndex) =>
                currentIndex !== index &&
                assignment.subjectId === subjectId &&
                assignment.classId === classId
        );
    };

    const handleSubmit = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();

        if (saving) {
            return;
        }

        if (!formData.name.trim()) {
            showModal(
                "Validation Error",
                "Please enter the teacher's name."
            );
            return;
        }

        if (!isAdding && !id) {
            showModal(
                "Error",
                "Teacher ID is missing. Please reopen the edit form."
            );
            return;
        }

        if (!assignments.length) {
            showModal(
                "Validation Error",
                "Please add at least one subject and class assignment."
            );
            return;
        }

        const incompleteAssignment = assignments.some(
            (assignment) =>
                !assignment.subjectId || !assignment.classId
        );

        if (incompleteAssignment) {
            showModal(
                "Validation Error",
                "Please select both a class and a subject for every assignment."
            );
            return;
        }

        // Verify that every selected subject belongs to its selected class.
        const invalidAssignment = assignments.some((assignment) => {
            const selectedClass = classes.find(
                (item) => item._id === assignment.classId
            );

            const selectedSubject = subjects.find(
                (item) => item._id === assignment.subjectId
            );

            return (
                !selectedClass ||
                !selectedSubject ||
                selectedSubject.class !== selectedClass.class
            );
        });

        if (invalidAssignment) {
            showModal(
                "Validation Error",
                "One or more selected subjects do not belong to their selected classes. Please check your assignments."
            );
            return;
        }

        const duplicateAssignment = assignments.some(
            (assignment, index) =>
                isDuplicateAssignment(
                    index,
                    assignment.subjectId,
                    assignment.classId
                )
        );

        if (duplicateAssignment) {
            showModal(
                "Validation Error",
                "The same subject and class cannot be assigned more than once to this teacher."
            );
            return;
        }

        if (isAdding && !formData.password.trim()) {
            showModal(
                "Validation Error",
                "Please enter a password for the new teacher."
            );
            return;
        }

        if (
            !isAdding &&
            (!formData.uid.trim() || !formData.employeeID.trim())
        ) {
            showModal(
                "Validation Error",
                "UID and employee ID are required."
            );
            return;
        }

        setSaving(true);

        try {
            const dataToSubmit = {
                name: formData.name.trim(),
                password: formData.password,
                ...(isAdding
                    ? {}
                    : {
                          uid: formData.uid.trim(),
                          employeeID: formData.employeeID.trim(),
                      }),
                assignments: assignments.map((assignment) => ({
                    subjectId: assignment.subjectId,
                    classId: assignment.classId,
                })),
            };

            if (isAdding) {
                await addTeacher(dataToSubmit);

                showModal("Success", "Teacher Added");
            } else if (id) {
                await updateTeacher(id, dataToSubmit);

                showModal("Success", "Teacher Updated");
            }
        } catch (error) {
            console.error("Failed to save teacher:", error);

            showModal(
                "Error",
                getErrorMessage(error, "Failed to save teacher.")
            );
        } finally {
            setSaving(false);
        }
    };

    const handleModalClose = () => {
        setModalOpen(false);

        if (
            modalMessage === "Teacher Added" ||
            modalMessage === "Teacher Updated"
        ) {
            navigate(-1);
        }
    };

    return (
        <div className="flex min-h-screen flex-col font-fredoka">
            <NavBar />

            <div className="flex flex-1 bg-purple-100">
                <SideBar />

                <div className="min-w-0 flex-1">
                    <Breadcrumb />

                    {loadingOptions || loadingTeacher ? (
                        <p className="p-8 text-purple-950">
                            {loadingTeacher
                                ? "Loading teacher details..."
                                : "Loading subjects and classes..."}
                        </p>
                    ) : (
                        <form
                            onSubmit={handleSubmit}
                            className="flex flex-col gap-7 p-8 md:p-15"
                        >
                            <div className="flex flex-col gap-2">
                                <label htmlFor="name">
                                    Teacher Name:
                                </label>

                                <input
                                    required
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData((previous) => ({
                                            ...previous,
                                            name: e.target.value,
                                        }))
                                    }
                                    className="w-full max-w-sm rounded-sm border-2 border-gray-500 p-2 transition-colors duration-300 ease-in-out focus:border-gray-900 focus:outline-none"
                                    type="text"
                                    id="name"
                                    placeholder="Enter Teacher Name"
                                    name="name"
                                />
                            </div>

                            {!isAdding && (
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="uid">
                                        UID:
                                    </label>

                                    <input
                                        required
                                        value={formData.uid}
                                        onChange={(e) =>
                                            setFormData((previous) => ({
                                                ...previous,
                                                uid: e.target.value,
                                            }))
                                        }
                                        className="w-full max-w-sm rounded-sm border-2 border-gray-500 p-2 transition-colors duration-300 ease-in-out focus:border-gray-900 focus:outline-none"
                                        type="text"
                                        id="uid"
                                        placeholder="Enter UID"
                                        name="uid"
                                    />
                                </div>
                            )}

                            <div className="flex flex-col gap-2">
                                <label htmlFor="password">
                                    Password:
                                </label>

                                <input
                                    required={isAdding}
                                    value={formData.password}
                                    onChange={(e) =>
                                        setFormData((previous) => ({
                                            ...previous,
                                            password: e.target.value,
                                        }))
                                    }
                                    className="w-full max-w-sm rounded-sm border-2 border-gray-500 p-2 transition-colors duration-300 ease-in-out focus:border-gray-900 focus:outline-none"
                                    type="password"
                                    id="password"
                                    placeholder={
                                        isAdding
                                            ? "Enter Password"
                                            : "Leave blank to keep current password"
                                    }
                                    name="password"
                                />
                            </div>

                            {!isAdding && (
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="employeeID">
                                        Employee ID:
                                    </label>

                                    <input
                                        required
                                        value={formData.employeeID}
                                        onChange={(e) =>
                                            setFormData((previous) => ({
                                                ...previous,
                                                employeeID: e.target.value,
                                            }))
                                        }
                                        className="w-full max-w-sm rounded-sm border-2 border-gray-500 p-2 transition-colors duration-300 ease-in-out focus:border-gray-900 focus:outline-none"
                                        type="text"
                                        id="employeeID"
                                        placeholder="Enter Employee ID"
                                        name="employeeID"
                                    />
                                </div>
                            )}

                            <div className="flex flex-col gap-4">
                                <div>
                                    <h2 className="text-lg font-medium text-purple-950">
                                        Subject and Class Assignments
                                    </h2>

                                    <p className="mt-1 text-sm text-gray-700">
                                        Add every subject and class this
                                        teacher will teach.
                                    </p>
                                </div>

                                {assignments.map((assignment, index) => {
                                    const availableSubjects =
                                        getSubjectsForClass(
                                            assignment.classId
                                        );

                                    const duplicate =
                                        isDuplicateAssignment(
                                            index,
                                            assignment.subjectId,
                                            assignment.classId
                                        );

                                    return (
                                        <div
                                            key={index}
                                            className="flex w-full max-w-3xl flex-col gap-4 rounded-lg border border-purple-300 bg-white p-4 md:flex-row md:items-end"
                                        >
                                            <div className="flex flex-1 flex-col gap-2">
                                                <label
                                                    htmlFor={`class-${index}`}
                                                >
                                                    Class:
                                                </label>

                                                <select
                                                    required
                                                    id={`class-${index}`}
                                                    value={assignment.classId}
                                                    onChange={(e) =>
                                                        handleClassChange(
                                                            index,
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-full rounded-sm border-2 border-gray-300 p-2 focus:border-purple-700 focus:outline-none"
                                                >
                                                    <option
                                                        value=""
                                                        disabled
                                                    >
                                                        Select a class
                                                    </option>

                                                    {classes.map((item) => (
                                                        <option
                                                            key={item._id}
                                                            value={item._id}
                                                        >
                                                            {item.class}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="flex flex-1 flex-col gap-2">
                                                <label
                                                    htmlFor={`subject-${index}`}
                                                >
                                                    Subject:
                                                </label>

                                                <select
                                                    required
                                                    id={`subject-${index}`}
                                                    value={assignment.subjectId}
                                                    disabled={
                                                        !assignment.classId
                                                    }
                                                    onChange={(e) =>
                                                        updateAssignment(
                                                            index,
                                                            "subjectId",
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-full rounded-sm border-2 border-gray-300 p-2 focus:border-purple-700 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100"
                                                >
                                                    <option
                                                        value=""
                                                        disabled
                                                    >
                                                        {!assignment.classId
                                                            ? "Select a class first"
                                                            : "Select a subject"}
                                                    </option>

                                                    {availableSubjects.map(
                                                        (subject) => (
                                                            <option
                                                                key={
                                                                    subject._id
                                                                }
                                                                value={
                                                                    subject._id
                                                                }
                                                            >
                                                                {subject.name}
                                                            </option>
                                                        )
                                                    )}
                                                </select>

                                                {assignment.classId &&
                                                    availableSubjects.length ===
                                                        0 && (
                                                        <p className="text-sm text-red-600">
                                                            No subjects are
                                                            available for this
                                                            class.
                                                        </p>
                                                    )}

                                                {duplicate && (
                                                    <p className="text-sm text-red-600">
                                                        This subject and class
                                                        are already listed.
                                                    </p>
                                                )}
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeAssignmentRow(index)
                                                }
                                                className="rounded-lg border border-red-300 px-4 py-2 text-red-700 transition-colors hover:bg-red-50"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    );
                                })}

                                <button
                                    type="button"
                                    onClick={addAssignmentRow}
                                    className="self-start rounded-lg border border-purple-400 px-5 py-2 font-medium text-purple-950 transition-colors hover:bg-purple-200"
                                >
                                    + Add another assignment
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-5">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="cursor-pointer rounded-lg bg-purple-300 px-6 py-3 font-medium text-purple-950 shadow-[0_2px_3px] transition-colors hover:bg-violet-300 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {saving
                                        ? "Saving..."
                                        : isAdding
                                          ? "Add Teacher"
                                          : "Update Teacher"}
                                </button>

                                <button
                                    onClick={() => navigate(-1)}
                                    type="button"
                                    disabled={saving}
                                    className="cursor-pointer rounded-lg bg-purple-300 px-6 py-3 font-medium text-purple-950 shadow-[0_2px_3px] transition-colors hover:bg-violet-300 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            <Modal
                isOpen={modalOpen}
                message={modalMessage}
                onClose={handleModalClose}
                title={modalTitle}
            />
        </div>
    );
}

export default TeacherForm;