import { NavLink } from "react-router-dom";
import { useAdmission } from "../context/admissionContext";
import {
    LayoutDashboard,
    School,
    BookOpen,
    Users,
    Presentation,
    ClipboardCheck,
    UserRoundPlus,
    CalendarDays,
    CalendarClock,
    ChevronRight,
    GraduationCap
} from "lucide-react";

type Role = "principal" | "teacher" | "student";

type User = {
    name: string;
    uid: string;
    role: Role;
};

type Link = {
    label: string;
    path: string;
    icon: React.ElementType;
};

type Section = {
    title?: string;
    links: Link[];
};

function SideBar() {
    const { pendingRequests } = useAdmission();

    const storedUser = localStorage.getItem("user");

    const user: User | null = storedUser
        ? JSON.parse(storedUser)
        : null;

    const principalSections: Section[] = [
        {
            links: [
                {
                    label: "Dashboard",
                    path: "/principal",
                    icon: LayoutDashboard
                }
            ]
        },
        {
            title: "Academics",
            links: [
                {
                    label: "Classes",
                    path: "/principal/viewClass",
                    icon: School
                },
                {
                    label: "Subjects",
                    path: "/principal/viewSubjects",
                    icon: BookOpen
                },
                {
                    label: "Student Marks",
                    path: "/principal/viewMarks",
                    icon: GraduationCap
                },
                {
                    label: "Exams",
                    path: "/principal/viewExams",
                    icon: ClipboardCheck
                }
            ]
        },
        {
            title: "People",
            links: [
                {
                    label: "Students",
                    path: "/principal/viewStudents",
                    icon: Users
                },
                {
                    label: "Teachers",
                    path: "/principal/viewTeachers",
                    icon: Presentation
                }
            ]
        },
        {
            title: "School Operations",
            links: [
                {
                    label: "Student Attendance",
                    path: "/principal/attendance",
                    icon: ClipboardCheck
                },
                {
                    label: "Teacher Attendance",
                    path: "/principal/teacherAttendance",
                    icon: CalendarClock
                },
                {
                    label: "Admission Requests",
                    path: "/principal/admissionRequests",
                    icon: UserRoundPlus
                },
                {
                    label: "Holidays",
                    path: "/principal/viewHolidays",
                    icon: CalendarDays
                },
                {
                    label: "Leaves",
                    path: "/principal/viewLeaves",
                    icon: CalendarClock
                }
            ]
        }
    ];

    const teacherSections: Section[] = [
        {
            links: [
                {
                    label: "Dashboard",
                    path: "/teacher",
                    icon: LayoutDashboard
                }
            ]
        },
        {
            title: "My Classroom",
            links: [
                {
                    label: "My Students",
                    path: "/teacher/viewStudents",
                    icon: Users
                },
                {
                    label: "Class Subjects",
                    path: "/teacher/viewSubjects",
                    icon: BookOpen
                },
                {
                    label: "My Student Marks",
                    path: "/teacher/viewMarks",
                    icon: GraduationCap
                },
                {
                    label: "Exams",
                    path: "/teacher/viewExams",
                    icon: School
                }
            ]
        },
        {
            title: "Attendance & Leave",
            links: [
                {
                    label: "Student Attendance",
                    path: "/teacher/attendance",
                    icon: ClipboardCheck
                },
                {
                    label: "My Attendance",
                    path: "/teacher/myAttendance",
                    icon: CalendarDays
                },
                {
                    label: "Student Leaves",
                    path: "/teacher/viewLeaves",
                    icon: CalendarClock
                },
                {
                    label: "Apply Leave",
                    path: "/teacher/myLeaves",
                    icon: UserRoundPlus
                },
                {
                    label: "Holidays",
                    path: "/teacher/viewHolidays",
                    icon: CalendarDays
                }
            ]
        }
    ];

    const studentSections: Section[] = [
        {
            links: [
                {
                    label: "Dashboard",
                    path: "/student",
                    icon: LayoutDashboard
                }
            ]
        },
        {
            title: "My Academics",
            links: [
                {
                    label: "My Subjects",
                    path: "/student/viewSubjects",
                    icon: BookOpen
                },
                {
                    label: "My Marks",
                    path: "/student/viewMarks",
                    icon: GraduationCap
                }
            ]
        },
        {
            title: "Attendance & Leave",
            links: [
                {
                    label: "Attendance",
                    path: "/student/attendance",
                    icon: ClipboardCheck
                },
                {
                    label: "Apply Leave",
                    path: "/student/viewLeaves",
                    icon: CalendarClock
                },
                {
                    label: "Holidays",
                    path: "/student/viewHolidays",
                    icon: CalendarDays
                }
            ]
        }
    ];

    const sectionsByRole: Record<Role, Section[]> = {
        principal: principalSections,
        teacher: teacherSections,
        student: studentSections
    };

    const sections = user ? sectionsByRole[user.role] ?? [] : [];

    return (
        <aside className="w-64 shrink-0 self-stretch border-r border-purple-300/70 bg-purple-200 font-fredoka">

            <nav className="px-4 py-5">
                <div className="flex flex-col gap-5">
                    {sections.map((section) => (
                        <div
                            key={section.title ?? "dashboard"}
                            className="flex flex-col gap-1"
                        >
                            {section.title && (
                                <h2 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-purple-800/70">
                                    {section.title}
                                </h2>
                            )}

                            {section.links.map((link) => {
                                const Icon = link.icon;

                                const isAdmissions =
                                    link.label === "Admission Requests";

                                return (
                                    <NavLink
                                        key={link.path}
                                        to={link.path}
                                        end={
                                            link.path === "/principal" ||
                                            link.path === "/teacher" ||
                                            link.path === "/student"
                                        }
                                        className={({ isActive }) =>
                                            `group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-150 ${
                                                isActive
                                                    ? "bg-purple-300 font-semibold text-purple-950 shadow-sm"
                                                    : "text-purple-950/80 hover:bg-purple-300/60 hover:text-purple-950"
                                            }`
                                        }
                                    >
                                        {({ isActive }) => (
                                            <>
                                                {isActive && (
                                                    <span className="absolute bottom-2 left-0 top-2 w-1 rounded-r-full bg-purple-800" />
                                                )}

                                                <Icon
                                                    size={19}
                                                    strokeWidth={
                                                        isActive ? 2.3 : 1.8
                                                    }
                                                    className={`shrink-0 ${
                                                        isActive
                                                            ? "text-purple-800"
                                                            : "text-purple-800/75 group-hover:text-purple-900"
                                                    }`}
                                                />

                                                <span className="flex-1">
                                                    {link.label}
                                                </span>

                                                {isAdmissions &&
                                                    pendingRequests > 0 && (
                                                        <span className="min-w-5 rounded-full bg-purple-800 px-1.5 py-0.5 text-center text-xs font-semibold text-white">
                                                            {pendingRequests}
                                                        </span>
                                                    )}

                                                <ChevronRight
                                                    size={15}
                                                    className={`shrink-0 transition-opacity ${
                                                        isActive
                                                            ? "opacity-70"
                                                            : "opacity-0 group-hover:opacity-50"
                                                    }`}
                                                />
                                            </>
                                        )}
                                    </NavLink>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </nav>
        </aside>
    );
}

export default SideBar;