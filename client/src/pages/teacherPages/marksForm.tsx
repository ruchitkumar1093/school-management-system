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

function MarksForm() {
    const [searchParams] = useSearchParams();
    const mode = searchParams.get("mode");
    const id = searchParams.get("id");
    const isAdding = mode === "add";

    const navigate = useNavigate();

    const [students, setStudents] = useState<Student[]>([]);
    const [teacherSubjects, setTeacherSubjects] = useState<TeacherSubject[]>([]);
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

    // Fetch only subjects assigned to the logged-in teacher.
    useEffect(() => {
        let cancelled = false;

        const fetchSubjects = async () => {
            setLoadingSubjects(true);

            try {
                const response = await getTeacherSubjects();

                if (cancelled) return;

                const subjects: TeacherSubject[] = response.data.subjects;
                setTeacherSubjects(subjects);

                // Select the teacher's assigned subject by default.
                if (isAdding && subjects.length > 0) {
                    setFormData(previous => ({
                        ...previous,
                        subjectName: subjects[0].name
                    }));
                }
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
    }, [isAdding]);

    // Fetch students only when adding marks.
    // The API returns students from the teacher's assigned class.
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
                    1000
                );

                if (cancelled) return;

                setStudents(response.data.students);
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

    // Fetch existing mark details only when editing.
    useEffect(() => {
        if (isAdding || !id) return;

        let cancelled = false;

        const fetchMark = async () => {
            try {
                const response = await getMarkById(id);

                if (cancelled) return;

                const mark = response.data;

                setFormData({
                    studentId: mark.studentId?._id ?? "",
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

            // Prevent selecting a subject outside the teacher's assignment.
            if (
                !teacherSubjects.some(
                    subject => subject.name === formData.subjectName
                )
            ) {
                setModalTitle("Validation Error");
                setModalMessage("Please select one of your assigned subjects.");
                setModalOpen(true);
                return;
            }

            if (isAdding) {
                if (!formData.studentId) {
                    setModalTitle("Validation Error");
                    setModalMessage("Please select a student.");
                    setModalOpen(true);
                    return;
                }

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
                        {/* Student appears only when adding marks. */}
                        {isAdding && (
                            <div className="flex flex-col gap-2">
                                <label htmlFor="student">Student:</label>

                                <select
                                    id="student"
                                    required
                                    value={formData.studentId}
                                    disabled={loadingStudents}
                                    onChange={e =>
                                        setFormData(previous => ({
                                            ...previous,
                                            studentId: e.target.value
                                        }))
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
                                            {student.userId.uid.toUpperCase()}
                                        </option>
                                    ))}
                                </select>

                                {!loadingStudents && students.length === 0 && (
                                    <p className="text-sm text-gray-600">
                                        No students found in your assigned class.
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="flex flex-col gap-2">
                            <label htmlFor="subject">Subject:</label>

                            <select
                                id="subject"
                                required
                                disabled={
                                    loadingSubjects ||
                                    teacherSubjects.length === 0
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
                                        : teacherSubjects.length === 0
                                            ? "No assigned subjects available"
                                            : "Select a subject"}
                                </option>

                                {teacherSubjects.map(subject => (
                                    <option
                                        key={subject._id}
                                        value={subject.name}
                                    >
                                        {subject.name}
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
                                name="obt"
                                type="number"
                                required
                                min="0"
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
                                required
                                min="1"
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