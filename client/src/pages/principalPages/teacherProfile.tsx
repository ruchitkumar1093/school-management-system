import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Breadcrumb from "../../components/breadcrumb";
import Modal from "../../components/modal";

import {
    getTeacherById,
    deactivateTeacher,
    activateTeacher,
    updateTeacherProfile
} from "../../services/principalApi";

import teacher1 from "../../assets/profiles/profile1.png";
import teacher2 from "../../assets/profiles/profile2.png";
import teacher3 from "../../assets/profiles/profile3.png";
import teacher4 from "../../assets/profiles/profile4.png";
import teacher5 from "../../assets/profiles/profile5.png";

type TeacherInfo = {
    _id: string;
    employeeID: string;
    department: string;
    classAssigned: string;
    isDeleted?: boolean;
    userId: {
        _id?: string;
        name: string;
        uid: string;
        role: string;
        isActive?: boolean;
    };
};

type EditableTeacher = {
    name: string;
    uid: string;
    employeeID: string;
    department: string;
    classAssigned: string;
};

type FieldConfig = {
    key: keyof EditableTeacher;
    label: string;
    options?: string[];
};

const initialFormData: EditableTeacher = {
    name: "",
    uid: "",
    employeeID: "",
    department: "",
    classAssigned: ""
};

const departmentOptions = [
    "Science",
    "Mathematics",
    "English",
    "Social Science",
    "Hindi"
];

const classOptions = [
    "1st", "2nd", "3rd", "4th", "5th", "6th",
    "7th", "8th", "9th", "10th", "11th", "12th"
];

const accountFields: FieldConfig[] = [
    { key: "name", label: "Name" },
    { key: "uid", label: "UID" }
];

const professionalFields: FieldConfig[] = [
    { key: "employeeID", label: "Employee ID" },
    {
        key: "department",
        label: "Department",
        options: departmentOptions
    },
    {
        key: "classAssigned",
        label: "Class Assigned",
        options: classOptions
    }
];

