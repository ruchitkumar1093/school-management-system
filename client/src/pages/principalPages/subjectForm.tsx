import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
    addSubject,
    updateSubject,
    getSubjectById,
    getSubjectNames,
    getClasses,
} from "../../services/principalApi";
import { useState, useEffect } from "react";
import Breadcrumb from "../../components/breadcrumb";
import Modal from "../../components/modal";

type FormData = {
    name: string;
    subjectCode: string;
    class: string;
};

type SubjectOption = {
    _id?: string;
    name: string;
    subjectCode?: string;
    class?: string;
};

type ClassOption = {
    _id?: string;
    class: string;
};

const ADD_SUBJECT_OPTION = "__add_subject__";
const PLACEHOLDER = "Select an option";

const existingSubjectPrefixes: Record<string, string> = {
    Science: "SCI",
    Hindi: "HND",
    "Social Science": "SSC",
    English: "ENG",
    Mathematics: "MTH",
};

const classCodes: Record<string, string> = {
    "1st": "01",
    "2nd": "02",
    "3rd": "03",
    "4th": "04",
    "5th": "05",
    "6th": "06",
    "7th": "07",
    "8th": "08",
    "9th": "09",
    "10th": "10",
    "11th": "11",
    "12th": "12",
};

const DEFAULT_SUBJECT_NAMES = [
    "Science",
    "Mathematics",
    "English",
    "Social Science",
    "Hindi",
];

function normalizeName(name: string) {
    return name.trim().replace(/\s+/g, " ");
}

