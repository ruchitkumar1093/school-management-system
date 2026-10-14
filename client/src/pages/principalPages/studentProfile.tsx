import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Breadcrumb from "../../components/breadcrumb";
import Modal from "../../components/modal";

import {
    getStudentById,
    deactivateStudent,
    activateStudent,
    updateStudentProfile
} from "../../services/principalApi";

import student1 from "../../assets/profiles/profile1.png";
import student2 from "../../assets/profiles/profile2.png";
import student3 from "../../assets/profiles/profile3.png";
import student4 from "../../assets/profiles/profile4.png";
import student5 from "../../assets/profiles/profile5.png";

type AdmissionInfo = {
    studentName: string;
    dateOfBirth: string;
    gender: string;
    classApplyingFor: string;
    previousClass: string;
    fatherName: string;
    motherName: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    state: string;
    pinCode: string;
    bloodGroup?: string;
    aadhaarNumber: string;
    academicYear: string;
};

type StudentInfo = {
    _id: string;
    class: string;
    rollNumber: number;
    userId: {
        name: string;
        uid: string;
        role: string;
        isActive?: boolean;
    };
    admissionRequest: AdmissionInfo | null;
};

type EditableProfile = {
    name: string;
    uid: string;
    class: string;
    rollNumber: string;
    dateOfBirth: string;
    gender: string;
    classApplyingFor: string;
    previousClass: string;
    fatherName: string;
    motherName: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    state: string;
    pinCode: string;
    bloodGroup: string;
    aadhaarNumber: string;
    academicYear: string;
};

type FieldConfig = {
    key: keyof EditableProfile;
    label: string;
    type?: string;
    options?: string[];
};

const initialFormData: EditableProfile = {
    name: "",
    uid: "",
    class: "",
    rollNumber: "",
    dateOfBirth: "",
    gender: "",
    classApplyingFor: "",
    previousClass: "",
    fatherName: "",
    motherName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pinCode: "",
    bloodGroup: "",
    aadhaarNumber: "",
    academicYear: ""
};

const classOptions = [
    "1st", "2nd", "3rd", "4th", "5th", "6th",
    "7th", "8th", "9th", "10th", "11th", "12th"
];

const bloodGroupOptions = [
    "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"
];

const sectionFields: Record<string, (keyof EditableProfile)[]> = {
    profile: [
        "name",
        "uid",
        "class",
        "rollNumber",
        "academicYear",
        "classApplyingFor"
    ],
    personal: [
        "dateOfBirth",
        "gender",
        "previousClass",
        "classApplyingFor",
        "bloodGroup"
    ],
    parents: [
        "fatherName",
        "motherName"
    ],
    contact: [
        "phone",
        "email"
    ],
    address: [
        "city",
        "state",
        "pinCode",
        "address"
    ],
    identification: [
        "aadhaarNumber"
    ]
};

