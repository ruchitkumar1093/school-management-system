import { Link, useLocation } from "react-router-dom";

function Breadcrumb() {
    const location = useLocation();

    const labels: Record<string, string> = {
        // Portals
        principal: "Principal",
        teacher: "Teacher",
        student: "Student",

        // Common pages
        viewTeachers: "All Teachers",
        teacherForm: "Teacher Form",
        viewStudents: "All Students",
        studentForm: "Student Form",
        attendance: "Attendance",
        viewAttendance: "View Attendance",
        viewSubjects: "School Subjects",
        subjectForm: "Subject Form",
        viewMarks: "Student Marks",
        marksForm: "Marks Form",
        viewExams: "Exams",
        profile: "Profile",
        changePassword: "Change Password",
        teacherProfile: "Profile",
        studentProfile: "Profile",

        // Principal pages
        admissionRequests: "Admission Requests",
        viewRequest: "View Request"
    };

    const paths = location.pathname
        .split("/")
        .filter(Boolean);

    return (
        <div>
            <div
                className="
                    flex items-center
                    bg-purple-200
                    shadow-sm
                    overflow-hidden
                    w-fit
                    pr-8
                "
                style={{
                    clipPath:
                        "polygon(0 0, calc(100% - 25px) 0, 100% 50%, calc(100% - 25px) 100%, 0 100%)"
                }}
            >
                {paths.map((path, index) => {
                    const pathTo =
                        "/" + paths.slice(0, index + 1).join("/");

                    const isLast =
                        index === paths.length - 1;

                    return (
                        <div
                            key={`${path}-${index}`}
                            className="flex items-center"
                        >
                            {isLast ? (
                                <span className="px-4 py-2 text-gray-600 font-medium">
                                    {labels[path] || path}
                                </span>
                            ) : (
                                <Link
                                    to={pathTo}
                                    className="
                                        px-4 py-2
                                        text-purple-700
                                        font-medium
                                        hover:text-purple-800
                                    "
                                >
                                    {labels[path] || path}
                                </Link>
                            )}

                            {!isLast && (
                                <span className="text-purple-500 font-bold px-1">
                                    &gt;
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default Breadcrumb;