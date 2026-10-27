import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import Breadcrumb from "../../components/breadcrumb";
import Modal from "../../components/modal";

import {
    getTeacherById,
    deactivateTeacher,
    activateTeacher,
    updateTeacherProfile,
    getTeachersForArrangement,
} from "../../services/principalApi";

import teacher1 from "../../assets/profiles/profile1.png";
import teacher2 from "../../assets/profiles/profile2.png";
import teacher3 from "../../assets/profiles/profile3.png";
import teacher4 from "../../assets/profiles/profile4.png";
import teacher5 from "../../assets/profiles/profile5.png";

type SubjectAssignment = {
    subjectId: {
        _id: string;
        name: string;
        subjectCode?: string;
    };
    classId: {
        _id: string;
        class: string;
    };
};

type TeacherInfo = {
    _id: string;
    employeeID: string;
    isDeleted?: boolean;
    isClassTeacher?: boolean;
    assignments: SubjectAssignment[];
    classes: string[];
    subjects: string[];
    userId: {
        _id?: string;
        name: string;
        uid: string;
        role: string;
        isActive?: boolean;
    };
};

type ArrangementTeacher = {
    _id: string;
    employeeID: string;
    classes: string[];
    subjects: string[];
    assignments?: SubjectAssignment[];
    userId: {
        name: string;
        uid: string;
        isActive: boolean;
    };
};

type EditableTeacher = {
    name: string;
    uid: string;
    employeeID: string;
};

type FieldConfig = {
    key: keyof EditableTeacher;
    label: string;
};

type TeacherResponse = {
    teacher?: TeacherInfo;
} & Partial<TeacherInfo>;

type ArrangementResponse = {
    teachers?: ArrangementTeacher[];
};

type ArrangementSelection = {
    class: string;
    subjectId: string;
    arrangedTeacherId: string;
};

const initialFormData: EditableTeacher = {
    name: "",
    uid: "",
    employeeID: "",
};

const accountFields: FieldConfig[] = [
    { key: "name", label: "Name" },
    { key: "uid", label: "UID" },
];

const professionalFields: FieldConfig[] = [
    { key: "employeeID", label: "Employee ID" },
];

function sortClasses(classes: string[] = []) {
    return [...new Set(classes)].sort((a, b) => {
        const numberA = parseInt(a.match(/\d+/)?.[0] ?? "0", 10);
        const numberB = parseInt(b.match(/\d+/)?.[0] ?? "0", 10);

        return numberA - numberB;
    });
}

function getTeacherAssignments(
    teacher: TeacherInfo
): SubjectAssignment[] {
    return Array.isArray(teacher.assignments)
        ? teacher.assignments
        : [];
}

function getAssignmentKey(
    className: string,
    subjectId: string
) {
    return `${className}:${subjectId}`;
}

