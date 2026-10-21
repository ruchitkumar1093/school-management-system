
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import Breadcrumb from "../../components/breadcrumb";
import ClassTabs from "../../components/classTabs";
import Modal from "../../components/modal";

import {
    getClassOverview,
    viewTeachers,
    assignClassTeacher
} from "../../services/principalApi";

import {
    School,
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
    ArrowUpRight,
    CalendarDays,
    LayoutDashboard
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
    classAssigned: string;
    employeeID: string;
    userId: {
        name: string;
        uid: string;
    };
};

type ClassSection = {
    title: string;
    description: string;
    icon: typeof Users;
    path: string;
    accent: string;
};

function PrincipalViewClass() {
    const location = useLocation();
    const navigate = useNavigate();

    const [selectedClass, setSelectedClass] = useState<string>(
        location.state?.selectedClass ?? "1st"
    );

    const [classOverview, setClassOverview] =
        useState<ClassOverview | null>(null);

    const [loading, setLoading] = useState(true);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [selectedTeacher, setSelectedTeacher] = useState("");
    const [teacherLoading, setTeacherLoading] = useState(false);
    const [showTeacherForm, setShowTeacherForm] = useState(false);

    const [modalOpen, setModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [modalMessage, setModalMessage] = useState("");

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

    // Respect the class passed from another page, if supplied.
    useEffect(() => {
        const classFromNavigation = location.state?.selectedClass;

        if (
            typeof classFromNavigation === "string" &&
            classFromNavigation !== selectedClass
        ) {
            setSelectedClass(classFromNavigation);
            setShowTeacherForm(false);
            setSelectedTeacher("");
            setTeachers([]);
        }
    }, [location.state?.selectedClass]);

    const showMessage = (title: string, message: string) => {
        setModalTitle(title);
        setModalMessage(message);
        setModalOpen(true);
    };

    const handleClassChange = (className: string) => {
        setSelectedClass(className);
        setShowTeacherForm(false);
        setSelectedTeacher("");
        setTeachers([]);
    };

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

    // Absolute URLs prevent nested paths such as
    // /principal/viewClass/viewStudents.
    // Navigation state carries the currently selected class.
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
            path: "/principal/attendance",
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
            description: "Open exam management.",
            icon: FileText,
            path: "/principal/viewExams",
            accent: "bg-pink-100 text-pink-800"
        }
    ];

    return (
        <div className="flex min-h-screen flex-col font-fredoka">
            <NavBar />

            <div className="flex flex-1 items-stretch bg-purple-100">
                <SideBar />

                <main className="flex min-w-0 flex-1 flex-col">
                    <Breadcrumb />

                    <div className="mx-auto flex w-full max-w-[1700px] flex-1 flex-col gap-7 px-5 py-6 sm:px-7 lg:px-9">

                        {/* Page heading */}
                        <section className="flex flex-col justify-between gap-4 border-b border-purple-200 pb-5 sm:flex-row sm:items-center">
                            <div>
                                <div className="mb-1 flex items-center gap-2 text-sm font-medium text-purple-800">
                                    <LayoutDashboard size={17} />
                                    School management
                                </div>

                                <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
                                    Class Overview
                                </h1>

                                <p className="mt-1 text-sm text-gray-600">
                                    Manage each class, its students, teachers,
                                    subjects, attendance, and academic records.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => void fetchClassOverview()}
                                disabled={loading}
                                className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-purple-300 bg-purple-200/70 px-4 py-2.5 text-sm font-medium text-purple-900 transition-colors hover:bg-purple-200 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
                            >
                                <RefreshCw
                                    size={16}
                                    className={loading ? "animate-spin" : ""}
                                />
                                Refresh overview
                            </button>
                        </section>

                        {/* Class selector */}
                        <section>
                            <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Select a class
                                    </h2>
                                    <p className="mt-1 text-sm text-gray-600">
                                        Choose a class to see its information and management options.
                                    </p>
                                </div>

                                <span className="text-sm font-medium text-purple-800">
                                    Selected: Class {selectedClass}
                                </span>
                            </div>

                            <div className="rounded-xl border border-purple-200 bg-purple-200/50 p-3 sm:p-4">
                                <ClassTabs
                                    selectedClass={selectedClass}
                                    onClassChange={handleClassChange}
                                />
                            </div>
                        </section>

                        {/* Selected class banner */}
                        <section className="overflow-hidden rounded-2xl border border-purple-300 bg-purple-200">
                            <div className="flex flex-col justify-between gap-5 p-5 sm:flex-row sm:items-center sm:p-7">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-purple-800 text-white shadow-sm">
                                        <School size={29} />
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-purple-800">
                                            Class workspace
                                        </p>
                                        <h2 className="mt-0.5 text-2xl font-semibold text-gray-900">
                                            Class {selectedClass}
                                        </h2>
                                        <p className="mt-1 text-sm text-gray-600">
                                            Overview and class management
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            openClassSection("/principal/viewStudents")
                                        }
                                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-purple-800 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-purple-900"
                                    >
                                        <Users size={16} />
                                        View students
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            openClassSection("/principal/viewSubjects")
                                        }
                                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-purple-400 bg-purple-100 px-4 py-2.5 text-sm font-medium text-purple-900 transition-colors hover:bg-purple-300"
                                    >
                                        <BookOpen size={16} />
                                        View subjects
                                    </button>
                                </div>
                            </div>
                        </section>

                        {/* Class statistics */}
                        <section>
                            <div className="mb-4">
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Class statistics
                                </h2>
                                <p className="mt-1 text-sm text-gray-600">
                                    A snapshot of Class {selectedClass}.
                                </p>
                            </div>

                            {loading ? (
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                    {[1, 2, 3, 4].map((item) => (
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
                                            description: "Students in this class",
                                            Icon: Users,
                                            iconColor: "text-blue-800"
                                        },
                                        {
                                            title: "Teachers",
                                            value: classOverview.teachers,
                                            description: "Teachers assigned to this class",
                                            Icon: Presentation,
                                            iconColor: "text-indigo-800"
                                        },
                                        {
                                            title: "Subjects",
                                            value: classOverview.subjects,
                                            description: "Subjects offered to this class",
                                            Icon: BookOpen,
                                            iconColor: "text-violet-800"
                                        },
                                        {
                                            title: "Attendance",
                                            value: `${classOverview.overallAttendance}%`,
                                            description: "Overall class attendance",
                                            Icon: CalendarDays,
                                            iconColor: "text-emerald-800"
                                        }
                                    ].map((stat) => (
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
                                            <p className="mt-1 text-xs text-gray-500">
                                                {stat.description}
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
                                        Check your connection and try refreshing the overview.
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
                                    Class teacher
                                </h2>
                                <p className="mt-1 text-sm text-gray-600">
                                    Manage the teacher responsible for Class {selectedClass}.
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
                                                        Assign a teacher to coordinate this class.
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
                                            Select a teacher for Class {selectedClass}.
                                        </p>

                                        {teachers.length > 0 ? (
                                            <div className="flex flex-col gap-3 sm:flex-row">
                                                <select
                                                    value={selectedTeacher}
                                                    onChange={(event) =>
                                                        setSelectedTeacher(event.target.value)
                                                    }
                                                    className="min-w-0 flex-1 rounded-lg border border-purple-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200"
                                                >
                                                    <option value="">
                                                        Select a teacher
                                                    </option>

                                                    {teachers.map((teacher) => (
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
                                                    Check the teacher assignments and the filters used by your teacher API.
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
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Manage Class {selectedClass}
                                </h2>
                                <p className="mt-1 text-sm text-gray-600">
                                    Open the areas used to manage this class.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                {classSections.map((section) => {
                                    const Icon = section.icon;

                                    return (
                                        <button
                                            key={section.title}
                                            type="button"
                                            onClick={() => openClassSection(section.path)}
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

                        {/* Back to dashboard */}
                        <section className="flex flex-col justify-between gap-3 border-t border-purple-200 pt-5 sm:flex-row sm:items-center">
                            <div>
                                <p className="text-sm font-medium text-gray-900">
                                    Managing Class {selectedClass}
                                </p>
                                <p className="mt-1 text-xs text-gray-600">
                                    Choose another class above or return to the principal dashboard.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => navigate("/principal")}
                                className="inline-flex items-center justify-center gap-2 self-start rounded-lg px-3 py-2 text-sm font-medium text-purple-800 transition-colors hover:bg-purple-200 sm:self-auto"
                            >
                                Back to dashboard
                                <ArrowUpRight size={16} />
                            </button>
                        </section>
                    </div>
                </main>
            </div>

            <Modal
                isOpen={modalOpen}
                title={modalTitle}
                message={modalMessage}
                onClose={() => setModalOpen(false)}
            />
        </div>
    );
}

export default PrincipalViewClass;