function TeacherProfile() {
    const teacherPhotos = [
        teacher1,
        teacher2,
        teacher3,
        teacher4,
        teacher5
    ];

    const [searchParams] = useSearchParams();
    const id = searchParams.get("id");

    const [teacherInfo, setTeacherInfo] =
        useState<TeacherInfo | null>(null);

    // Saved data displayed everywhere outside the active edit form.
    const [savedData, setSavedData] =
        useState<EditableTeacher>(initialFormData);

    // Draft data changed by the user while editing.
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

    const employeeNumber = teacherInfo
        ? parseInt(teacherInfo.employeeID.replace("EMP", ""), 10)
        : 0;

    const photoIndex = employeeNumber
        ? (employeeNumber - 1) % teacherPhotos.length
        : 0;

    const teacherPhoto = teacherPhotos[photoIndex];

    async function fetchTeacher() {
        if (!id) return;

        const response = await getTeacherById(id);
        const teacher: TeacherInfo = response.data;

        const data: EditableTeacher = {
            name: teacher.userId?.name ?? "",
            uid: teacher.userId?.uid ?? "",
            employeeID: teacher.employeeID ?? "",
            department: teacher.department ?? "",
            classAssigned: teacher.classAssigned ?? ""
        };

        setTeacherInfo(teacher);
        setSavedData(data);
        setFormData(data);
    }

    useEffect(() => {
        const loadTeacher = async () => {
            try {
                if (!id) {
                    setModalTitle("Error");
                    setModalMessage(
                        "Teacher ID is missing from the URL."
                    );
                    setModalOpen(true);
                    return;
                }

                await fetchTeacher();
            } catch (error: any) {
                console.error(error);

                setModalTitle("Error");
                setModalMessage(
                    error.response?.data?.message ||
                    "Failed to load teacher profile."
                );
                setModalOpen(true);
            }
        };

        loadTeacher();
    }, [id]);

    const isAccountActive =
        teacherInfo?.userId.isActive !== false;

    function updateField(
        key: keyof EditableTeacher,
        value: string
    ) {
        // Update only the draft. The displayed profile remains unchanged.
        setFormData(previous => ({
            ...previous,
            [key]: value
        }));
    }

    function handleEdit(section: string) {
        // Start with the latest saved data when editing begins.
        setFormData({ ...savedData });
        setEditingSection(section);
    }

    function handleCancelEdit() {
        // Discard all unsaved changes.
        setFormData({ ...savedData });
        setEditingSection(null);
    }

    async function handleSaveSection() {
        if (!teacherInfo || !editingSection || savingSection) {
            return;
        }

        const sectionFields =
            editingSection === "account"
                ? ["name", "uid"] as const
                : editingSection === "professional"
                    ? [
                        "employeeID",
                        "department",
                        "classAssigned"
                    ] as const
                    : [];

        if (sectionFields.length === 0) {
            return;
        }

        const payload: Partial<EditableTeacher> = {};

        for (const key of sectionFields) {
            const value = formData[key].trim();

            if (!value) {
                const label =
                    key === "uid"
                        ? "UID"
                        : key === "employeeID"
                            ? "Employee ID"
                            : key === "classAssigned"
                                ? "Class Assigned"
                                : key.charAt(0).toUpperCase() +
                                  key.slice(1);

                setModalTitle("Validation Error");
                setModalMessage(`${label} cannot be empty.`);
                setModalOpen(true);
                return;
            }

            payload[key] = value;
        }

        const hasChanges = sectionFields.some(
            key => formData[key].trim() !== savedData[key].trim()
        );

        if (!hasChanges) {
            setFormData({ ...savedData });
            setEditingSection(null);
            return;
        }

        try {
            setSavingSection(true);

            // Update the backend first.
            await updateTeacherProfile(teacherInfo._id, payload);

            // Fetch the persisted profile before updating the read-only UI.
            await fetchTeacher();

            setEditingSection(null);

            setModalTitle("Success");
            setModalMessage(
                "Teacher profile updated successfully."
            );
            setConfirmAction(undefined);
            setModalOpen(true);
        } catch (error: any) {
            console.error(error);

            // Keep savedData unchanged if the update fails.
            // The user can correct the draft and retry, or cancel.
            setModalTitle("Error");
            setModalMessage(
                error.response?.data?.message ||
                "Failed to update teacher profile. Your saved profile has not been changed."
            );
            setModalOpen(true);
        } finally {
            setSavingSection(false);
        }
    }

    function renderField(
        section: string,
        field: FieldConfig
    ) {
        const isEditing = editingSection === section;

        // Draft values are used only by active edit controls.
        // Read-only fields always use savedData.
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
                    field.options ? (
                        <select
                            id={`${section}-${field.key}`}
                            value={formData[field.key]}
                            onChange={event =>
                                updateField(
                                    field.key,
                                    event.target.value
                                )
                            }
                            disabled={savingSection}
                            className="mt-1 w-full rounded-lg border border-purple-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200 disabled:opacity-60"
                        >
                            <option value="">
                                Select {field.label}
                            </option>

                            {field.options.map(option => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <input
                            id={`${section}-${field.key}`}
                            type="text"
                            value={formData[field.key]}
                            onChange={event =>
                                updateField(
                                    field.key,
                                    event.target.value
                                )
                            }
                            disabled={savingSection}
                            className="mt-1 w-full rounded-lg border border-purple-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200 disabled:opacity-60"
                        />
                    )
                ) : (
                    <p className="mt-1 break-words font-medium text-gray-900">
                        {field.key === "uid" ||
                        field.key === "employeeID"
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
                className="rounded-lg bg-purple-200 p-6 shadow-md"
                key={section}
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
                                onClick={handleSaveSection}
                                disabled={savingSection}
                                className="cursor-pointer rounded-lg bg-purple-700 px-4 py-2 font-medium text-white transition-colors hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {savingSection ? "Saving..." : "Save"}
                            </button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                    {fields.map(field =>
                        renderField(section, field)
                    )}
                </div>
            </section>
        );
    }

    function handleAccountAction() {
        if (!teacherInfo || accountActionPending) return;

        const wasActive = isAccountActive;
        const currentTeacherId = teacherInfo._id;

        setModalTitle(
            wasActive ? "Deactivate Account" : "Activate Account"
        );

        setModalMessage(
            wasActive
                ? "Are you sure you want to deactivate this teacher's account?"
                : "Are you sure you want to activate this teacher's account?"
        );

        setConfirmAction(() => async () => {
            try {
                setAccountActionPending(true);

                if (wasActive) {
                    await deactivateTeacher(currentTeacherId);
                } else {
                    await activateTeacher(currentTeacherId);
                }

                await fetchTeacher();

                setModalTitle("Success");
                setModalMessage(
                    wasActive
                        ? "Teacher account deactivated successfully."
                        : "Teacher account activated successfully."
                );
            } catch (error: any) {
                console.error(error);

                setModalTitle("Error");
                setModalMessage(
                    error.response?.data?.message ||
                    "Failed to update teacher account."
                );
            } finally {
                setAccountActionPending(false);
                setConfirmAction(undefined);
            }
        });

        setModalOpen(true);
    }

    return (
        <div className="flex min-h-screen flex-col font-fredoka">
            <NavBar />

            <div className="flex flex-1 bg-purple-100">
                <SideBar />

                <div className="flex-1">
                    <Breadcrumb />

                    <main className="px-8 py-8 lg:px-12 xl:px-16">
                        <div className="mb-8">
                            <h1 className="text-3xl font-semibold text-purple-950">
                                Teacher Profile
                            </h1>

                            <p className="mt-1 text-gray-600">
                                View and manage teacher account and professional information.
                            </p>
                        </div>

                        <div className="mb-7 rounded-lg bg-purple-200 p-6 shadow-md">
                            <div className="flex flex-col gap-8 md:flex-row md:items-center">
                                <div className="flex flex-col items-center md:min-w-40">
                                    <img
                                        src={teacherPhoto}
                                        alt="Teacher profile"
                                        className="h-32 w-32 rounded-full object-cover shadow-md"
                                    />

                                    <h2 className="mt-4 text-xl font-semibold text-purple-950">
                                        {savedData.name || "Teacher"}
                                    </h2>

                                    <span className="mt-1 text-sm text-gray-600">
                                        Teacher
                                    </span>

                                    <span
                                        className={`mt-2 rounded-full px-3 py-1 text-sm font-medium ${
                                            isAccountActive
                                                ? "bg-green-100 text-green-800"
                                                : "bg-red-100 text-red-800"
                                        }`}
                                    >
                                        {isAccountActive
                                            ? "Active"
                                            : "Deactivated"}
                                    </span>
                                </div>

                                <div className="hidden h-32 w-px bg-purple-300 md:block" />

                                <div className="min-w-0 flex-1">
                                    <div className="grid grid-cols-1 gap-x-12 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">
                                                UID
                                            </p>
                                            <p className="mt-1 font-medium text-gray-900">
                                                {savedData.uid.toUpperCase() || "Not available"}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-sm font-medium text-gray-500">
                                                Employee ID
                                            </p>
                                            <p className="mt-1 font-medium text-gray-900">
                                                {savedData.employeeID.toUpperCase() || "Not available"}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-sm font-medium text-gray-500">
                                                Role
                                            </p>
                                            <p className="mt-1 font-medium capitalize text-gray-900">
                                                {teacherInfo?.userId.role || "Teacher"}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-sm font-medium text-gray-500">
                                                Department
                                            </p>
                                            <p className="mt-1 font-medium text-gray-900">
                                                {savedData.department || "Not available"}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-sm font-medium text-gray-500">
                                                Class Assigned
                                            </p>
                                            <p className="mt-1 font-medium text-gray-900">
                                                {savedData.classAssigned || "Not available"}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-sm font-medium text-gray-500">
                                                Account Status
                                            </p>
                                            <p
                                                className={`mt-1 font-medium ${
                                                    isAccountActive
                                                        ? "text-green-700"
                                                        : "text-red-700"
                                                }`}
                                            >
                                                {isAccountActive
                                                    ? "Active"
                                                    : "Deactivated"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

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

                        <div className="mt-7 rounded-lg bg-purple-200 p-6 shadow-md">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold text-purple-950">
                                        Account Management
                                    </h2>

                                    <p className="mt-1 text-gray-600">
                                        {isAccountActive
                                            ? "Deactivate this account to prevent the teacher from logging in."
                                            : "Activate this account to allow the teacher to log in again."}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleAccountAction}
                                    disabled={
                                        accountActionPending ||
                                        savingSection ||
                                        editingSection !== null
                                    }
                                    className={`cursor-pointer rounded-lg px-5 py-2.5 font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                                        isAccountActive
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
                    modalTitle === "Deactivate Account"
                        ? "Deactivate"
                        : modalTitle === "Activate Account"
                            ? "Activate"
                            : "Confirm"
                }
            />
        </div>
    );
}

export default TeacherProfile;