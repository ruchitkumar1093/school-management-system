import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import Breadcrumb from "../../components/breadcrumb";
import Modal from "../../components/modal";

import {
    getClassOverview,
    viewTeachers,
    assignClassTeacher,
    deleteTeacher,
    viewStudents,
    deleteStudent,
    viewSubjects,
    deleteSubject,
    viewMarks,
    deleteMark,
    getAttendance,
    getExamResults
} from "../../services/principalApi";

import {
    Users,
    BookOpen,
    GraduationCap,
    ClipboardCheck,
    Presentation,
    FileText,
    ChevronRight,
    UserRoundCheck,
    UserRoundPlus,
    RefreshCw,
    CalendarDays,
    X,
    Trash2,
    Plus,
    ExternalLink
} from "lucide-react";

type ClassOverview = {
    class: string;
    classTeacher: {
        name: string;
        employeeID: string;
        uid: string;
    } | null;
    students: number;
    teachers: number;
    subjects: number;
    overallAttendance: number;
};

type Teacher = {
    _id: string;
    userId: {
        name: string;
        uid?: string;
        isActive?: boolean;
    };
    employeeID: string;
    classes?: string[];
    classAssigned?: string;
    isDeleted?: boolean;
    isClassTeacher?: boolean;
};

type Student = {
    _id: string;
    userId: {
        name: string;
        uid: string;
        isActive: boolean;
    };
    class: string;
    rollNumber: number;
    isDeleted: boolean;
};

type Subject = {
    _id: string;
    name: string;
    subjectCode: string;
    class: string;
    teacherName: string;
};

type Mark = {
    _id: string;
    studentId: {
        _id: string;
        class: string;
        userId: {
            name: string;
            uid: string;
        } | null;
    } | null;
    teacherId: {
        userId: {
            name: string;
        } | null;
    } | null;
    subjectId: {
        name: string;
    } | null;
    exam: string;
    marksObtained: number;
    totalMarks: number;
};

type AttendanceRecord = {
    _id: string;
    studentId: {
        _id: string;
        userId: {
            name: string;
            uid: string;
        };
        class: string;
        rollNumber: string | number;
    };
    date: string;
    status: "Present" | "Absent" | "Leave" | "Not Marked";
};

type ExamResult = {
    studentName: string;
    uid: string;
    class: string;
    percentage: number | null;
    result: string;
};

type ClassSection = {
    title: string;
    description: string;
    icon: typeof Users;
    path: string;
    accent: string;
};

type PanelType =
    | "students"
    | "subjects"
    | "marks"
    | "teachers"
    | "attendance"
    | "exams"
    | null;

