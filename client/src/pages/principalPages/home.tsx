import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import Breadcrumb from "../../components/breadcrumb";
import { viewHome } from "../../services/principalApi";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmission } from "../../context/admissionContext";
import {
    School,
    Users,
    BookOpen,
    ChevronRight,
    ClipboardCheck,
    CalendarDays,
    UserRoundPlus,
    FileText,
    Presentation,
    ArrowUpRight,
    CalendarClock,
    GraduationCap
} from "lucide-react";

type HomeInfo = {
    totalStudents: number;
    totalTeachers: number;
    totalSubjects: number;
    totalClasses: number;
    classes: SchoolClass[];
};

type SchoolClass = {
    _id: string;
    class: string;
};

function PrincipalHome() {
    const [homeInfo, setHomeInfo] = useState<HomeInfo | null>(null);
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();
    const { pendingRequests } = useAdmission();

    const user = JSON.parse(
        localStorage.getItem("user") || "{}"
    );

    const today = new Date().toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric"
    });

    const fetchHome = async () => {
        try {
            setLoading(true);

            const response = await viewHome();
            setHomeInfo(response.data);
        } catch (error) {
            console.error(
                "Failed to fetch school overview:",
                error
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchHome();
    }, []);

    const classes = homeInfo?.classes ?? [];

    // Open the class overview with the selected class.
    const openClassOverview = (className = "1st") => {
        navigate("viewClass", {
            state: {
                selectedClass: className
            }
        });
    };

    const quickActions = [
        {
            title: "Teacher attendance",
            description: "Record or review staff attendance",
            icon: Presentation,
            path: "teacherAttendance",
            accent: "bg-indigo-100 text-indigo-800"
        },
        {
            title: "Admission requests",
            description: "Review pending applications",
            icon: UserRoundPlus,
            path: "admissionRequests",
            accent: "bg-amber-100 text-amber-800",
            count: pendingRequests
        },
        {
            title: "Leave requests",
            description: "Review school leave records",
            icon: CalendarClock,
            path: "viewLeaves",
            accent: "bg-blue-100 text-blue-800"
        },
        {
            title: "Student attendance",
            description: "Review attendance across classes",
            icon: ClipboardCheck,
            path: "attendance",
            accent: "bg-emerald-100 text-emerald-800"
        }
    ];

    const shortcuts = [
        {
            title: "Student marks",
            icon: GraduationCap,
            path: "viewMarks"
        },
        {
            title: "Exams",
            icon: FileText,
            path: "viewExams"
        },
        {
            title: "Teachers",
            icon: Presentation,
            path: "viewTeachers"
        },
        {
            title: "Subjects",
            icon: BookOpen,
            path: "viewSubjects"
        },
        {
            title: "Students",
            icon: Users,
            path: "viewStudents"
        }
    ];

    return (
        <div className="flex min-h-screen flex-col font-fredoka">
            <NavBar />

            <div className="flex flex-1 items-stretch bg-purple-100">
                <SideBar />

                <main className="min-w-0 flex-1">
                    <Breadcrumb />

                    <div className="mx-auto flex max-w-[1700px] flex-col gap-7 px-5 py-6 sm:px-7 lg:px-9">

                        {/* Dashboard header */}
                        <section className="flex flex-col justify-between gap-4 border-b border-purple-200 pb-5 sm:flex-row sm:items-center">
                            <div>
                                <div className="mb-1 flex items-center gap-2 text-sm font-medium text-purple-800">
                                    <School size={17} />
                                    Principal dashboard
                                </div>

                                <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
                                    Welcome, {user.name || "Principal"}
                                </h1>

                                <p className="mt-1 text-sm text-gray-600">
                                    Your school at a glance. What needs your attention today?
                                </p>
                            </div>

                            <div className="flex flex-col gap-2 sm:items-end">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <CalendarDays
                                        size={16}
                                        className="text-purple-800"
                                    />
                                    {today}
                                </div>

                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
                                    <span>
                                        <strong className="text-gray-900">
                                            {homeInfo?.totalStudents ?? "—"}
                                        </strong>{" "}
                                        students
                                    </span>

                                    <span className="text-purple-400">•</span>

                                    <span>
                                        <strong className="text-gray-900">
                                            {homeInfo?.totalTeachers ?? "—"}
                                        </strong>{" "}
                                        teachers
                                    </span>

                                    <span className="text-purple-400">•</span>

                                    <span>
                                        <strong className="text-gray-900">
                                            {homeInfo?.totalSubjects ?? "—"}
                                        </strong>{" "}
                                        subjects
                                    </span>

                                    <span className="text-purple-400">•</span>

                                    <span>
                                        <strong className="text-gray-900">
                                            {homeInfo?.totalClasses ?? "—"}
                                        </strong>{" "}
                                        classes
                                    </span>
                                </div>
                            </div>
                        </section>

                        {/* Classes loaded from the database */}
                        <section>
                            <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        Classes
                                    </h2>

                                    <p className="mt-1 text-sm text-gray-600">
                                        Select a class to open its overview, roster, attendance, and academic information.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => openClassOverview()}
                                    className="inline-flex items-center gap-1 self-start text-sm font-medium text-purple-800 transition-colors hover:text-purple-950 sm:self-auto"
                                >
                                    Full class overview
                                    <ArrowUpRight size={16} />
                                </button>
                            </div>

                            <div className="classes-scrollbar overflow-x-auto rounded-xl border border-purple-200 bg-purple-200/50 p-3">
                                <div className="flex min-w-max gap-3">
                                    {loading ? (
                                        <p className="px-3 py-4 text-sm text-gray-600">
                                            Loading classes...
                                        </p>
                                    ) : classes.length > 0 ? (
                                        classes.map((schoolClass) => (
                                            <button
                                                key={schoolClass._id}
                                                type="button"
                                                onClick={() => openClassOverview(schoolClass.class)}
                                                className="group flex w-[94px] flex-col items-center gap-3 rounded-lg border border-purple-200 bg-purple-100 px-3 py-4 transition-all hover:border-purple-500 hover:bg-purple-300 hover:shadow-sm"
                                            >
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-200 text-purple-900 transition-colors group-hover:bg-purple-800 group-hover:text-white">
                                                    <School size={21} />
                                                </div>

                                                <span className="text-sm font-semibold text-gray-900">
                                                    Class {schoolClass.class}
                                                </span>

                                                <span className="text-xs text-purple-800">
                                                    View class
                                                </span>
                                            </button>
                                        ))
                                    ) : (
                                        <p className="px-3 py-4 text-sm text-gray-600">
                                            No classes found.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Quick actions */}
                        <section>
                            <div className="mb-4">
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Quick actions
                                </h2>

                                <p className="mt-1 text-sm text-gray-600">
                                    Common tasks you may need to complete today.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                                {quickActions.map((action) => {
                                    const Icon = action.icon;

                                    return (
                                        <button
                                            key={action.title}
                                            type="button"
                                            onClick={() => navigate(action.path)}
                                            className="group flex min-w-0 items-center gap-3 rounded-xl border border-purple-200 bg-purple-200/70 p-4 text-left transition-all hover:border-purple-400 hover:bg-purple-200 hover:shadow-sm"
                                        >
                                            <div
                                                className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${action.accent}`}
                                            >
                                                <Icon size={21} />

                                                {action.count !== undefined &&
                                                    action.count > 0 && (
                                                        <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-purple-800 px-1 text-xs font-semibold text-white">
                                                            {action.count}
                                                        </span>
                                                    )}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-sm font-semibold text-gray-900">
                                                    {action.title}
                                                </h3>

                                                <p className="mt-1 text-xs leading-5 text-gray-600">
                                                    {action.description}
                                                </p>
                                            </div>

                                            <ChevronRight
                                                size={17}
                                                className="shrink-0 text-purple-700/60 transition-transform group-hover:translate-x-1"
                                            />
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        {/* School management shortcuts */}
                        <section>
                            <div className="mb-3">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    School management
                                </h2>

                                <p className="mt-1 text-sm text-gray-600">
                                    Other areas you may need to access.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {shortcuts.map((shortcut) => {
                                    const Icon = shortcut.icon;

                                    return (
                                        <button
                                            key={shortcut.title}
                                            type="button"
                                            onClick={() => navigate(shortcut.path)}
                                            className="inline-flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-200/60 px-3 py-2.5 text-sm font-medium text-gray-800 transition-colors hover:border-purple-400 hover:bg-purple-200"
                                        >
                                            <Icon
                                                size={17}
                                                className="text-purple-800"
                                            />

                                            {shortcut.title}

                                            <ChevronRight
                                                size={14}
                                                className="text-purple-700/60"
                                            />
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Account link */}
                        <section className="flex flex-wrap items-center justify-between gap-3 border-t border-purple-200 pt-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-300 text-purple-900">
                                    <School size={18} />
                                </div>

                                <div>
                                    <p className="text-sm font-medium text-gray-900">
                                        {user.name || "Principal"}
                                    </p>

                                    <p className="text-xs text-gray-500">
                                        {user.uid
                                            ? user.uid.toUpperCase()
                                            : "Principal"}{" "}
                                        · Principal
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => navigate("profile")}
                                className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-purple-800 transition-colors hover:bg-purple-200"
                            >
                                View profile
                                <ChevronRight size={16} />
                            </button>
                        </section>

                    </div>
                </main>
            </div>
        </div>
    );
}

export default PrincipalHome;