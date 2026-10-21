import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
    addMark,
    updateMark,
    getMarkById,
    getMarkFormOptions,
    getMarkSubjects
} from "../../services/principalApi";
import { useState, useEffect } from "react";
import Breadcrumb from "../../components/breadcrumb";
import Modal from "../../components/modal";

type FormData = {
    class: string;
    studentId: string;
    teacherId: string;
    subjectName: string;
    exam: string;
    marksObtained: string;
    totalMarks: string;
};

type Student = {
    _id: string;
    userId: {
        name: string;
        uid: string;
    };
    class: string;
    rollNumber: number;
};

type Teacher = {
    _id: string;
    userId: {
        name: string;
        uid: string;
    };
    employeeID: string;
    department: string;
    classAssigned: string;
};

function MarksForm() {
    const [searchParams] = useSearchParams();
    const mode = searchParams.get("mode");
    const id = searchParams.get("id");
    const isAdding = mode === "add";

    const navigate = useNavigate();

    const [formData, setFormData] = useState<FormData>({
        class: "",
        studentId: "",
        teacherId: "",
        subjectName: "",
        exam: "",
        marksObtained: "",
        totalMarks: ""
    });

    const [students, setStudents] = useState<Student[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [subjects, setSubjects] = useState<string[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(false);
    const [loadingSubjects, setLoadingSubjects] = useState(true);

    const [modalOpen, setModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [modalMessage, setModalMessage] = useState("");

    // Fetch current subjects from the database.
    useEffect(() => {
        let cancelled = false;

        const fetchSubjects = async () => {
            try {
                setLoadingSubjects(true);

                const response = await getMarkSubjects();

                if (!cancelled) {
                    setSubjects(response.data.subjects);
                }
            } catch (error) {
                if (!cancelled) {
                    console.error("Failed to fetch subjects:", error);
                    setSubjects([]);
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

    // Fetch students and teachers only after selecting a class.
    useEffect(() => {
        if (!isAdding || !formData.class) {
            setStudents([]);
            setTeachers([]);
            return;
        }

        let cancelled = false;

        const fetchOptions = async () => {
            setLoadingOptions(true);

            try {
                const response = await getMarkFormOptions(
                    formData.class
                );

                if (cancelled) return;

                setStudents(response.data.students);
                setTeachers(response.data.teachers);
            } catch (error) {
                if (!cancelled) {
                    console.error(
                        "Failed to fetch students and teachers:",
                        error
                    );

                    setStudents([]);
                    setTeachers([]);
                }
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
    }, [isAdding, formData.class]);

    // Fetch the existing mark when editing.
    useEffect(() => {
        if (isAdding || !id) return;

        let cancelled = false;

        const fetchMark = async () => {
            try {
                const response = await getMarkById(id);

                if (cancelled) return;

                const mark = response.data;

                setFormData({
                    class: mark.studentId?.class ?? "",
                    studentId: mark.studentId?._id ?? "",
                    teacherId: mark.teacherId?._id ?? "",
                    subjectName: mark.subjectId?.name ?? "",
                    exam: mark.exam ?? "",
                    marksObtained: String(mark.marksObtained ?? ""),
                    totalMarks: String(mark.totalMarks ?? "")
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

    const handleClassChange = (value: string) => {
        setFormData(previous => ({
            ...previous,
            class: value,
            studentId: "",
            teacherId: ""
        }));

        setStudents([]);
        setTeachers([]);
    };

    const handleSubmit = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();

        try {
            if (isAdding) {
                await addMark(formData);

                setModalTitle("Success");
                setModalMessage("Marks Added");
            } else {
                if (!id) return;

                await updateMark(id, formData);

                setModalTitle("Success");
                setModalMessage("Marks Updated");
            }

            setModalOpen(true);
        } catch (error: any) {
            console.error(error);

            setModalTitle("Error");
            setModalMessage(
                error.response?.data?.message ||
                "Failed to save marks."
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
        "w-sm rounded-sm border-2 border-gray-500 p-2 focus:outline-none focus:border-gray-900 transition-colors duration-300 ease-in-out";

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
                            <>
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="class">Class:</label>

                                    <select
                                        id="class"
                                        required
                                        value={formData.class}
                                        onChange={e =>
                                            handleClassChange(e.target.value)
                                        }
                                        className={inputClass}
                                    >
                                        <option value="" disabled>
                                            Select a class
                                        </option>

                                        {[
                                            "1st", "2nd", "3rd", "4th",
                                            "5th", "6th", "7th", "8th",
                                            "9th", "10th", "11th", "12th"
                                        ].map(className => (
                                            <option
                                                key={className}
                                                value={className}
                                            >
                                                {className}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label htmlFor="student">Student:</label>

                                    <select
                                        id="student"
                                        required
                                        disabled={
                                            !formData.class ||
                                            loadingOptions
                                        }
                                        value={formData.studentId}
                                        onChange={e =>
                                            setFormData(previous => ({
                                                ...previous,
                                                studentId: e.target.value
                                            }))
                                        }
                                        className={`${inputClass} disabled:bg-gray-200 disabled:cursor-not-allowed`}
                                    >
                                        <option value="" disabled>
                                            {loadingOptions
                                                ? "Loading students..."
                                                : "Select a student"}
                                        </option>

                                        {students.map(student => (
                                            <option
                                                key={student._id}
                                                value={student._id}
                                            >
                                                {student.userId.name} -{" "}
                                                {student.userId.uid.toUpperCase()}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label htmlFor="teacher">Teacher:</label>

                                    <select
                                        id="teacher"
                                        required
                                        disabled={
                                            !formData.class ||
                                            loadingOptions
                                        }
                                        value={formData.teacherId}
                                        onChange={e =>
                                            setFormData(previous => ({
                                                ...previous,
                                                teacherId: e.target.value
                                            }))
                                        }
                                        className={`${inputClass} disabled:bg-gray-200 disabled:cursor-not-allowed`}
                                    >
                                        <option value="" disabled>
                                            {loadingOptions
                                                ? "Loading teachers..."
                                                : "Select a teacher"}
                                        </option>

                                        {teachers.map(teacher => (
                                            <option
                                                key={teacher._id}
                                                value={teacher._id}
                                            >
                                                {teacher.userId.name} -{" "}
                                                {teacher.employeeID.toUpperCase()}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        )}

                        <div className="flex flex-col gap-2">
                            <label htmlFor="subject">Subject:</label>

                            <select
                                id="subject"
                                required
                                disabled={loadingSubjects || subjects.length === 0}
                                value={formData.subjectName}
                                onChange={e =>
                                    setFormData(previous => ({
                                        ...previous,
                                        subjectName: e.target.value
                                    }))
                                }
                                className={`${inputClass} disabled:bg-gray-200 disabled:cursor-not-allowed`}
                            >
                                <option value="" disabled>
                                    {loadingSubjects
                                        ? "Loading subjects..."
                                        : subjects.length === 0
                                            ? "No subjects available"
                                            : "Select a subject"}
                                </option>

                                {subjects.map(subject => (
                                    <option
                                        key={subject}
                                        value={subject}
                                    >
                                        {subject}
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
                                    setFormData(previous => ({
                                        ...previous,
                                        exam: e.target.value
                                    }))
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
                                type="number"
                                min="0"
                                required
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
                                type="number"
                                min="1"
                                required
                                value={formData.totalMarks}
                                onChange={e =>
                                    setFormData(previous => ({
                                        ...previous,
                                        totalMarks: e.target.value
                                    }))
                                }
                                className={inputClass}
                                placeholder="Enter Max Marks"
                            />
                        </div>

                        <div className="flex gap-5">
                            <button
                                type="submit"
                                disabled={
                                    (isAdding && loadingOptions) ||
                                    loadingSubjects ||
                                    subjects.length === 0
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