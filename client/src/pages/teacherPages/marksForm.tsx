import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
    addMark,
    updateMark,
    getMarkById,
    viewStudents,
    getTeacherSubjects
} from "../../services/teacherApi";
import { useState, useEffect } from "react";
import Breadcrumb from "../../components/breadcrumb";
import Modal from "../../components/modal";

type Student = {
    _id: string;
    userId: {
        name: string;
        uid: string;
    };
    class: string;
    rollNumber: number;
};

type TeacherSubject = {
    _id: string;
    name: string;
    class: string;
    subjectCode: string;
};

type FormData = {
    studentId: string;
    subjectName: string;
    exam: string;
    marksObtained: string;
    totalMarks: string;
};

const examMaxMarks: Record<string, number> = {
    "class test": 40,
    "mid term": 80,
    "final": 100
};

function MarksForm() {
    const [searchParams] = useSearchParams();
    const mode = searchParams.get("mode");
    const id = searchParams.get("id");
    const isAdding = mode === "add";

    const navigate = useNavigate();

    const [students, setStudents] = useState<Student[]>([]);
    const [teacherSubjects, setTeacherSubjects] = useState<TeacherSubject[]>([]);
    const [selectedStudentClass, setSelectedStudentClass] = useState("");
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [loadingSubjects, setLoadingSubjects] = useState(true);

    const [formData, setFormData] = useState<FormData>({
        studentId: "",
        subjectName: "",
        exam: "",
        marksObtained: "",
        totalMarks: ""
    });

    const [modalOpen, setModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [modalMessage, setModalMessage] = useState("");

    const currentStudentClass = isAdding
        ? students.find(student => student._id === formData.studentId)?.class ?? ""
        : selectedStudentClass;

    const availableSubjects = teacherSubjects.filter(
        subject => subject.class === currentStudentClass
    );

    // Automatically synchronize maximum marks with the exam type.
    useEffect(() => {
        const maxMarks = examMaxMarks[formData.exam];

        if (maxMarks === undefined) return;

        setFormData(previous => ({
            ...previous,
            totalMarks: String(maxMarks),
            marksObtained:
                previous.marksObtained !== "" &&
                    Number(previous.marksObtained) > maxMarks
                    ? ""
                    : previous.marksObtained
        }));
    }, [formData.exam]);

    // Fetch subjects assigned to the logged-in teacher.
    useEffect(() => {
        let cancelled = false;

        const fetchSubjects = async () => {
            setLoadingSubjects(true);

            try {
                const response = await getTeacherSubjects();

                if (cancelled) return;

                const subjects: TeacherSubject[] =
                    response.data.subjects ?? [];

                setTeacherSubjects(subjects);
            } catch (error) {
                if (!cancelled) {
                    console.error("Failed to fetch assigned subjects:", error);
                    setTeacherSubjects([]);
                }
            } finally {
                if (!cancelled) {
                    setLoadingSubjects(false);
                }
            }
        };

        void fetchSubjects();

        return () => {
            cancelled = true;
        };
    }, []);

    // Fetch students only when adding marks.
    useEffect(() => {
        if (!isAdding) return;

        let cancelled = false;

        const fetchStudents = async () => {
            setLoadingStudents(true);

            try {
                const response = await viewStudents(
                    "",
                    "",
                    "asc",
                    1,
                    1000,
                    false,
                    "All"
                );

                if (cancelled) return;

                setStudents(response.data.students ?? []);
            } catch (error) {
                if (!cancelled) {
                    console.error("Failed to fetch students:", error);
                    setStudents([]);
                }
            } finally {
                if (!cancelled) {
                    setLoadingStudents(false);
                }
            }
        };

        void fetchStudents();

        return () => {
            cancelled = true;
        };
    }, [isAdding]);

    // Fetch the existing mark when editing.
    useEffect(() => {
        if (isAdding || !id) return;

        let cancelled = false;

        const fetchMark = async () => {
            try {
                const response = await getMarkById(id);

                if (cancelled) return;

                const mark = response.data;
                const studentClass = mark.studentId?.class ?? "";
                const exam = mark.exam ?? "";

                setSelectedStudentClass(studentClass);

                setFormData({
                    studentId: mark.studentId?._id ?? "",
                    subjectName: mark.subjectId?.name ?? "",
                    exam,
                    marksObtained: String(mark.marksObtained ?? ""),
                    totalMarks: String(
                        examMaxMarks[exam] ?? mark.totalMarks ?? ""
                    )
                });
            } catch (error) {
                if (!cancelled) {
                    console.error("Failed to fetch mark:", error);
                }
            }
        };

        void fetchMark();

        return () => {
            cancelled = true;
        };
    }, [id, isAdding]);

    // Clear an invalid subject when the student's class changes.
    useEffect(() => {
        if (loadingSubjects || !currentStudentClass) return;

        const subjectIsAvailable = availableSubjects.some(
            subject => subject.name === formData.subjectName
        );

        if (formData.subjectName && !subjectIsAvailable) {
            setFormData(previous => ({
                ...previous,
                subjectName: ""
            }));
        }
    }, [
        currentStudentClass,
        loadingSubjects,
        teacherSubjects,
        formData.subjectName
    ]);

    const handleStudentChange = (studentId: string) => {
        const newStudent = students.find(
            student => student._id === studentId
        );

        const newClass = newStudent?.class ?? "";

        const currentSubjectIsAvailable = teacherSubjects.some(
            subject =>
                subject.class === newClass &&
                subject.name === formData.subjectName
        );

        setFormData(previous => ({
            ...previous,
            studentId,
            subjectName: currentSubjectIsAvailable
                ? previous.subjectName
                : ""
        }));
    };

    const handleExamChange = (exam: string) => {
        const maxMarks = examMaxMarks[exam];

        setFormData(previous => ({
            ...previous,
            exam,
            totalMarks: maxMarks === undefined ? "" : String(maxMarks),
            marksObtained:
                maxMarks !== undefined &&
                    previous.marksObtained !== "" &&
                    Number(previous.marksObtained) > maxMarks
                    ? ""
                    : previous.marksObtained
        }));
    };

    const handleSubmit = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();

        try {
            if (loadingSubjects || teacherSubjects.length === 0) {
                setModalTitle("Validation Error");
                setModalMessage("No assigned subjects are available.");
                setModalOpen(true);
                return;
            }

            if (isAdding && !formData.studentId) {
                setModalTitle("Validation Error");
                setModalMessage("Please select a student.");
                setModalOpen(true);
                return;
            }

            if (!currentStudentClass) {
                setModalTitle("Validation Error");
                setModalMessage(
                    "Unable to determine the student's class. Please check the student details."
                );
                setModalOpen(true);
                return;
            }

            const validSubject = teacherSubjects.some(
                subject =>
                    subject.name === formData.subjectName &&
                    subject.class === currentStudentClass
            );

            if (!validSubject) {
                setModalTitle("Validation Error");
                setModalMessage(
                    "Please select a subject assigned to you for this student's class."
                );
                setModalOpen(true);
                return;
            }

            const maxMarks = examMaxMarks[formData.exam];
            const obtainedMarks = Number(formData.marksObtained);

            if (maxMarks === undefined) {
                setModalTitle("Validation Error");
                setModalMessage("Please select a valid exam type.");
                setModalOpen(true);
                return;
            }

            if (
                formData.marksObtained.trim() === "" ||
                !Number.isFinite(obtainedMarks) ||
                obtainedMarks < 0 ||
                obtainedMarks > maxMarks
            ) {
                setModalTitle("Validation Error");
                setModalMessage(
                    `Marks obtained must be between 0 and ${maxMarks}.`
                );
                setModalOpen(true);
                return;
            }

            // Always send the correct maximum for the selected exam.
            const payload = {
                ...formData,
                totalMarks: String(maxMarks)
            };

            if (isAdding) {
                await addMark(payload);

                setModalTitle("Success");
                setModalMessage("Marks Added");
            } else {
                if (!id) return;

                await updateMark(id, payload);

                setModalTitle("Success");
                setModalMessage("Marks Updated");
            }

            setModalOpen(true);
        } catch (error: any) {
            console.error(error);

            setModalTitle("Error");
            setModalMessage(
                error.response?.data?.message || "Failed to save marks."
            );

            setModalOpen(true);
        }
    };

    const handleModalClose = () => {
        setModalOpen(false);

        if (
            modalMessage === "Marks Added" ||
            modalMessage === "Marks Updated"
        ) {
            navigate(-1);
        }
    };

    const inputClass =
        "w-sm rounded-sm border-2 border-gray-500 p-2 focus:border-gray-900 focus:outline-none transition-colors duration-300 ease-in-out";

    return (
        <div className="flex min-h-screen flex-col font-fredoka">
            <NavBar />

            <div className="flex flex-1 bg-purple-100">
                <SideBar />

                <div>
                    <Breadcrumb />

                    <form
                        onSubmit={handleSubmit}
                        className="flex flex-col gap-7 p-15"
                    >
                        {isAdding && (
                            <div className="flex flex-col gap-2">
                                <label htmlFor="student">Student:</label>

                                <select
                                    id="student"
                                    required
                                    value={formData.studentId}
                                    disabled={loadingStudents}
                                    onChange={e =>
                                        handleStudentChange(e.target.value)
                                    }
                                    className={`${inputClass} disabled:cursor-not-allowed disabled:bg-gray-200`}
                                >
                                    <option value="" disabled>
                                        {loadingStudents
                                            ? "Loading students..."
                                            : "Select a student"}
                                    </option>

                                    {students.map(student => (
                                        <option
                                            key={student._id}
                                            value={student._id}
                                        >
                                            {student.userId.name} -{" "}
                                            {student.userId.uid.toUpperCase()}{" "}
                                            — Class {student.class}
                                        </option>
                                    ))}
                                </select>

                                {!loadingStudents && students.length === 0 && (
                                    <p className="text-sm text-gray-600">
                                        No students found in your assigned classes.
                                    </p>
                                )}
                            </div>
                        )}

                        {!isAdding && selectedStudentClass && (
                            <div className="flex flex-col gap-2">
                                <label>Student's Class:</label>
                                <p className="text-gray-700">
                                    Class {selectedStudentClass}
                                </p>
                            </div>
                        )}

                        <div className="flex flex-col gap-2">
                            <label htmlFor="subject">Subject:</label>

                            <select
                                id="subject"
                                required
                                disabled={
                                    loadingSubjects ||
                                    !currentStudentClass ||
                                    availableSubjects.length === 0
                                }
                                value={formData.subjectName}
                                onChange={e =>
                                    setFormData(previous => ({
                                        ...previous,
                                        subjectName: e.target.value
                                    }))
                                }
                                className={`${inputClass} disabled:cursor-not-allowed disabled:bg-gray-200`}
                            >
                                <option value="" disabled>
                                    {loadingSubjects
                                        ? "Loading assigned subjects..."
                                        : !currentStudentClass
                                            ? "Select a student first"
                                            : availableSubjects.length === 0
                                                ? "No assigned subjects for this class"
                                                : "Select a subject"}
                                </option>

                                {availableSubjects.map(subject => (
                                    <option
                                        key={`${subject._id}-${subject.class}`}
                                        value={subject.name}
                                    >
                                        {subject.name} — Class {subject.class}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label htmlFor="exam">Exam type:</label>

                            <select
                                id="exam"
                                required
                                value={formData.exam}
                                onChange={e =>
                                    handleExamChange(e.target.value)
                                }
                                className={inputClass}
                            >
                                <option value="" disabled>
                                    Select an exam
                                </option>
                                <option value="class test">Class test</option>
                                <option value="mid term">Mid term</option>
                                <option value="final">Final</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label htmlFor="obt">Marks Obtained:</label>

                            <input
                                id="obt"
                                name="obt"
                                type="number"
                                required
                                min="0"
                                max={
                                    examMaxMarks[formData.exam] ?? undefined
                                }
                                step="1"
                                value={formData.marksObtained}
                                onChange={e =>
                                    setFormData(previous => ({
                                        ...previous,
                                        marksObtained: e.target.value
                                    }))
                                }
                                className={inputClass}
                                placeholder="Enter Marks Obtained"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label htmlFor="max">Max Marks:</label>

                            <input
                                id="max"
                                name="max"
                                type="number"
                                readOnly
                                required
                                min="1"
                                value={formData.totalMarks}
                                className={`${inputClass} cursor-not-allowed bg-gray-200`}
                                placeholder="Select an exam first"
                            />
                        </div>

                        <div className="flex gap-5">
                            <button
                                type="submit"
                                disabled={
                                    loadingSubjects ||
                                    teacherSubjects.length === 0 ||
                                    (isAdding && loadingStudents)
                                }
                                className="cursor-pointer rounded-lg bg-purple-300 px-6 py-3 font-medium text-purple-950 shadow-[0_2px_3px] transition-colors hover:bg-violet-300 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isAdding ? "Add" : "Update"}
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="cursor-pointer rounded-lg bg-purple-300 px-6 py-3 font-medium text-purple-950 shadow-[0_2px_3px] transition-colors hover:bg-violet-300"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <Modal
                isOpen={modalOpen}
                title={modalTitle}
                message={modalMessage}
                onClose={handleModalClose}
            />
        </div>
    );
}

export default MarksForm;