function TeacherProfile() {
    const teacherPhotos = [
        teacher1,
        teacher2,
        teacher3,
        teacher4,
        teacher5,
    ];

    const [searchParams] = useSearchParams();
    const id = searchParams.get("id");

    const [teacherInfo, setTeacherInfo] =
        useState<TeacherInfo | null>(null);

    const [savedData, setSavedData] =
        useState<EditableTeacher>(initialFormData);

    const [formData, setFormData] =
        useState<EditableTeacher>(initialFormData);

    const [editingSection, setEditingSection] =
        useState<string | null>(null);

    const [savingSection, setSavingSection] = useState(false);

    const [modalOpen, setModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [modalMessage, setModalMessage] = useState("");

    const [confirmAction, setConfirmAction] =
        useState<(() => void | Promise<void>) | undefined>();

    const [accountActionPending, setAccountActionPending] =
        useState(false);

    // Temporary arrangement modal state.
    const [arrangementModalOpen, setArrangementModalOpen] =
        useState(false);

    // Eligible replacement teachers grouped by class.
    const [arrangementTeachersByClass, setArrangementTeachersByClass] =
        useState<Record<string, ArrangementTeacher[]>>({});

    // One replacement selection for every class-subject assignment.
    const [arrangements, setArrangements] =
        useState<ArrangementSelection[]>([]);

    const [loadingArrangementClasses, setLoadingArrangementClasses] =
        useState<string[]>([]);

    const [savingArrangement, setSavingArrangement] =
        useState(false);

    const [loadingProfile, setLoadingProfile] = useState(true);
    const [profileError, setProfileError] = useState("");

    const employeeNumber = teacherInfo
        ? parseInt(teacherInfo.employeeID.replace("EMP", ""), 10)
        : 0;

    const photoIndex = employeeNumber > 0
        ? (employeeNumber - 1) % teacherPhotos.length
        : 0;

    const teacherPhoto = teacherPhotos[photoIndex];

    const isAccountActive = teacherInfo?.userId?.isActive !== false;

    const assignedClasses = sortClasses(
        teacherInfo?.classes ?? []
    );

    const assignedSubjects = [
        ...new Set(
            teacherInfo?.subjects?.length
                ? teacherInfo.subjects
                : getTeacherAssignments(
                    teacherInfo ?? ({} as TeacherInfo)
                )
                    .map((assignment) => assignment.subjectId?.name)
                    .filter((name): name is string => Boolean(name))
        ),
    ].sort((a, b) => a.localeCompare(b));

    const teacherAssignments = teacherInfo
        ? getTeacherAssignments(teacherInfo).filter(
            (assignment) =>
                Boolean(assignment.subjectId?._id) &&
                Boolean(assignment.classId?.class)
        )
        : [];

    const assignmentCount = teacherAssignments.length;

    const selectedArrangementCount = arrangements.filter(
        (arrangement) => Boolean(arrangement.arrangedTeacherId)
    ).length;

    const allAssignmentsCovered =
        assignmentCount > 0 &&
        teacherAssignments.every((assignment) =>
            arrangements.some(
                (arrangement) =>
                    arrangement.class === assignment.classId.class &&
                    arrangement.subjectId === assignment.subjectId._id &&
                    Boolean(arrangement.arrangedTeacherId)
            )
        );

    const fetchTeacher = useCallback(async () => {
        if (!id) {
            throw new Error("Teacher ID is missing from the URL.");
        }

        const response = await getTeacherById(id);

        const result: TeacherResponse = response?.data ?? response;
        const teacher = (result.teacher ?? result) as TeacherInfo;

        if (!teacher?._id) {
            throw new Error("The teacher profile was not found.");
        }

        const normalizedTeacher: TeacherInfo = {
            ...teacher,
            assignments: Array.isArray(teacher.assignments)
                ? teacher.assignments
                : [],
            classes: sortClasses(teacher.classes ?? []),
            subjects: teacher.subjects ?? [],
            userId: teacher.userId,
        };

        const data: EditableTeacher = {
            name: normalizedTeacher.userId?.name ?? "",
            uid: normalizedTeacher.userId?.uid ?? "",
            employeeID: normalizedTeacher.employeeID ?? "",
        };

        setTeacherInfo(normalizedTeacher);
        setSavedData(data);
        setFormData(data);
    }, [id]);

    useEffect(() => {
        let cancelled = false;

        async function loadTeacher() {
            try {
                setLoadingProfile(true);
                setProfileError("");

                if (!id) {
                    throw new Error("Teacher ID is missing from the URL.");
                }

                await fetchTeacher();
            } catch (error: any) {
                console.error("Failed to load teacher profile:", error);

                if (!cancelled) {
                    setProfileError(
                        error.response?.data?.message ??
                        error.message ??
                        "Failed to load teacher profile."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoadingProfile(false);
                }
            }
        }

        void loadTeacher();

        return () => {
            cancelled = true;
        };
    }, [id, fetchTeacher]);

    function updateField(key: keyof EditableTeacher, value: string) {
        setFormData((previous) => ({
            ...previous,
            [key]: value,
        }));
    }

    function handleEdit(section: string) {
        setFormData({ ...savedData });
        setEditingSection(section);
    }

    function handleCancelEdit() {
        setFormData({ ...savedData });
        setEditingSection(null);
    }

    async function handleSaveSection() {
        if (!teacherInfo || !editingSection || savingSection) {
            return;
        }

        const sectionFields: (keyof EditableTeacher)[] =
            editingSection === "account"
                ? ["name", "uid"]
                : editingSection === "professional"
                    ? ["employeeID"]
                    : [];

        if (sectionFields.length === 0) {
            return;
        }

        const payload: Partial<EditableTeacher> = {};

        for (const key of sectionFields) {
            const value = formData[key].trim();

            if (!value) {
                const field = key === "uid"
                    ? "UID"
                    : key === "employeeID"
                        ? "Employee ID"
                        : "Name";

                setModalTitle("Validation Error");
                setModalMessage(`${field} cannot be empty.`);
                setConfirmAction(undefined);
                setModalOpen(true);

                return;
            }

            payload[key] = value;
        }

        const hasChanges = sectionFields.some(
            (key) => formData[key].trim() !== savedData[key].trim()
        );

        if (!hasChanges) {
            setFormData({ ...savedData });
            setEditingSection(null);
            return;
        }

        try {
            setSavingSection(true);

            await updateTeacherProfile(teacherInfo._id, payload);
            await fetchTeacher();

            setEditingSection(null);
            setModalTitle("Success");
            setModalMessage("Teacher profile updated successfully.");
            setConfirmAction(undefined);
            setModalOpen(true);
        } catch (error: any) {
            console.error("Failed to update teacher profile:", error);

            setModalTitle("Error");
            setModalMessage(
                error.response?.data?.message ??
                "Failed to update teacher profile. Your saved profile has not been changed."
            );

            setConfirmAction(undefined);
            setModalOpen(true);
        } finally {
            setSavingSection(false);
        }
    }

    function renderField(section: string, field: FieldConfig) {
        const isEditing = editingSection === section;

        const value = isEditing
            ? formData[field.key]
            : savedData[field.key];

        return (
            <div key={field.key} className="min-w-0">
                <label
                    htmlFor={`${section}-${field.key}`}
                    className="text-sm font-medium text-gray-500"
                >
                    {field.label}
                </label>

                {isEditing ? (
                    <input
                        id={`${section}-${field.key}`}
                        type="text"
                        value={formData[field.key]}
                        onChange={(event) =>
                            updateField(field.key, event.target.value)
                        }
                        disabled={savingSection}
                        className="mt-1 w-full rounded-lg border border-purple-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200 disabled:opacity-60"
                    />
                ) : (
                    <p className="mt-1 break-words font-medium text-gray-900">
                        {field.key === "uid" || field.key === "employeeID"
                            ? value.toUpperCase() || "Not available"
                            : value || "Not available"}
                    </p>
                )}
            </div>
        );
    }

    function renderSection(
        section: string,
        title: string,
        fields: FieldConfig[]
    ) {
        const isEditing = editingSection === section;

        return (
            <section
                key={section}
                className="rounded-lg bg-purple-200 p-6 shadow-md"
            >
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-purple-300 pb-4">
                    <h2 className="text-xl font-semibold text-purple-950">
                        {title}
                    </h2>

                    {!isEditing ? (
                        <button
                            type="button"
                            onClick={() => handleEdit(section)}
                            disabled={
                                savingSection ||
                                editingSection !== null ||
                                accountActionPending
                            }
                            className="cursor-pointer rounded-lg bg-purple-300 px-4 py-2 font-medium text-purple-950 transition-colors hover:bg-violet-300 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Edit
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                disabled={savingSection}
                                className="cursor-pointer rounded-lg border border-purple-400 px-4 py-2 font-medium text-purple-950 transition-colors hover:bg-purple-100 disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={() => void handleSaveSection()}
                                disabled={savingSection}
                                className="cursor-pointer rounded-lg bg-purple-700 px-4 py-2 font-medium text-white transition-colors hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {savingSection ? "Saving..." : "Save"}
                            </button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                    {fields.map((field) => renderField(section, field))}
                </div>
            </section>
        );
    }

    function openArrangementModal() {
        setArrangements([]);
        setArrangementTeachersByClass({});
        setLoadingArrangementClasses([]);
        setArrangementModalOpen(true);

        if (teacherAssignments.length === 0) {
            setModalTitle("Cannot Deactivate Teacher");
            setModalMessage(
                "This teacher has no subject assignments to arrange."
            );
            setConfirmAction(undefined);
            setModalOpen(true);

            setArrangementModalOpen(false);
            return;
        }

        void loadArrangementTeachers();
    }

    async function loadArrangementTeachers() {
        if (!teacherInfo) {
            return;
        }

        // Get every class-subject assignment that needs a replacement.
        const assignmentsToLoad = teacherAssignments;

        const classes = sortClasses(
            assignmentsToLoad.map(
                (assignment) => assignment.classId.class
            )
        );

        setLoadingArrangementClasses(classes);

        try {
            // Fetch eligible teachers separately for each assignment.
            const results = await Promise.all(
                assignmentsToLoad.map(async (assignment) => {
                    const className = assignment.classId.class;
                    const subjectId = assignment.subjectId._id;

                    const response = await getTeachersForArrangement(
                        assignment.subjectId.name
                    );

                    const result: ArrangementResponse =
                        response?.data ?? response;

                    const teachers = (result.teachers ?? []).filter(
                        (teacher) =>
                            teacher._id !== teacherInfo._id &&
                            teacher.userId?.isActive === true
                    );

                    return {
                        key: getAssignmentKey(className, subjectId),
                        teachers,
                    };
                })
            );

            const teachersByAssignment: Record<
                string,
                ArrangementTeacher[]
            > = {};

            for (const result of results) {
                teachersByAssignment[result.key] = result.teachers;
            }

            setArrangementTeachersByClass(teachersByAssignment);
        } catch (error: any) {
            console.error(
                "Failed to load arrangement teachers:",
                error
            );

            setModalTitle("Error");
            setModalMessage(
                error.response?.data?.message ??
                "Failed to load eligible replacement teachers."
            );

            setConfirmAction(undefined);
            setModalOpen(true);
        } finally {
            setLoadingArrangementClasses([]);
        }
    }

    function isClassLoading(className: string) {
        return loadingArrangementClasses.includes(className);
    }

    function getEligibleTeachersForAssignment(
        assignment: SubjectAssignment
    ) {
        const key = getAssignmentKey(
            assignment.classId.class,
            assignment.subjectId._id
        );

        return arrangementTeachersByClass[key] ?? [];
    }

    function handleReplacementChange(
        assignment: SubjectAssignment,
        arrangedTeacherId: string
    ) {
        const className = assignment.classId.class;
        const subjectId = assignment.subjectId._id;

        const key = getAssignmentKey(className, subjectId);

        setArrangements((previous) => {
            const remaining = previous.filter(
                (item) =>
                    getAssignmentKey(item.class, item.subjectId) !== key
            );

            if (!arrangedTeacherId) {
                return remaining;
            }

            return [
                ...remaining,
                {
                    class: className,
                    subjectId,
                    arrangedTeacherId,
                },
            ];
        });
    }

    function getSelectedReplacement(
        assignment: SubjectAssignment
    ) {
        const key = getAssignmentKey(
            assignment.classId.class,
            assignment.subjectId._id
        );

        return arrangements.find(
            (item) =>
                getAssignmentKey(item.class, item.subjectId) === key
        )?.arrangedTeacherId ?? "";
    }

    async function handleAccountAction() {
        if (!teacherInfo || accountActionPending) {
            return;
        }

        if (isAccountActive) {
            openArrangementModal();
            return;
        }

        setModalTitle("Activate Account");
        setModalMessage(
            "Are you sure you want to activate this teacher's account?"
        );

        setConfirmAction(() => async () => {
            try {
                setAccountActionPending(true);

                await activateTeacher(teacherInfo._id);
                await fetchTeacher();

                setModalTitle("Success");
                setModalMessage("Teacher account activated successfully.");
            } catch (error: any) {
                console.error(error);

                setModalTitle("Error");
                setModalMessage(
                    error.response?.data?.message ??
                    "Failed to activate teacher account."
                );
            } finally {
                setAccountActionPending(false);
                setConfirmAction(undefined);
            }
        });

        setModalOpen(true);
    }

    async function handleConfirmArrangement() {
        if (
            !teacherInfo ||
            !allAssignmentsCovered ||
            savingArrangement
        ) {
            return;
        }

        // Prevent the same replacement teacher from being selected for
        // multiple subject assignments in the same class.
        const replacementKeys = arrangements.map(
            (item) => `${item.class}:${item.arrangedTeacherId}`
        );

        if (new Set(replacementKeys).size !== replacementKeys.length) {
            setModalTitle("Validation Error");
            setModalMessage(
                "The same replacement teacher cannot be assigned to multiple subject arrangements in the same class. Please select different replacement teachers."
            );
            setConfirmAction(undefined);
            setModalOpen(true);
            return;
        }

        try {
            setSavingArrangement(true);
            setAccountActionPending(true);

            await deactivateTeacher(teacherInfo._id, arrangements);
            setArrangementModalOpen(false);

            setArrangements([]);
            setArrangementTeachersByClass({});

            await fetchTeacher();

            setModalTitle("Success");
            setModalMessage(
                "Teacher account deactivated and temporary arrangements created successfully."
            );
            setConfirmAction(undefined);
            setModalOpen(true);
        } catch (error: any) {
            console.error("Failed to create teacher arrangement:", error);

            setModalTitle("Error");
            setModalMessage(
                error.response?.data?.message ??
                "Failed to create the temporary arrangement."
            );
            setConfirmAction(undefined);
            setModalOpen(true);
        } finally {
            setSavingArrangement(false);
            setAccountActionPending(false);
        }
    }

    if (loadingProfile) {
        return (
            <div className="flex min-h-screen flex-col font-fredoka">
                <NavBar />

                <div className="flex flex-1 bg-purple-100">
                    <SideBar />

                    <div className="flex flex-1 items-center justify-center p-8 text-gray-600">
                        Loading teacher profile...
                    </div>
                </div>
            </div>
        );
    }

    if (profileError || !teacherInfo) {
        return (
            <div className="flex min-h-screen flex-col font-fredoka">
                <NavBar />

                <div className="flex flex-1 bg-purple-100">
                    <SideBar />

                    <main className="flex flex-1 flex-col">
                        <Breadcrumb />

                        <div className="m-8 rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
                            <h1 className="text-xl font-semibold">
                                Unable to load teacher profile
                            </h1>

                            <p className="mt-2">
                                {profileError || "Teacher not found."}
                            </p>

                            <button
                                type="button"
                                onClick={() => window.location.reload()}
                                className="mt-4 rounded-lg bg-purple-700 px-4 py-2 text-white hover:bg-purple-800"
                            >
                                Try again
                            </button>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col font-fredoka">
            <NavBar />

            <div className="flex flex-1 bg-purple-100">
                <SideBar />

                <div className="min-w-0 flex-1">
                    <Breadcrumb />

                    <main className="px-6 py-8 lg:px-12 xl:px-16">
                        <div className="mb-8">
                            <h1 className="text-3xl font-semibold text-purple-950">
                                Teacher Profile
                            </h1>

                            <p className="mt-1 text-gray-600">
                                View and manage teacher account and professional information.
                            </p>
                        </div>

                        {/* Teacher summary */}
                        <div className="mb-7 rounded-lg bg-purple-200 p-6 shadow-md">
                            <div className="flex flex-col gap-8 md:flex-row md:items-center">
                                <div className="flex flex-col items-center md:min-w-40">
                                    <img
                                        src={teacherPhoto}
                                        alt="Teacher profile"
                                        className="h-32 w-32 rounded-full object-cover shadow-md"
                                    />

                                    <h2 className="mt-4 text-center text-xl font-semibold text-purple-950">
                                        {savedData.name || "Teacher"}
                                    </h2>

                                    <span className="mt-1 text-sm text-gray-600">
                                        Teacher
                                    </span>

                                    <span
                                        className={`mt-2 rounded-full px-3 py-1 text-sm font-medium ${isAccountActive
                                            ? "bg-green-100 text-green-800"
                                            : "bg-red-100 text-red-800"
                                            }`}
                                    >
                                        {isAccountActive ? "Active" : "Deactivated"}
                                    </span>
                                </div>

                                <div className="hidden h-32 w-px bg-purple-300 md:block" />

                                <div className="min-w-0 flex-1">
                                    <div className="grid grid-cols-1 gap-x-12 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">
                                                UID
                                            </p>

                                            <p className="mt-1 break-words font-medium text-gray-900">
                                                {savedData.uid.toUpperCase() || "Not available"}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-sm font-medium text-gray-500">
                                                Employee ID
                                            </p>

                                            <p className="mt-1 break-words font-medium text-gray-900">
                                                {savedData.employeeID.toUpperCase() || "Not available"}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-sm font-medium text-gray-500">
                                                Role
                                            </p>

                                            <p className="mt-1 font-medium capitalize text-gray-900">
                                                {teacherInfo.userId?.role || "Teacher"}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-sm font-medium text-gray-500">
                                                Assigned Classes
                                            </p>

                                            <div className="mt-2 flex flex-wrap gap-1.5">
                                                {assignedClasses.length > 0 ? (
                                                    assignedClasses.map((className) => (
                                                        <span
                                                            key={className}
                                                            className="rounded-md bg-purple-300 px-2.5 py-1 text-sm font-medium text-purple-950"
                                                        >
                                                            {className}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-sm text-gray-500">
                                                        No assigned classes
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="sm:col-span-2">
                                            <p className="text-sm font-medium text-gray-500">
                                                Assigned Subjects
                                            </p>

                                            <div className="mt-2 flex flex-wrap gap-1.5">
                                                {assignedSubjects.length > 0 ? (
                                                    assignedSubjects.map((subject) => (
                                                        <span
                                                            key={subject}
                                                            className="rounded-md bg-indigo-100 px-2.5 py-1 text-sm font-medium text-indigo-800"
                                                        >
                                                            {subject}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-sm text-gray-500">
                                                        No assigned subjects
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-sm font-medium text-gray-500">
                                                Account Status
                                            </p>

                                            <p
                                                className={`mt-1 font-medium ${isAccountActive
                                                    ? "text-green-700"
                                                    : "text-red-700"
                                                    }`}
                                            >
                                                {isAccountActive ? "Active" : "Deactivated"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Assignment details */}
                        <section className="mb-7 rounded-lg bg-purple-200 p-6 shadow-md">
                            <div className="mb-5 border-b border-purple-300 pb-4">
                                <h2 className="text-xl font-semibold text-purple-950">
                                    Subject Assignments
                                </h2>

                                <p className="mt-1 text-sm text-gray-600">
                                    Subjects taught by this teacher in each class.
                                </p>
                            </div>

                            {teacherAssignments.length === 0 ? (
                                <p className="py-3 text-sm text-gray-600">
                                    No subject assignment details are available.
                                </p>
                            ) : (
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                    {teacherAssignments.map((assignment) => {
                                        const subject = assignment.subjectId;
                                        const assignedClass = assignment.classId;

                                        return (
                                            <div
                                                key={`${subject._id}-${assignedClass._id}`}
                                                className="rounded-lg border border-purple-300 bg-purple-50 p-4"
                                            >
                                                <p className="font-semibold text-purple-950">
                                                    {subject.name}
                                                </p>

                                                {subject.subjectCode && (
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        Code: {subject.subjectCode}
                                                    </p>
                                                )}

                                                <div className="mt-3">
                                                    <span className="rounded-md bg-purple-200 px-2.5 py-1 text-sm font-medium text-purple-950">
                                                        Class {assignedClass.class}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </section>

                        {/* Editable profile information */}
                        <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
                            {renderSection(
                                "account",
                                "Account Information",
                                accountFields
                            )}

                            {renderSection(
                                "professional",
                                "Professional Information",
                                professionalFields
                            )}
                        </div>

                        {/* Account management */}
                        <div className="mt-7 rounded-lg bg-purple-200 p-6 shadow-md">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold text-purple-950">
                                        Account Management
                                    </h2>

                                    <p className="mt-1 text-gray-600">
                                        {isAccountActive
                                            ? "Arrange temporary teaching coverage before deactivating this account."
                                            : "Activate this account to allow the teacher to log in again."}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => void handleAccountAction()}
                                    disabled={
                                        accountActionPending ||
                                        savingSection ||
                                        editingSection !== null
                                    }
                                    className={`cursor-pointer rounded-lg px-5 py-2.5 font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${isAccountActive
                                        ? "bg-red-600 hover:bg-red-700"
                                        : "bg-green-600 hover:bg-green-700"
                                        }`}
                                >
                                    {accountActionPending
                                        ? "Please wait..."
                                        : isAccountActive
                                            ? "Deactivate Account"
                                            : "Activate Account"}
                                </button>
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            {/* Temporary arrangement modal */}
            {arrangementModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
                        <h2 className="text-xl font-semibold text-purple-950">
                            Temporary Teacher Arrangements
                        </h2>

                        <p className="mt-2 text-sm text-gray-600">
                            Choose a replacement teacher for every subject assignment.
                        </p>

                        {teacherInfo.isClassTeacher && (
                            <div className="mt-4 rounded-lg border border-purple-300 bg-purple-50 p-4">
                                <h3 className="font-medium text-purple-950">
                                    Class Teacher Responsibility
                                </h3>

                                <p className="mt-2 text-sm text-gray-600">
                                    Choose a replacement teacher for every subject assignment.
                                    Replacement teachers must already teach the same subject,
                                    but they can teach it in any class.
                                </p>
                            </div>
                        )}

                        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-purple-50 p-4">
                            <div>
                                <p className="font-medium text-purple-950">
                                    Assignments covered
                                </p>

                                <p className="mt-1 text-sm text-gray-600">
                                    Select a replacement for every row below.
                                </p>
                            </div>

                            <span
                                className={`rounded-full px-3 py-1.5 text-sm font-semibold ${allAssignmentsCovered
                                    ? "bg-green-100 text-green-800"
                                    : "bg-amber-100 text-amber-800"
                                    }`}
                            >
                                {selectedArrangementCount} of {assignmentCount} selected
                            </span>
                        </div>

                        <div className="mt-5 space-y-4">
                            {teacherAssignments.map((assignment) => {
                                const className = assignment.classId.class;
                                const subject = assignment.subjectId;
                                const assignmentKey = getAssignmentKey(
                                    className,
                                    subject._id
                                );

                                const eligibleTeachers =
                                    getEligibleTeachersForAssignment(assignment);

                                const selectedTeacherId =
                                    getSelectedReplacement(assignment);

                                const selectedTeacher = eligibleTeachers.find(
                                    (teacher) => teacher._id === selectedTeacherId
                                );

                                const loading = isClassLoading(className);

                                return (
                                    <div
                                        key={assignmentKey}
                                        className="rounded-lg border border-purple-200 bg-white p-4"
                                    >
                                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                            <div className="min-w-0 md:w-2/5">
                                                <span className="inline-flex rounded-md bg-purple-200 px-2.5 py-1 text-sm font-medium text-purple-950">
                                                    Class {className}
                                                </span>

                                                <h3 className="mt-2 font-semibold text-purple-950">
                                                    {subject.name}
                                                </h3>

                                                {subject.subjectCode && (
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        Subject Code: {subject.subjectCode}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="min-w-0 md:flex-1">
                                                <label
                                                    htmlFor={`replacement-${assignmentKey}`}
                                                    className="mb-2 block text-sm font-medium text-gray-700"
                                                >
                                                    Replacement Teacher
                                                </label>

                                                <select
                                                    id={`replacement-${assignmentKey}`}
                                                    value={selectedTeacherId}
                                                    onChange={(event) =>
                                                        handleReplacementChange(
                                                            assignment,
                                                            event.target.value
                                                        )
                                                    }
                                                    disabled={
                                                        loading ||
                                                        savingArrangement
                                                    }
                                                    className="w-full rounded-lg border border-purple-300 bg-white px-3 py-3 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200 disabled:opacity-60"
                                                >
                                                    <option value="">
                                                        {loading
                                                            ? "Loading eligible teachers..."
                                                            : "Select a replacement teacher"}
                                                    </option>

                                                    {eligibleTeachers.map((teacher) => (
                                                        <option
                                                            key={teacher._id}
                                                            value={teacher._id}
                                                        >
                                                            {teacher.userId.name} — {teacher.employeeID}
                                                        </option>
                                                    ))}
                                                </select>

                                                {!loading && eligibleTeachers.length === 0 && (
                                                    <p className="mt-2 text-sm text-red-600">
                                                        No active teacher was found who teaches {subject.name}
                                                        in any class.
                                                    </p>
                                                )}

                                                {selectedTeacher && (
                                                    <div className="mt-3 rounded-lg bg-purple-50 p-3">
                                                        <p className="text-sm font-medium text-purple-950">
                                                            {selectedTeacher.userId.name}
                                                        </p>

                                                        <p className="mt-1 text-xs text-gray-600">
                                                            UID: {selectedTeacher.userId.uid}
                                                            {" · "}
                                                            Employee ID: {selectedTeacher.employeeID}
                                                        </p>

                                                        <p className="mt-2 text-xs text-green-700">
                                                            Eligible to cover {subject.name} in Class {className}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {loadingArrangementClasses.length > 0 && (
                            <p className="mt-4 text-sm text-gray-500">
                                Loading eligible teachers for your assignments...
                            </p>
                        )}

                        <div className="mt-6 flex flex-col-reverse justify-end gap-3 sm:flex-row">
                            <button
                                type="button"
                                onClick={() => {
                                    setArrangementModalOpen(false);
                                    setArrangements([]);
                                    setArrangementTeachersByClass({});
                                    setLoadingArrangementClasses([]);
                                }}
                                disabled={savingArrangement}
                                className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-60"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={() => void handleConfirmArrangement()}
                                disabled={
                                    !allAssignmentsCovered ||
                                    loadingArrangementClasses.length > 0 ||
                                    savingArrangement
                                }
                                className="rounded-lg bg-purple-700 px-4 py-2 font-medium text-white hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {savingArrangement
                                    ? "Processing..."
                                    : `Confirm & Deactivate (${assignmentCount} assignments)`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Modal
                isOpen={modalOpen}
                title={modalTitle}
                message={modalMessage}
                onClose={() => {
                    if (accountActionPending) return;

                    setModalOpen(false);
                    setConfirmAction(undefined);
                }}
                onConfirm={
                    confirmAction
                        ? async () => {
                            setModalOpen(false);
                            await confirmAction();
                            setModalOpen(true);
                        }
                        : undefined
                }
                confirmText={
                    modalTitle === "Activate Account"
                        ? "Activate"
                        : "Confirm"
                }
            />
        </div>
    );
}

export default TeacherProfile;