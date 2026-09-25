import { NavLink } from "react-router-dom";
import { useAdmission } from "../context/admissionContext";

type Link = {
    label: string;
    path: string;
};

type Role = "principal" | "teacher" | "student";

type User = {
    name: string;
    uid: string;
    role: Role;
};

function SideBar() {
    const { pendingRequests } = useAdmission();

    const storedUser = localStorage.getItem("user");

    const user: User | null = storedUser
        ? JSON.parse(storedUser)
        : null;

    const principalLinks: Link[] = [
        { label: "Home", path: "/principal" },
        { label: "Teachers", path: "/principal/viewTeachers" },
        { label: "Students", path: "/principal/viewStudents" },
        { label: "Attendance", path: "/principal/attendance" },
        { label: "Admission Requests", path: "/principal/admissionRequests" },
        { label: "School Subjects", path: "/principal/viewSubjects" },
        { label: "Student Marks", path: "/principal/viewMarks" },
        { label: "Exams", path: "/principal/viewExams" },
        { label: "Class Overview", path: "/principal/viewClass" }
    ];

    const teacherLinks: Link[] = [
        { label: "Home", path: "/teacher" },
        { label: "My Students", path: "/teacher/viewStudents" },
        { label: "Attendance", path: "/teacher/attendance" },
        { label: "Assigned Subjects", path: "/teacher/viewSubjects" },
        { label: "My Student Marks", path: "/teacher/viewMarks" },
        { label: "Exams", path: "/teacher/viewExams" }
    ];

    const studentLinks: Link[] = [
        { label: "Home", path: "/student" },
        { label: "Attendance", path: "/student/attendance" },
        { label: "My Subjects", path: "/student/viewSubjects" },
        { label: "My Marks", path: "/student/viewMarks" }
    ];

    const linksByRole: Record<Role, Link[]> = {
        principal: principalLinks,
        teacher: teacherLinks,
        student: studentLinks
    };

    const links = user ? linksByRole[user.role] : [];

    return (
        <aside className="bg-purple-200 w-3xs shrink-0 flex flex-col justify-between shadow-[0_5px_1px] font-fredoka">
            <div className="flex flex-col p-7 gap-5">
                {links.map((link, index) => {
                    return (
                        <NavLink
                            key={link.path}
                            to={link.path}
                            end={index === 0}
                            className={({ isActive }) =>
                                isActive
                                    ? "text-[#8900BA] font-[480]"
                                    : "hover:text-[#8900BA]"
                            }
                        >
                            <div className="flex gap-2">
                                <span>
                                    {link.label}
                                </span>

                                {link.label === "Admission Requests" && pendingRequests > 0 && (
                                    <span className="bg-purple-800 text-white rounded-full px-2 text-sm">
                                        {pendingRequests}
                                    </span>
                                )}
                            </div>
                        </NavLink>
                    );
                })}
            </div>
        </aside>
    );
}

export default SideBar;