function SubjectForm() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const mode = searchParams.get("mode");
    const id = searchParams.get("id");
    const isAdding = mode === "add";

    const [formData, setFormData] = useState<FormData>({
        name: "",
        subjectCode: "",
        class: "",
    });

    const [subjects, setSubjects] = useState<SubjectOption[]>([]);
    const [classes, setClasses] = useState<ClassOption[]>([]);

    const [loadingOptions, setLoadingOptions] = useState(true);
    const [saving, setSaving] = useState(false);

    const [addingSubjectName, setAddingSubjectName] = useState(false);
    const [newSubjectName, setNewSubjectName] = useState("");

    const [modalOpen, setModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [modalMessage, setModalMessage] = useState("");

    const subjectNames = Array.from(
        new Map(
            [
                ...DEFAULT_SUBJECT_NAMES,
                ...subjects.map((subject) => subject.name),
            ].map((name) => [normalizeName(name).toLowerCase(), normalizeName(name)])
        ).values()
    ).sort((a, b) => a.localeCompare(b));

    const canAddMoreSubjects = subjectNames.length < 8;

    const showModal = (title: string, message: string) => {
        setModalTitle(title);
        setModalMessage(message);
        setModalOpen(true);
    };

    const getErrorMessage = (error: unknown, fallback: string) => {
        const err = error as {
            response?: { data?: { message?: string } };
        };

        return err.response?.data?.message || fallback;
    };

    const generateSubjectCode = (
        name: string,
        className: string
    ): string => {
        if (!name || !className) {
            return "";
        }

        const classCode = classCodes[className];

        if (!classCode) {
            return "";
        }

        // Preserve the existing five subject-code prefixes.
        const existingPrefix = existingSubjectPrefixes[name];

        if (existingPrefix) {
            return `${existingPrefix}${classCode}`;
        }

        // For new subjects, use the first three letters.
        const newPrefix = name
            .trim()
            .replace(/[^a-zA-Z]/g, "")
            .slice(0, 3)
            .toUpperCase();

        return newPrefix.length === 3
            ? `${newPrefix}${classCode}`
            : "";
    };


    const fetchOptions = async () => {
        setLoadingOptions(true);

        try {
            const [subjectsResponse, classesResponse] = await Promise.all([
                getSubjectNames(),
                getClasses(),
            ]);

            const subjectNamesData = subjectsResponse.data;
            const classesData = classesResponse.data;

            setSubjects(
                Array.isArray(subjectNamesData)
                    ? subjectNamesData
                    : subjectNamesData.subjectNames ??
                    subjectNamesData.subjects ??
                    []
            );

            setClasses(
                Array.isArray(classesData)
                    ? classesData
                    : classesData.classes ?? []
            );
        } catch (error) {
            console.error("Failed to fetch subject options:", error);

            showModal(
                "Error",
                getErrorMessage(error, "Failed to load subject and class options.")
            );
        } finally {
            setLoadingOptions(false);
        }
    };


    useEffect(() => {
        void fetchOptions();
    }, []);

    useEffect(() => {
        if (isAdding || !id) {
            return;
        }

        const fetchSubject = async () => {
            try {
                const response = await getSubjectById(id);
                const subject = response.data;

                setFormData({
                    name: subject.name,
                    subjectCode: subject.subjectCode,
                    class: subject.class,
                });
            } catch (error) {
                showModal(
                    "Error",
                    getErrorMessage(
                        error,
                        "Failed to fetch subject details."
                    )
                );
            }
        };

        void fetchSubject();
    }, [id, isAdding]);

    const handleNameChange = (value: string) => {
        if (value === ADD_SUBJECT_OPTION) {
            if (!canAddMoreSubjects) {
                showModal(
                    "Subject Limit Reached",
                    "You can add a maximum of 8 distinct subject names."
                );
                return;
            }

            setAddingSubjectName(true);
            setNewSubjectName("");

            // A newly typed name is not saved until the form is submitted.
            setFormData((previous) => ({
                ...previous,
                name: "",
                subjectCode: "",
            }));

            return;
        }

        setAddingSubjectName(false);
        setNewSubjectName("");

        setFormData((previous) => ({
            ...previous,
            name: value,
            subjectCode: generateSubjectCode(value, previous.class),
        }));
    };

    const handleNewSubjectNameChange = (value: string) => {
        setNewSubjectName(value);

        setFormData((previous) => ({
            ...previous,
            name: value,
            subjectCode: generateSubjectCode(value, previous.class),
        }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const name = normalizeName(formData.name);

        if (!name || !formData.class || !formData.subjectCode) {
            showModal(
                "Validation Error",
                "Please enter or select a subject name, select a class, and generate a subject code."
            );
            return;
        }

        const isExistingName = subjectNames.some(
            (subjectName) =>
                subjectName.toLowerCase() === name.toLowerCase()
        );

        // Only genuinely new names need the extra client-side limit check.
        if (
            isAdding &&
            !isExistingName &&
            subjectNames.length >= 8
        ) {
            showModal(
                "Subject Limit Reached",
                "A maximum of 8 distinct subject names is allowed."
            );
            return;
        }

        setSaving(true);

        try {
            const dataToSubmit = {
                ...formData,
                name,
                subjectCode: formData.subjectCode.trim().toUpperCase(),
            };

            if (isAdding) {
                await addSubject(dataToSubmit);

                // Refresh backend data so the new subject name appears
                // the next time the dropdown is opened.
                await fetchOptions();

                showModal("Success", "Subject Added");
            } else if (id) {
                await updateSubject(id, dataToSubmit);

                await fetchOptions();

                showModal("Success", "Subject Updated");
            }
        } catch (error) {
            showModal(
                "Error",
                getErrorMessage(error, "Failed to save the subject.")
            );
        } finally {
            setSaving(false);
        }
    };

    const handleModalClose = () => {
        setModalOpen(false);

        if (
            modalMessage === "Subject Added" ||
            modalMessage === "Subject Updated"
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

                    <form
                        onSubmit={handleSubmit}
                        className="flex flex-col gap-7 p-8 md:p-15"
                    >
                        {loadingOptions ? (
                            <p className="text-purple-950">
                                Loading subjects and classes...
                            </p>
                        ) : (
                            <>
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="name">
                                        Subject Name:
                                    </label>

                                    <select
                                        id="name"
                                        name="name"
                                        required={!addingSubjectName}
                                        value={
                                            addingSubjectName
                                                ? ADD_SUBJECT_OPTION
                                                : formData.name
                                        }
                                        onChange={(e) =>
                                            handleNameChange(e.target.value)
                                        }
                                        className="w-full max-w-sm rounded-sm border-2 border-gray-500 p-2 transition-colors duration-300 ease-in-out focus:border-gray-900 focus:outline-none"
                                    >
                                        <option value="" disabled>
                                            {PLACEHOLDER}
                                        </option>

                                        {subjectNames.map((name) => (
                                            <option key={name} value={name}>
                                                {name}
                                            </option>
                                        ))}

                                        {canAddMoreSubjects && (
                                            <option value={ADD_SUBJECT_OPTION}>
                                                + Add subject
                                            </option>
                                        )}
                                    </select>

                                    {addingSubjectName && (
                                        <div className="mt-2 flex w-full max-w-sm flex-col gap-3 rounded-lg border border-purple-300 bg-white p-4">
                                            <label htmlFor="newSubjectName">
                                                New subject name:
                                            </label>

                                            <input
                                                id="newSubjectName"
                                                type="text"
                                                value={newSubjectName}
                                                maxLength={50}
                                                onChange={(e) =>
                                                    handleNewSubjectNameChange(
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Subject name"
                                                required
                                                className="rounded-sm border-2 border-gray-300 p-2 focus:border-purple-700 focus:outline-none"
                                            />

                                            <p className="text-sm text-gray-600">
                                                {subjectNames.length} of 8
                                                subject names currently
                                                available.
                                            </p>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setAddingSubjectName(false);
                                                    setNewSubjectName("");

                                                    setFormData((previous) => ({
                                                        ...previous,
                                                        name: "",
                                                        subjectCode: "",
                                                    }));
                                                }}
                                                className="self-start rounded-lg border border-gray-300 px-4 py-2 transition-colors hover:bg-gray-100"
                                            >
                                                Cancel new subject
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label htmlFor="class">Class:</label>

                                    <select
                                        required
                                        id="class"
                                        name="class"
                                        value={formData.class}
                                        onChange={(e) => {
                                            const className = e.target.value;

                                            setFormData((previous) => ({
                                                ...previous,
                                                class: className,
                                                subjectCode:
                                                    generateSubjectCode(
                                                        previous.name,
                                                        className
                                                    ),
                                            }));
                                        }}
                                        className="w-full max-w-sm rounded-sm border-2 border-gray-500 p-2 transition-colors duration-300 ease-in-out focus:border-gray-900 focus:outline-none"
                                    >
                                        <option value="" disabled>
                                            {PLACEHOLDER}
                                        </option>

                                        {classes.map((item) => (
                                            <option
                                                key={item._id ?? item.class}
                                                value={item.class}
                                            >
                                                {item.class}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label htmlFor="code">
                                        Subject Code:
                                    </label>

                                    <input
                                        required
                                        value={formData.subjectCode}
                                        onChange={(e) =>
                                            setFormData((previous) => ({
                                                ...previous,
                                                subjectCode: e.target.value,
                                            }))
                                        }
                                        className="w-full max-w-sm rounded-sm border-2 border-gray-500 p-2 transition-colors duration-300 ease-in-out focus:border-gray-900 focus:outline-none"
                                        type="text"
                                        id="code"
                                        placeholder="Enter Subject Code"
                                        name="subjectCode"
                                    />
                                </div>
                            </>
                        )}

                        <div className="flex flex-wrap gap-5">
                            <button
                                type="submit"
                                disabled={
                                    loadingOptions ||
                                    saving ||
                                    (addingSubjectName &&
                                        !normalizeName(newSubjectName))
                                }
                                className="cursor-pointer rounded-lg bg-purple-300 px-6 py-3 font-medium text-purple-950 shadow-[0_2px_3px] transition-colors hover:bg-violet-300 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {saving
                                    ? "Saving..."
                                    : isAdding
                                        ? "Add"
                                        : "Update"}
                            </button>

                            <button
                                onClick={() => navigate(-1)}
                                type="button"
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

export default SubjectForm;