function PrincipalViewClass() {
    const location = useLocation();
    const navigate = useNavigate();

    const [selectedClass, setSelectedClass] = useState<string>(
        location.state?.selectedClass ?? "1st"
    );

    const [classOverview, setClassOverview] =
        useState<ClassOverview | null>(null);

    const [loading, setLoading] = useState(true);

    // Class teacher assignment state
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [selectedTeacher, setSelectedTeacher] = useState("");
    const [teacherLoading, setTeacherLoading] = useState(false);
    const [showTeacherForm, setShowTeacherForm] = useState(false);

    // Management panels
    const [activePanel, setActivePanel] = useState<PanelType>(null);
    const [panelLoading, setPanelLoading] = useState(false);
    const [panelError, setPanelError] = useState("");

    const [classStudents, setClassStudents] = useState<Student[]>([]);
    const [classSubjects, setClassSubjects] = useState<Subject[]>([]);
    const [classMarks, setClassMarks] = useState<Mark[]>([]);
    const [classTeachers, setClassTeachers] = useState<Teacher[]>([]);
    const [classAttendance, setClassAttendance] = useState<AttendanceRecord[]>([]);
    const [classExamResults, setClassExamResults] = useState<ExamResult[]>([]);

    // Confirmation modal
    const [modalOpen, setModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [modalMessage, setModalMessage] = useState("");
    const [modalConfirm, setModalConfirm] = useState(false);
    const [pendingDelete, setPendingDelete] = useState<{
        type: Exclude<PanelType, null>;
        id: string;
    } | null>(null);

    const fetchClassOverview = async () => {
        try {
            setLoading(true);

            const response = await getClassOverview(selectedClass);
            setClassOverview(response.data);
        } catch (error) {
            console.error("Failed to fetch class overview:", error);
            setClassOverview(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchClassOverview();
    }, [selectedClass]);

    // Respect the class passed from another page.
    useEffect(() => {
        const classFromNavigation = location.state?.selectedClass;

        if (
            typeof classFromNavigation === "string" &&
            classFromNavigation !== selectedClass
        ) {
            setSelectedClass(classFromNavigation);
            setShowTeacherForm(false);
            setSelectedTeacher("");
            setActivePanel(null);
        }
    }, [location.state?.selectedClass]);

    const showMessage = (title: string, message: string) => {
        setModalTitle(title);
        setModalMessage(message);
        setModalConfirm(false);
        setPendingDelete(null);
        setModalOpen(true);
    };

    const handleClassChange = (className: string) => {
        setSelectedClass(className);
        setShowTeacherForm(false);
        setSelectedTeacher("");
        setActivePanel(null);
        setClassStudents([]);
        setClassSubjects([]);
        setClassMarks([]);
        setClassTeachers([]);
        setClassAttendance([]);
        setClassExamResults([]);
    };

    // Class teacher assignment
    const handleTeacherForm = async () => {
        if (showTeacherForm) {
            setShowTeacherForm(false);
            setSelectedTeacher("");
            return;
        }

        try {
            setTeacherLoading(true);

            const response = await viewTeachers(
                selectedClass,
                "",
                "Teacher Name",
                "asc",
                1,
                1000,
                false,
                false
            );

            setTeachers(response.data.teachers ?? []);
            setShowTeacherForm(true);
        } catch (error) {
            console.error("Failed to fetch teachers:", error);
            showMessage("Error", "Failed to load teachers.");
        } finally {
            setTeacherLoading(false);
        }
    };

    const handleAssignTeacher = async () => {
        if (!selectedTeacher) {
            showMessage("Teacher required", "Please select a teacher.");
            return;
        }

        try {
            setTeacherLoading(true);

            await assignClassTeacher(selectedClass, selectedTeacher);

            setShowTeacherForm(false);
            setSelectedTeacher("");

            await fetchClassOverview();

            showMessage(
                "Success",
                `Class teacher assigned to Class ${selectedClass} successfully.`
            );
        } catch (error: any) {
            console.error("Failed to assign class teacher:", error);

            showMessage(
                "Error",
                error.response?.data?.message ||
                "Failed to assign class teacher."
            );
        } finally {
            setTeacherLoading(false);
        }
    };

    // Fetch data for the selected class panel.
    const fetchPanelData = async (panel: Exclude<PanelType, null>) => {
        try {
            setPanelLoading(true);
            setPanelError("");

            if (panel === "students") {
                const response = await viewStudents(
                    selectedClass,
                    "",
                    "None",
                    "asc",
                    1,
                    1000,
                    false
                );

                const fetchedStudents: Student[] =
                    response.data.students ?? [];

                setClassStudents(
                    fetchedStudents.filter(
                        student =>
                            !student.isDeleted &&
                            student.class === selectedClass
                    )
                );
            }

            if (panel === "subjects") {
                const response = await viewSubjects(
                    selectedClass,
                    "",
                    "None",
                    "asc",
                    1,
                    1000
                );

                const fetchedSubjects: Subject[] =
                    response.data.subjects ?? [];

                setClassSubjects(
                    fetchedSubjects.filter(
                        subject => subject.class === selectedClass
                    )
                );
            }

            if (panel === "marks") {
                const response = await viewMarks(
                    selectedClass,
                    "All",
                    "",
                    "None",
                    "asc",
                    1,
                    1000,
                    "All",
                    "All"
                );

                const fetchedMarks: Mark[] =
                    response.data.marks ?? [];

                setClassMarks(
                    fetchedMarks.filter(
                        mark =>
                            mark.studentId?.class === selectedClass
                    )
                );
            }

            if (panel === "teachers") {
                const response = await viewTeachers(
                    selectedClass,
                    "",
                    "Teacher Name",
                    "asc",
                    1,
                    1000,
                    false,
                    false
                );

                const fetchedTeachers: Teacher[] =
                    response.data.teachers ?? [];

                setClassTeachers(
                    fetchedTeachers.filter(teacher => {
                        if (teacher.isDeleted) {
                            return false;
                        }

                        if (Array.isArray(teacher.classes)) {
                            return teacher.classes.includes(selectedClass);
                        }

                        return teacher.classAssigned === selectedClass;
                    })
                );
            }

            if (panel === "attendance") {
                // Use today's attendance for the selected class.
                const today = new Date().toISOString().split("T")[0];

                const response = await getAttendance(
                    selectedClass,
                    today,
                    "",
                    1,
                    1000
                );

                const fetchedAttendance: AttendanceRecord[] =
                    response.data.attendance ?? [];

                setClassAttendance(
                    fetchedAttendance.filter(
                        record =>
                            record.studentId?.class === selectedClass
                    )
                );
            }

            if (panel === "exams") {
                // The class exam page defaults to class test.
                const response = await getExamResults(
                    selectedClass,
                    "class test",
                    "",
                    "None",
                    "asc",
                    1,
                    1000
                );

                const fetchedResults: ExamResult[] =
                    response.data.results ?? [];

                setClassExamResults(
                    fetchedResults.filter(
                        result => result.class === selectedClass
                    )
                );
            }
        } catch (error) {
            console.error(`Failed to fetch ${panel}:`, error);

            if (panel === "students") setClassStudents([]);
            if (panel === "subjects") setClassSubjects([]);
            if (panel === "marks") setClassMarks([]);
            if (panel === "teachers") setClassTeachers([]);
            if (panel === "attendance") setClassAttendance([]);
            if (panel === "exams") setClassExamResults([]);

            setPanelError(`Failed to load ${panel} for this class.`);
        } finally {
            setPanelLoading(false);
        }
    };

    const handleOpenPanel = async (
        panel: Exclude<PanelType, null>
    ) => {
        setActivePanel(panel);
        await fetchPanelData(panel);
    };

    const handleAddItem = () => {
        if (activePanel === "subjects") {
            navigate("/principal/viewSubjects/subjectForm?mode=add", {
                state: { selectedClass }
            });
        }

        if (activePanel === "marks") {
            navigate("/principal/viewMarks/marksForm?mode=add", {
                state: { selectedClass }
            });
        }

        if (activePanel === "teachers") {
            navigate("/principal/viewTeachers/teacherForm?mode=add", {
                state: { selectedClass }
            });
        }
    };

    const handleManageItems = () => {
        if (activePanel === "students") {
            navigate("/principal/viewStudents", {
                state: { selectedClass }
            });
        }

        if (activePanel === "subjects") {
            navigate("/principal/viewSubjects", {
                state: { selectedClass }
            });
        }

        if (activePanel === "marks") {
            navigate("/principal/viewMarks", {
                state: { selectedClass }
            });
        }

        if (activePanel === "teachers") {
            navigate("/principal/viewTeachers", {
                state: { selectedClass }
            });
        }

        if (activePanel === "attendance") {
            navigate("/principal/attendance/viewAttendance", {
                state: { selectedClass }
            });
        }

        if (activePanel === "exams") {
            navigate("/principal/viewExams", {
                state: { selectedClass }
            });
        }
    };

    const handleDeleteItem = (
        type: Exclude<PanelType, null>,
        id: string,
        itemName: string
    ) => {
        setModalTitle(
            `Delete ${type === "marks" ? "Mark" : type.slice(0, -1)}`
        );
        setModalMessage(`Are you sure you want to delete ${itemName}?`);
        setModalConfirm(true);
        setPendingDelete({ type, id });
        setModalOpen(true);
    };

    const confirmDeleteItem = async () => {
        if (!pendingDelete) {
            return;
        }

        try {
            if (pendingDelete.type === "students") {
                await deleteStudent(pendingDelete.id);
            } else if (pendingDelete.type === "subjects") {
                await deleteSubject(pendingDelete.id);
            } else if (pendingDelete.type === "marks") {
                await deleteMark(pendingDelete.id);
            } else if (pendingDelete.type === "teachers") {
                await deleteTeacher(pendingDelete.id);
            }

            const panel = pendingDelete.type;

            setModalOpen(false);
            setModalConfirm(false);
            setPendingDelete(null);

            await fetchPanelData(panel);
            await fetchClassOverview();
        } catch (error: any) {
            console.error("Failed to delete item:", error);

            setModalTitle("Error");
            setModalMessage(
                error.response?.data?.message ||
                "Failed to delete this record."
            );
            setModalConfirm(false);
            setPendingDelete(null);
            setModalOpen(true);
        }
    };

    const openClassSection = (path: string) => {
        navigate(path, {
            state: {
                selectedClass
            }
        });
    };

    const classSections: ClassSection[] = [
        {
            title: "Students",
            description: "View the student roster for this class.",
            icon: Users,
            path: "/principal/viewStudents",
            accent: "bg-blue-100 text-blue-800"
        },
        {
            title: "Subjects",
            description: "Explore subjects offered to this class.",
            icon: BookOpen,
            path: "/principal/viewSubjects",
            accent: "bg-violet-100 text-violet-800"
        },
        {
            title: "Student marks",
            description: "Review academic performance and marks.",
            icon: GraduationCap,
            path: "/principal/viewMarks",
            accent: "bg-emerald-100 text-emerald-800"
        },
        {
            title: "Student attendance",
            description: "Review attendance records for this class.",
            icon: ClipboardCheck,
            path: "/principal/viewAttendance",
            accent: "bg-amber-100 text-amber-800"
        },
        {
            title: "Teachers",
            description: "View teachers associated with this class.",
            icon: Presentation,
            path: "/principal/viewTeachers",
            accent: "bg-indigo-100 text-indigo-800"
        },
        {
            title: "Exams",
            description: "View exam results for this class.",
            icon: FileText,
            path: "/principal/viewExams",
            accent: "bg-pink-100 text-pink-800"
        }
    ];

    const panelTitle =
        activePanel === "students"
            ? "Class Students"
            : activePanel === "subjects"
                ? "Class Subjects"
                : activePanel === "marks"
                    ? "Student Marks"
                    : activePanel === "teachers"
                        ? "Class Teachers"
                        : activePanel === "attendance"
                            ? "Today's Attendance"
                            : activePanel === "exams"
                                ? "Exam Results"
                                : "";

    const addButtonText =
        activePanel === "students"
            ? "Add Student"
            : activePanel === "subjects"
                ? "Add Subject"
                : activePanel === "marks"
                    ? "Add Marks"
                    : "Add Teacher";

    const readOnlyPanel =
        activePanel === "attendance" || activePanel === "exams";

    return (
        <div className="flex min-h-screen flex-col font-fredoka">
            <NavBar />

            <div className="flex flex-1 items-stretch bg-purple-100">
                <SideBar />

                <main className="flex min-w-0 flex-1 flex-col">
                    <Breadcrumb />

                    <div className="mx-auto flex w-full max-w-[1700px] flex-1 flex-col gap-7 px-5 py-6 sm:px-7 lg:px-9">
                        <section className="flex flex-col justify-between gap-4 border-b border-purple-200 pb-5 sm:flex-row sm:items-center">
                            <div>
                                <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
                                    Class Overview
                                </h1>
                                <p className="mt-1 text-sm text-gray-600">
                                    See class information and management options.
                                </p>
                            </div>

                            <div className="flex items-center gap-2 self-start sm:self-auto">
                                <select
                                    value={selectedClass}
                                    onChange={event => handleClassChange(event.target.value)}
                                    aria-label="Select class"
                                    className="rounded-lg border border-purple-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 outline-none transition-colors focus:border-purple-600 focus:ring-2 focus:ring-purple-200"
                                >
                                    {[
                                        "1st",
                                        "2nd",
                                        "3rd",
                                        "4th",
                                        "5th",
                                        "6th",
                                        "7th",
                                        "8th",
                                        "9th",
                                        "10th",
                                        "11th",
                                        "12th"
                                    ].map(className => (
                                        <option key={className} value={className}>
                                            Class {className}
                                        </option>
                                    ))}
                                </select>

                                <button
                                    type="button"
                                    onClick={() => void fetchClassOverview()}
                                    disabled={loading}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-purple-300 bg-purple-200/70 px-4 py-2.5 text-sm font-medium text-purple-900 transition-colors hover:bg-purple-200 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <RefreshCw
                                        size={16}
                                        className={loading ? "animate-spin" : ""}
                                    />
                                    Refresh
                                </button>
                            </div>
                        </section>

                        <section>
                            {loading ? (
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                    {[1, 2, 3, 4].map(item => (
                                        <div
                                            key={item}
                                            className="h-28 animate-pulse rounded-xl border border-purple-200 bg-purple-200/60"
                                        />
                                    ))}
                                </div>
                            ) : classOverview ? (
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                    {[
                                        {
                                            title: "Students",
                                            value: classOverview.students,
                                            Icon: Users,
                                            iconColor: "text-blue-800"
                                        },
                                        {
                                            title: "Teachers",
                                            value: classOverview.teachers,
                                            Icon: Presentation,
                                            iconColor: "text-indigo-800"
                                        },
                                        {
                                            title: "Subjects",
                                            value: classOverview.subjects,
                                            Icon: BookOpen,
                                            iconColor: "text-violet-800"
                                        },
                                        {
                                            title: "Attendance",
                                            value: `${classOverview.overallAttendance}%`,
                                            Icon: CalendarDays,
                                            iconColor: "text-emerald-800"
                                        }
                                    ].map(stat => (
                                        <div
                                            key={stat.title}
                                            className="rounded-xl border border-purple-200 bg-purple-200/70 p-5"
                                        >
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm text-gray-600">
                                                    {stat.title}
                                                </p>
                                                <stat.Icon
                                                    size={20}
                                                    className={stat.iconColor}
                                                />
                                            </div>
                                            <p className="mt-3 text-3xl font-semibold text-gray-900">
                                                {stat.value}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                                    <p className="font-medium text-red-800">
                                        Could not load Class {selectedClass}.
                                    </p>
                                    <p className="mt-1 text-sm text-red-700">
                                        Check your connection and try refreshing
                                        the overview.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => void fetchClassOverview()}
                                        className="mt-3 rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
                                    >
                                        Try again
                                    </button>
                                </div>
                            )}
                        </section>

                        {/* Class teacher */}
                        <section>
                            <div className="mb-4">
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Class teacher:
                                </h2>
                                <p className="mt-1 text-sm text-gray-600">
                                    Manage the teacher responsible for Class{" "}
                                    {selectedClass}.
                                </p>
                            </div>

                            <div className="rounded-xl border border-purple-200 bg-purple-200/70 p-5 sm:p-6">
                                <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-300 text-purple-900">
                                            <UserRoundCheck size={24} />
                                        </div>

                                        <div className="min-w-0">
                                            {loading ? (
                                                <>
                                                    <p className="text-sm text-gray-600">
                                                        Class teacher
                                                    </p>
                                                    <p className="mt-1 text-base text-gray-500">
                                                        Loading teacher details...
                                                    </p>
                                                </>
                                            ) : classOverview?.classTeacher ? (
                                                <>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h3 className="text-lg font-semibold text-gray-900">
                                                            {classOverview.classTeacher.name}
                                                        </h3>
                                                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
                                                            Assigned
                                                        </span>
                                                    </div>

                                                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-600">
                                                        <span>
                                                            Employee ID:{" "}
                                                            <strong className="font-medium text-gray-900">
                                                                {classOverview.classTeacher.employeeID}
                                                            </strong>
                                                        </span>
                                                        <span>
                                                            UID:{" "}
                                                            <strong className="font-medium uppercase text-gray-900">
                                                                {classOverview.classTeacher.uid}
                                                            </strong>
                                                        </span>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <h3 className="text-lg font-semibold text-gray-900">
                                                        No class teacher assigned
                                                    </h3>
                                                    <p className="mt-1 text-sm text-gray-600">
                                                        Assign a teacher to
                                                        coordinate this class.
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => void handleTeacherForm()}
                                        disabled={loading || teacherLoading}
                                        className="inline-flex items-center justify-center gap-2 self-start rounded-lg bg-purple-800 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-purple-900 disabled:cursor-not-allowed disabled:opacity-60 lg:self-center"
                                    >
                                        {classOverview?.classTeacher ? (
                                            <RefreshCw size={16} />
                                        ) : (
                                            <UserRoundPlus size={17} />
                                        )}

                                        {teacherLoading
                                            ? "Loading..."
                                            : classOverview?.classTeacher
                                                ? "Change teacher"
                                                : "Assign teacher"}
                                    </button>
                                </div>

                                {showTeacherForm && (
                                    <div className="mt-6 border-t border-purple-300 pt-5">
                                        <h3 className="mb-1 text-base font-semibold text-gray-900">
                                            {classOverview?.classTeacher
                                                ? "Change class teacher"
                                                : "Assign a class teacher"}
                                        </h3>

                                        <p className="mb-4 text-sm text-gray-600">
                                            Select a teacher for Class{" "}
                                            {selectedClass}.
                                        </p>

                                        {teachers.length > 0 ? (
                                            <div className="flex flex-col gap-3 sm:flex-row">
                                                <select
                                                    value={selectedTeacher}
                                                    onChange={event =>
                                                        setSelectedTeacher(event.target.value)
                                                    }
                                                    className="min-w-0 flex-1 rounded-lg border border-purple-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200"
                                                >
                                                    <option value="">
                                                        Select a teacher
                                                    </option>
                                                    {teachers.map(teacher => (
                                                        <option
                                                            key={teacher._id}
                                                            value={teacher._id}
                                                        >
                                                            {teacher.userId.name} — {teacher.employeeID}
                                                        </option>
                                                    ))}
                                                </select>

                                                <button
                                                    type="button"
                                                    onClick={() => void handleAssignTeacher()}
                                                    disabled={teacherLoading}
                                                    className="rounded-lg bg-purple-800 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-purple-900 disabled:opacity-60"
                                                >
                                                    {teacherLoading
                                                        ? "Saving..."
                                                        : "Save assignment"}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowTeacherForm(false);
                                                        setSelectedTeacher("");
                                                    }}
                                                    className="rounded-lg border border-purple-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-purple-50"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="rounded-lg border border-dashed border-purple-300 bg-purple-100 p-4">
                                                <p className="text-sm font-medium text-gray-800">
                                                    No teachers available for this class.
                                                </p>
                                                <p className="mt-1 text-sm text-gray-600">
                                                    Check the teacher assignments
                                                    and the filters used by your
                                                    teacher API.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Class-related sections */}
                        <section>
                            <div className="mb-4">
                                <p className="mt-1 text-sm text-gray-600">
                                    Open the areas used to manage this class.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                {classSections.map(section => {
                                    const Icon = section.icon;

                                    const panelMap: Record<
                                        string,
                                        Exclude<PanelType, null> | null
                                    > = {
                                        Students: "students",
                                        Subjects: "subjects",
                                        "Student marks": "marks",
                                        Teachers: "teachers",
                                        "Student attendance": "attendance",
                                        Exams: "exams"
                                    };

                                    const panel = panelMap[section.title];

                                    return (
                                        <button
                                            key={section.title}
                                            type="button"
                                            onClick={() =>
                                                panel
                                                    ? void handleOpenPanel(panel)
                                                    : openClassSection(section.path)
                                            }
                                            className="group flex min-w-0 items-center gap-4 rounded-xl border border-purple-200 bg-purple-200/60 p-4 text-left transition-all hover:border-purple-400 hover:bg-purple-200 hover:shadow-sm sm:p-5"
                                        >
                                            <div
                                                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${section.accent}`}
                                            >
                                                <Icon size={21} />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-sm font-semibold text-gray-900">
                                                    {section.title}
                                                </h3>
                                                <p className="mt-1 text-xs leading-5 text-gray-600">
                                                    {section.description}
                                                </p>
                                            </div>

                                            <ChevronRight
                                                size={18}
                                                className="shrink-0 text-purple-700/60 transition-transform group-hover:translate-x-1"
                                            />
                                        </button>
                                    );
                                })}
                            </div>
                        </section>
                    </div>
                </main>
            </div>

            {/* Class management panel */}
            {activePanel && (
                <div
                    className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
                    onClick={() => setActivePanel(null)}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="class-panel-title"
                        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-purple-200 bg-white shadow-2xl"
                        onClick={event => event.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-purple-100 bg-purple-50 px-5 py-4 sm:px-6">
                            <div>
                                <h2
                                    id="class-panel-title"
                                    className="text-xl font-semibold text-gray-900"
                                >
                                    {panelTitle} — Class {selectedClass}
                                </h2>
                                <p className="mt-1 text-sm text-gray-600">
                                    {activePanel === "attendance"
                                        ? `Attendance status for ${new Date().toLocaleDateString()}.`
                                        : activePanel === "exams"
                                            ? "Student percentage and result for class test."
                                            : "View and manage records for this class."}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setActivePanel(null)}
                                aria-label="Close panel"
                                className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-purple-100 hover:text-gray-900"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
                            {panelLoading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map(item => (
                                        <div
                                            key={item}
                                            className="h-16 animate-pulse rounded-xl bg-purple-100"
                                        />
                                    ))}
                                </div>
                            ) : panelError ? (
                                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                                    <p className="text-sm text-red-700">
                                        {panelError}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => void fetchPanelData(activePanel)}
                                        className="mt-3 rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
                                    >
                                        Try again
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {activePanel === "students" &&
                                        (classStudents.length === 0 ? (
                                            <EmptyPanel
                                                icon={<Users size={28} />}
                                                message="No students found in this class."
                                            />
                                        ) : (
                                            classStudents.map(student => (
                                                <div
                                                    key={student._id}
                                                    className="flex items-center justify-between gap-3 rounded-xl border border-purple-100 p-3 sm:p-4"
                                                >
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-semibold text-gray-900">
                                                            {student.userId.name}
                                                        </p>
                                                        <p className="mt-1 text-xs text-gray-600">
                                                            UID: {student.userId.uid.toUpperCase()} · Roll No: {student.rollNumber}
                                                        </p>
                                                    </div>
                                                    <DeleteButton
                                                        onClick={() =>
                                                            handleDeleteItem(
                                                                "students",
                                                                student._id,
                                                                student.userId.name
                                                            )
                                                        }
                                                    />
                                                </div>
                                            ))
                                        ))}

                                    {activePanel === "subjects" &&
                                        (classSubjects.length === 0 ? (
                                            <EmptyPanel
                                                icon={<BookOpen size={28} />}
                                                message="No subjects found for this class."
                                            />
                                        ) : (
                                            classSubjects.map(subject => (
                                                <div
                                                    key={subject._id}
                                                    className="flex items-center justify-between gap-3 rounded-xl border border-purple-100 p-3 sm:p-4"
                                                >
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-semibold text-gray-900">
                                                            {subject.name}
                                                        </p>
                                                        <p className="mt-1 text-xs text-gray-600">
                                                            Code: {subject.subjectCode} · Teacher: {subject.teacherName || "Not assigned"}
                                                        </p>
                                                    </div>
                                                    <DeleteButton
                                                        onClick={() =>
                                                            handleDeleteItem(
                                                                "subjects",
                                                                subject._id,
                                                                subject.name
                                                            )
                                                        }
                                                    />
                                                </div>
                                            ))
                                        ))}

                                    {activePanel === "marks" &&
                                        (classMarks.length === 0 ? (
                                            <EmptyPanel
                                                icon={<GraduationCap size={28} />}
                                                message="No marks records found for this class."
                                            />
                                        ) : (
                                            classMarks.map(mark => (
                                                <div
                                                    key={mark._id}
                                                    className="flex items-center justify-between gap-3 rounded-xl border border-purple-100 p-3 sm:p-4"
                                                >
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-semibold text-gray-900">
                                                            {mark.studentId?.userId?.name || "Unknown student"}
                                                        </p>
                                                        <p className="mt-1 text-xs text-gray-600">
                                                            UID: {mark.studentId?.userId?.uid?.toUpperCase() || "N/A"} · {mark.subjectId?.name || "Subject"} · {mark.exam.charAt(0).toUpperCase() + mark.exam.slice(1)} · {mark.marksObtained}/{mark.totalMarks}
                                                        </p>
                                                    </div>
                                                    <DeleteButton
                                                        onClick={() =>
                                                            handleDeleteItem(
                                                                "marks",
                                                                mark._id,
                                                                `${mark.studentId?.userId?.name || "student"}'s mark`
                                                            )
                                                        }
                                                    />
                                                </div>
                                            ))
                                        ))}

                                    {activePanel === "teachers" &&
                                        (classTeachers.length === 0 ? (
                                            <EmptyPanel
                                                icon={<Presentation size={28} />}
                                                message="No teachers assigned to this class."
                                            />
                                        ) : (
                                            classTeachers.map(teacher => (
                                                <div
                                                    key={teacher._id}
                                                    className="flex items-center justify-between gap-3 rounded-xl border border-purple-100 p-3 sm:p-4"
                                                >
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-semibold text-gray-900">
                                                            {teacher.userId.name}
                                                        </p>
                                                        <p className="mt-1 text-xs text-gray-600">
                                                            Employee ID: {teacher.employeeID}
                                                        </p>
                                                    </div>
                                                    <DeleteButton
                                                        onClick={() =>
                                                            handleDeleteItem(
                                                                "teachers",
                                                                teacher._id,
                                                                teacher.userId.name
                                                            )
                                                        }
                                                    />
                                                </div>
                                            ))
                                        ))}

                                    {activePanel === "attendance" &&
                                        (classAttendance.length === 0 ? (
                                            <EmptyPanel
                                                icon={<ClipboardCheck size={28} />}
                                                message="No attendance records found for this class today."
                                            />
                                        ) : (
                                            classAttendance.map(record => (
                                                <div
                                                    key={record._id}
                                                    className="flex items-center justify-between gap-3 rounded-xl border border-purple-100 p-3 sm:p-4"
                                                >
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-semibold text-gray-900">
                                                            {record.studentId.userId.name}
                                                        </p>
                                                        <p className="mt-1 text-xs text-gray-600">
                                                            UID: {record.studentId.userId.uid.toUpperCase()}
                                                        </p>
                                                    </div>

                                                    <AttendanceStatus status={record.status} />
                                                </div>
                                            ))
                                        ))}

                                    {activePanel === "exams" &&
                                        (classExamResults.length === 0 ? (
                                            <EmptyPanel
                                                icon={<FileText size={28} />}
                                                message="No exam results found for this class."
                                            />
                                        ) : (
                                            classExamResults.map((student, index) => (
                                                <div
                                                    key={student.uid || `${student.class}-${index}`}
                                                    className="flex items-center justify-between gap-3 rounded-xl border border-purple-100 p-3 sm:p-4"
                                                >
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-semibold text-gray-900">
                                                            {student.studentName}
                                                        </p>
                                                        <p className="mt-1 text-xs text-gray-600">
                                                            UID: {student.uid.toUpperCase()}
                                                        </p>
                                                    </div>

                                                    <div className="flex shrink-0 flex-col items-end gap-1">
                                                        <span className="text-sm font-semibold text-gray-900">
                                                            {student.percentage !== null
                                                                ? `${student.percentage}%`
                                                                : "—"}
                                                        </span>
                                                        <ExamResultBadge result={student.result} />
                                                    </div>
                                                </div>
                                            ))
                                        ))}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col-reverse gap-2 border-t border-purple-100 bg-gray-50 px-5 py-4 sm:flex-row sm:justify-between sm:px-6">
                            <button
                                type="button"
                                onClick={handleManageItems}
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-purple-300 bg-white px-4 py-2.5 text-sm font-medium text-purple-900 transition-colors hover:bg-purple-50"
                            >
                                <ExternalLink size={16} />
                                Manage
                            </button>

                            {!readOnlyPanel && activePanel !== "students" && (
                                <button
                                    type="button"
                                    onClick={handleAddItem}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-purple-800 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-purple-900"
                                >
                                    <Plus size={17} />
                                    {addButtonText}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <Modal
                isOpen={modalOpen}
                title={modalTitle}
                message={modalMessage}
                onClose={() => {
                    setModalOpen(false);
                    setModalConfirm(false);
                    setPendingDelete(null);
                }}
                onConfirm={modalConfirm ? confirmDeleteItem : undefined}
                confirmText="Delete"
            />
        </div>
    );
}

function AttendanceStatus({
    status
}: {
    status: AttendanceRecord["status"];
}) {
    const styles =
        status === "Present"
            ? "bg-emerald-100 text-emerald-800"
            : status === "Absent"
                ? "bg-red-100 text-red-800"
                : status === "Leave"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-gray-100 text-gray-700";

    return (
        <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${styles}`}
        >
            {status}
        </span>
    );
}

function ExamResultBadge({ result }: { result: string }) {
    const styles =
        result === "Pass"
            ? "bg-emerald-100 text-emerald-800"
            : result === "Fail"
                ? "bg-red-100 text-red-800"
                : result === "Incomplete"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-gray-100 text-gray-700";

    return (
        <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${styles}`}
        >
            {result || "—"}
        </span>
    );
}

function EmptyPanel({
    icon,
    message
}: {
    icon: React.ReactNode;
    message: string;
}) {
    return (
        <div className="rounded-xl border border-dashed border-purple-300 bg-purple-50 px-4 py-8 text-center">
            <div className="mx-auto text-purple-500">{icon}</div>
            <p className="mt-3 font-medium text-gray-900">{message}</p>
        </div>
    );
}

function DeleteButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 sm:text-sm"
        >
            <Trash2 size={15} />
            Delete
        </button>
    );
}

export default PrincipalViewClass;