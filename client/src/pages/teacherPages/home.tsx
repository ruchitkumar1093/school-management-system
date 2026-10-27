
import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import { useEffect, useState } from "react";
import { viewHome } from "../../services/teacherApi";
import Breadcrumb from "../../components/breadcrumb";
import { useNavigate } from "react-router-dom";
import {
    FiUsers,
    FiCalendar,
    FiBarChart2,
    FiBookOpen,
    FiChevronRight,
    FiChevronDown,
    FiChevronUp,
    FiLayers
} from "react-icons/fi";

type TeacherAssignment = {
    _id: string;
    subjectId: string;
    subject: string;
    subjectCode: string;
    classId: string;
    class: string;
};

type HomeInfo = {
    employeeID: string;
    assignments: TeacherAssignment[];
    students: number;
    subjects: number;
    classes: number;
    isClassTeacher: boolean;
    temporaryArrangement?: {
        class: string;
        subject: string;
    }[] | null;
};

function TeacherHome() {
    const navigate = useNavigate();

    const [homeInfo, setHomeInfo] = useState<HomeInfo | null>(null);
    const [assignmentsExpanded, setAssignmentsExpanded] = useState(false);

    const user = JSON.parse(
        localStorage.getItem("user") || "{}"
    );

    const fetchHome = async () => {
        try {
            const response = await viewHome();
            setHomeInfo(response.data);
        } catch (error) {
            console.error("Failed to fetch teacher home:", error);
        }
    };

    useEffect(() => {
        void fetchHome();
    }, []);

    const assignments = homeInfo?.assignments ?? [];
    const visibleAssignments = assignmentsExpanded
        ? assignments
        : assignments.slice(0, 3);

    const uniqueSubjects = [
        ...new Set(assignments.map((assignment) => assignment.subject))
    ];

    const uniqueClasses = [
        ...new Set(assignments.map((assignment) => assignment.class))
    ];

    return (
        <div className="flex min-h-screen flex-col font-fredoka">
            <NavBar />

            <div className="flex flex-1 bg-purple-100">
                <SideBar />

                <main className="min-w-0 flex-1">
                    <Breadcrumb />

                    <div className="flex flex-col px-5 pb-16 pt-12 sm:px-8 lg:px-12 xl:px-20">

                        {/* Welcome */}
                        <section className="mb-8">
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-3xl font-medium text-gray-900">
                                    Welcome, {user.name || "Teacher"}
                                </h1>

                                {homeInfo?.isClassTeacher && (
                                    <span className="rounded-full bg-purple-200 px-3 py-1 text-sm font-medium text-purple-800">
                                        Class Teacher
                                    </span>
                                )}
                            </div>

                            <p className="mt-2 text-gray-500">
                                Here's an overview of your teaching information.
                            </p>

                            {homeInfo?.temporaryArrangement &&
                                homeInfo.temporaryArrangement.length > 0 && (
                                    <div className="mt-6 flex items-start gap-4 rounded-xl border border-amber-300 bg-amber-50 p-5 shadow-sm">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                                            <FiCalendar size={22} />
                                        </div>

                                        <div>
                                            <h2 className="text-lg font-semibold text-amber-900">
                                                Temporary Teaching Assignment
                                            </h2>

                                            <div className="mt-1 space-y-2 text-sm leading-6 text-amber-800">
                                                {homeInfo.temporaryArrangement.map((arrangement, index) => (
                                                    <p key={`${arrangement.class}-${arrangement.subject}-${index}`}>
                                                        You have been temporarily assigned to cover{" "}
                                                        <strong>Class {arrangement.class}</strong> for{" "}
                                                        <strong>{arrangement.subject}</strong>.
                                                    </p>
                                                ))}

                                                <p>
                                                    These temporary assignments will remain in place until
                                                    permanent replacements are appointed.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                        </section>

                        {/* Summary Cards */}
                        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

                            <div className="rounded-xl bg-purple-200 p-5 shadow-sm">
                                <p className="mb-2 text-sm font-medium text-gray-600">
                                    Employee ID
                                </p>

                                <p className="break-words text-2xl font-semibold text-gray-900">
                                    {homeInfo?.employeeID ?? "—"}
                                </p>
                            </div>

                            <div className="rounded-xl bg-purple-200 p-5 shadow-sm">
                                <p className="mb-2 text-sm font-medium text-gray-600">
                                    UID
                                </p>

                                <p className="break-words text-2xl font-semibold text-gray-900">
                                    {user.uid?.toUpperCase() ?? "—"}
                                </p>
                            </div>

                            <div className="rounded-xl bg-purple-200 p-5 shadow-sm">
                                <p className="mb-2 text-sm font-medium text-gray-600">
                                    Subjects
                                </p>

                                <p className="text-2xl font-semibold text-gray-900">
                                    {homeInfo?.subjects ?? "—"}
                                </p>

                                <p className="mt-1 text-xs text-gray-600">
                                    Unique subjects assigned
                                </p>
                            </div>

                            <div className="rounded-xl bg-purple-200 p-5 shadow-sm">
                                <p className="mb-2 text-sm font-medium text-gray-600">
                                    Classes
                                </p>

                                <p className="text-2xl font-semibold text-gray-900">
                                    {homeInfo?.classes ?? "—"}
                                </p>

                                <p className="mt-1 text-xs text-gray-600">
                                    Unique classes assigned
                                </p>
                            </div>
                        </section>

                        {/* Teaching Assignments */}
                        <section className="mb-8 rounded-xl border border-purple-200 bg-purple-200/70 p-5 shadow-sm sm:p-7">
                            <div className="mb-5 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-300 text-purple-900">
                                        <FiLayers size={22} />
                                    </div>

                                    <div>
                                        <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">
                                            My Teaching Assignments
                                        </h2>

                                        <p className="mt-1 text-sm text-gray-600">
                                            Classes and subjects assigned to you
                                        </p>
                                    </div>
                                </div>

                                {assignments.length > 3 && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setAssignmentsExpanded((previous) => !previous)
                                        }
                                        aria-expanded={assignmentsExpanded}
                                        aria-label={
                                            assignmentsExpanded
                                                ? "Collapse teaching assignments"
                                                : "Expand teaching assignments"
                                        }
                                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-purple-300 bg-purple-100 text-purple-900 transition-colors hover:bg-purple-300"
                                    >
                                        {assignmentsExpanded ? (
                                            <FiChevronUp size={21} />
                                        ) : (
                                            <FiChevronDown size={21} />
                                        )}
                                    </button>
                                )}
                            </div>

                            {!homeInfo ? (
                                <p className="rounded-lg bg-purple-100 p-4 text-sm text-gray-600">
                                    Loading your assignments...
                                </p>
                            ) : assignments.length === 0 ? (
                                <p className="rounded-lg border border-purple-300 bg-purple-100 p-4 text-sm text-gray-600">
                                    No teaching assignments have been assigned to you yet.
                                </p>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                        {visibleAssignments.map((assignment) => (
                                            <div
                                                key={assignment._id}
                                                className="flex min-w-0 items-center gap-3 rounded-xl border border-purple-200 bg-purple-100 p-4 transition-colors hover:border-purple-400"
                                            >
                                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-purple-200 text-purple-900">
                                                    <FiBookOpen size={21} />
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-xs font-medium uppercase tracking-wide text-purple-800">
                                                        Class {assignment.class}
                                                    </p>

                                                    <p className="mt-1 break-words font-semibold text-gray-900">
                                                        {assignment.subject}
                                                    </p>

                                                    <p className="mt-1 text-xs text-gray-500">
                                                        {assignment.subjectCode}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {assignments.length > 3 && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setAssignmentsExpanded((previous) => !previous)
                                            }
                                            className="mt-4 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-purple-900 transition-colors hover:bg-purple-200"
                                        >
                                            {assignmentsExpanded
                                                ? "Show fewer assignments"
                                                : `View all ${assignments.length} assignments`}

                                            {assignmentsExpanded ? (
                                                <FiChevronUp size={17} />
                                            ) : (
                                                <FiChevronDown size={17} />
                                            )}
                                        </button>
                                    )}
                                </>
                            )}
                        </section>

                        {/* Quick Navigation and Profile */}
                        <section className="grid grid-cols-1 gap-8 xl:grid-cols-2">

                            {/* Quick Navigation */}
                            <div className="rounded-xl bg-purple-200 p-6 shadow-sm sm:p-7">
                                <div className="mb-6">
                                    <h2 className="text-2xl font-medium text-gray-900">
                                        Quick Navigation
                                    </h2>

                                    <p className="mt-1 text-sm text-gray-500">
                                        Quickly access frequently used sections
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                                    <button
                                        type="button"
                                        onClick={() => navigate("viewStudents")}
                                        className="group flex items-center justify-between rounded-lg border border-purple-300 bg-purple-100 px-4 py-4 text-left transition-all hover:bg-purple-50 hover:shadow-sm"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-200 text-gray-700">
                                                <FiUsers size={20} />
                                            </div>

                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    Students
                                                </p>

                                                <p className="text-xs text-gray-500">
                                                    View your students
                                                </p>
                                            </div>
                                        </div>

                                        <FiChevronRight
                                            className="text-gray-400 transition-transform group-hover:translate-x-1"
                                            size={18}
                                        />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => navigate("attendance")}
                                        className="group flex items-center justify-between rounded-lg border border-purple-300 bg-purple-100 px-4 py-4 text-left transition-all hover:bg-purple-50 hover:shadow-sm"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-200 text-gray-700">
                                                <FiCalendar size={20} />
                                            </div>

                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    Attendance
                                                </p>

                                                <p className="text-xs text-gray-500">
                                                    Manage attendance
                                                </p>
                                            </div>
                                        </div>

                                        <FiChevronRight
                                            className="text-gray-400 transition-transform group-hover:translate-x-1"
                                            size={18}
                                        />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => navigate("viewMarks")}
                                        className="group flex items-center justify-between rounded-lg border border-purple-300 bg-purple-100 px-4 py-4 text-left transition-all hover:bg-purple-50 hover:shadow-sm"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-200 text-gray-700">
                                                <FiBarChart2 size={20} />
                                            </div>

                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    Marks
                                                </p>

                                                <p className="text-xs text-gray-500">
                                                    Manage student marks
                                                </p>
                                            </div>
                                        </div>

                                        <FiChevronRight
                                            className="text-gray-400 transition-transform group-hover:translate-x-1"
                                            size={18}
                                        />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => navigate("viewSubjects")}
                                        className="group flex items-center justify-between rounded-lg border border-purple-300 bg-purple-100 px-4 py-4 text-left transition-all hover:bg-purple-50 hover:shadow-sm"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-200 text-gray-700">
                                                <FiBookOpen size={20} />
                                            </div>

                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    Subjects
                                                </p>

                                                <p className="text-xs text-gray-500">
                                                    View your subjects
                                                </p>
                                            </div>
                                        </div>

                                        <FiChevronRight
                                            className="text-gray-400 transition-transform group-hover:translate-x-1"
                                            size={18}
                                        />
                                    </button>
                                </div>
                            </div>

                            {/* My Profile */}
                            <div className="rounded-xl bg-purple-200 p-6 shadow-sm sm:p-7">
                                <div className="mb-6">
                                    <h2 className="text-2xl font-medium text-gray-900">
                                        My Profile
                                    </h2>

                                    <p className="mt-1 text-sm text-gray-500">
                                        Your account information
                                    </p>
                                </div>

                                <div className="flex flex-col gap-5">
                                    <div className="flex items-center justify-between gap-4 border-b border-purple-300 pb-4">
                                        <span className="text-gray-500">
                                            Name
                                        </span>

                                        <span className="text-right text-lg font-medium text-gray-900">
                                            {user.name || "—"}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between gap-4 border-b border-purple-300 pb-4">
                                        <span className="text-gray-500">
                                            UID
                                        </span>

                                        <span className="text-lg font-medium text-gray-900">
                                            {user.uid?.toUpperCase() || "—"}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-gray-500">
                                            Unique subjects
                                        </span>

                                        <span className="text-lg font-medium text-gray-900">
                                            {uniqueSubjects.length}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-gray-500">
                                            Assigned classes
                                        </span>

                                        <span className="text-lg font-medium text-gray-900">
                                            {uniqueClasses.length}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className="mt-7 rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-700"
                                    onClick={() => navigate("profile")}
                                >
                                    View Profile
                                </button>
                            </div>
                        </section>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default TeacherHome;