function StudentProfile() {
    const studentPhotos = [
        student1,
        student2,
        student3,
        student4,
        student5
    ];

    const [searchParams] = useSearchParams();
    const id = searchParams.get("id");

    const [studentInfo, setStudentInfo] =
        useState<StudentInfo | null>(null);

    // Canonical saved data used by every read-only display.
    const [savedData, setSavedData] =
        useState<EditableProfile>(initialFormData);

    // Draft data used only inside the section currently being edited.
    const [formData, setFormData] =
        useState<EditableProfile>(initialFormData);

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

    const uidNumber = studentInfo
        ? parseInt(studentInfo.userId.uid.replace("stu", ""), 10)
        : 0;

    const photoIndex = uidNumber
        ? (uidNumber - 1) % studentPhotos.length
        : 0;

    const studentPhoto = studentPhotos[photoIndex];

    async function fetchStudent() {
        if (!id) return;

        const response = await getStudentById(id);
        const student: StudentInfo = response.data;
        const admission = student.admissionRequest;

        const data: EditableProfile = {
            name: student.userId?.name ?? "",
            uid: student.userId?.uid ?? "",
            class: student.class ?? "",
            rollNumber: String(student.rollNumber ?? ""),
            dateOfBirth: admission?.dateOfBirth
                ? new Date(admission.dateOfBirth)
                    .toISOString()
                    .slice(0, 10)
                : "",
            gender: admission?.gender ?? "",
            classApplyingFor: admission?.classApplyingFor ?? "",
            previousClass: admission?.previousClass ?? "",
            fatherName: admission?.fatherName ?? "",
            motherName: admission?.motherName ?? "",
            phone: admission?.phone ?? "",
            email: admission?.email ?? "",
            address: admission?.address ?? "",
            city: admission?.city ?? "",
            state: admission?.state ?? "",
            pinCode: admission?.pinCode ?? "",
            bloodGroup: admission?.bloodGroup ?? "",
            aadhaarNumber: admission?.aadhaarNumber ?? "",
            academicYear: admission?.academicYear ?? ""
        };

        setStudentInfo(student);
        setSavedData(data);
        setFormData(data);
    }

    useEffect(() => {
        const loadStudent = async () => {
            try {
                if (!id) {
                    setModalTitle("Error");
                    setModalMessage(
                        "Student ID is missing from the URL."
                    );
                    setModalOpen(true);
                    return;
                }

                await fetchStudent();
            } catch (error: any) {
                console.error(error);

                setModalTitle("Error");
                setModalMessage(
                    error.response?.data?.message ||
                    "Failed to load student profile."
                );
                setModalOpen(true);
            }
        };

        loadStudent();
    }, [id]);

    const formatDate = (date: string) => {
        if (!date) return "Not available";

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return "Not available";
        }

        return parsedDate.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });
    };

    const isAccountActive =
        studentInfo?.userId.isActive !== false;

    function updateField(
        key: keyof EditableProfile,
        value: string
    ) {
        // Only the draft changes while the user is typing.
        setFormData(previous => ({
            ...previous,
            [key]: value
        }));
    }

    function handleEdit(section: string) {
        // Always start editing from the latest saved data.
        setFormData({ ...savedData });
        setEditingSection(section);
    }

    function handleCancelEdit() {
        // Discard the draft without changing the saved display.
        setFormData({ ...savedData });
        setEditingSection(null);
    }

    async function handleSaveSection() {
        if (!studentInfo || !editingSection || savingSection) {
            return;
        }

        const fields = sectionFields[editingSection];

        if (!fields) {
            setModalTitle("Error");
            setModalMessage("Unknown profile section.");
            setModalOpen(true);
            return;
        }

        const payload: Record<string, string | number> = {};

        // Validate and construct a payload for this section only.
        for (const field of fields) {
            const value = formData[field];

            if (typeof value === "string" && !value.trim()) {
                setModalTitle("Validation Error");
                setModalMessage(
                    `${field === "uid"
                        ? "UID"
                        : field === "class"
                            ? "Class"
                            : field === "rollNumber"
                                ? "Roll number"
                                : field === "dateOfBirth"
                                    ? "Date of birth"
                                    : field === "classApplyingFor"
                                        ? "Class applied for"
                                        : field.charAt(0).toUpperCase() +
                                        field.slice(1)
                    } cannot be empty.`
                );
                setModalOpen(true);
                return;
            }

            if (field === "rollNumber") {
                const rollNumber = Number(value);

                if (
                    !Number.isInteger(rollNumber) ||
                    rollNumber < 1
                ) {
                    setModalTitle("Validation Error");
                    setModalMessage(
                        "Roll number must be a positive integer."
                    );
                    setModalOpen(true);
                    return;
                }

                payload[field] = rollNumber;
            } else {
                payload[field] = value;
            }
        }

        const hasChanges = fields.some(field =>
            formData[field].trim() !== savedData[field].trim()
        );

        if (!hasChanges) {
            setFormData({ ...savedData });
            setEditingSection(null);
            return;
        }

        try {
            setSavingSection(true);

            // Send changes to the backend first.
            await updateStudentProfile(studentInfo._id, payload);

            // Only refresh the saved display after the update succeeds.
            await fetchStudent();

            setEditingSection(null);
            setModalTitle("Success");
            setModalMessage(
                "Student profile updated successfully."
            );
            setConfirmAction(undefined);
            setModalOpen(true);
        } catch (error: any) {
            console.error(error);

            // savedData remains unchanged if saving fails.
            // The draft remains available for correction or cancellation.
            setModalTitle("Error");
            setModalMessage(
                error.response?.data?.message ||
                error.message ||
                "Failed to update student profile. Your saved profile has not been changed."
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

        // Read-only fields use saved values, never draft values.
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
                            type={field.type ?? "text"}
                            value={formData[field.key]}
                            onChange={event =>
                                updateField(
                                    field.key,
                                    event.target.value
                                )
                            }
                            disabled={savingSection}
                            min={
                                field.key === "rollNumber"
                                    ? 1
                                    : undefined
                            }
                            className="mt-1 w-full rounded-lg border border-purple-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200 disabled:opacity-60"
                        />
                    )
                ) : (
                    <p className="mt-1 break-words font-medium text-gray-900">
                        {field.key === "dateOfBirth"
                            ? formatDate(value)
                            : field.key === "uid"
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
        fields: FieldConfig[],
        extraClass = ""
    ) {
        const isEditing = editingSection === section;

        return (
            <section
                key={section}
                className={`rounded-lg bg-purple-200 p-6 ${extraClass}`}
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
        if (!studentInfo || accountActionPending) return;

        const wasActive = isAccountActive;
        const currentStudentId = studentInfo._id;

        setModalTitle(
            wasActive ? "Deactivate Account" : "Activate Account"
        );

        setModalMessage(
            wasActive
                ? "Are you sure you want to deactivate this student's account?"
                : "Are you sure you want to activate this student's account?"
        );

        setConfirmAction(() => async () => {
            try {
                setAccountActionPending(true);

                if (wasActive) {
                    await deactivateStudent(currentStudentId);
                } else {
                    await activateStudent(currentStudentId);
                }

                await fetchStudent();

                setModalTitle("Success");
                setModalMessage(
                    wasActive
                        ? "Student account deactivated successfully."
                        : "Student account activated successfully."
                );
            } catch (error: any) {
                console.error(error);

                setModalTitle("Error");
                setModalMessage(
                    error.response?.data?.message ||
                    "Failed to update student account."
                );
            } finally {
                setAccountActionPending(false);
                setConfirmAction(undefined);
            }
        });

        setModalOpen(true);
    }

    const profileFields: FieldConfig[] = [
        { key: "name", label: "Student Name" },
        { key: "uid", label: "UID" },
        { key: "class", label: "Class", options: classOptions },
        {
            key: "rollNumber",
            label: "Roll Number",
            type: "number"
        },
        { key: "academicYear", label: "Academic Year" },
        {
            key: "classApplyingFor",
            label: "Class Applied For",
            options: classOptions
        }
    ];

    const personalFields: FieldConfig[] = [
        {
            key: "dateOfBirth",
            label: "Date of Birth",
            type: "date"
        },
        {
            key: "gender",
            label: "Gender",
            options: ["Male", "Female", "Other"]
        },
        {
            key: "previousClass",
            label: "Previous Class",
            options: classOptions
        },
        {
            key: "classApplyingFor",
            label: "Class Applied For",
            options: classOptions
        },
        {
            key: "bloodGroup",
            label: "Blood Group",
            options: bloodGroupOptions
        }
    ];

    const parentFields: FieldConfig[] = [
        { key: "fatherName", label: "Father's Name" },
        { key: "motherName", label: "Mother's Name" }
    ];

    const contactFields: FieldConfig[] = [
        { key: "phone", label: "Phone", type: "tel" },
        { key: "email", label: "Email", type: "email" }
    ];

    const addressFields: FieldConfig[] = [
        { key: "city", label: "City" },
        { key: "state", label: "State" },
        { key: "pinCode", label: "PIN Code" },
        { key: "address", label: "Address" }
    ];

    const identificationFields: FieldConfig[] = [
        { key: "aadhaarNumber", label: "Aadhaar Number" }
    ];

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
                                Student Profile
                            </h1>

                            <p className="mt-1 text-gray-600">
                                View and manage student personal, academic,
                                parent and contact information.
                            </p>
                        </div>

                        <div className="mb-8 rounded-lg bg-purple-200 p-6 shadow-md">
                            <div className="flex flex-col gap-8 md:flex-row md:items-start">
                                <div className="flex flex-col items-center md:min-w-40">
                                    <img
                                        src={studentPhoto}
                                        alt="Student profile"
                                        className="h-32 w-32 rounded-full object-cover shadow-md"
                                    />

                                    <h2 className="mt-4 text-xl font-semibold text-purple-950">
                                        {savedData.name || "Student"}
                                    </h2>

                                    <span className="mt-1 text-sm text-gray-600">
                                        Student
                                    </span>

                                    <span
                                        className={`mt-2 rounded-full px-3 py-1 text-sm font-medium ${isAccountActive
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
                                    {renderSection(
                                        "profile",
                                        "Student & Academic Details",
                                        profileFields
                                    )}
                                </div>
                            </div>
                        </div>

                        {studentInfo?.admissionRequest && (
                            <div className="grid grid-cols-1 gap-7 xl:grid-cols-2">
                                {renderSection(
                                    "personal",
                                    "Personal Information",
                                    personalFields
                                )}

                                {renderSection(
                                    "parents",
                                    "Parent Information",
                                    parentFields
                                )}

                                {renderSection(
                                    "contact",
                                    "Contact Information",
                                    contactFields
                                )}

                                {renderSection(
                                    "address",
                                    "Address",
                                    addressFields
                                )}

                                {renderSection(
                                    "identification",
                                    "Identification",
                                    identificationFields,
                                    "xl:col-span-2"
                                )}
                            </div>
                        )}

                        {!studentInfo?.admissionRequest && studentInfo && (
                            <div className="rounded-lg bg-purple-200 p-6 text-center shadow-md">
                                <p className="text-gray-600">
                                    Admission information is not available for this student.
                                </p>
                            </div>
                        )}

                        <div className="mt-8 rounded-lg bg-purple-200 p-6 shadow-md">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold text-purple-950">
                                        Account Management
                                    </h2>

                                    <p className="mt-1 text-gray-600">
                                        {isAccountActive
                                            ? "Deactivate this account to prevent the student from logging in."
                                            : "Activate this account to allow the student to log in again."}
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

export default StudentProfile;