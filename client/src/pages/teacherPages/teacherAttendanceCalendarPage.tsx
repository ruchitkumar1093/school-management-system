import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import Breadcrumb from "../../components/breadcrumb";
import AttendanceCalendar from "../../components/attendanceCalendar";

import { getStudentAttendance } from "../../services/teacherApi";

type Attendance = {
    _id: string;
    date: string;
    status: "Present" | "Absent" | "Leave";
};

type StudentInfo = {
    _id: string;
    name: string;
    uid: string;
    class: string;
    rollNumber: string;
};

function TeacherAttendanceCalendarPage() {
    const location = useLocation();
    const navigate = useNavigate();

    const studentId = location.state?.studentId as string | undefined;

    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [student, setStudent] = useState<StudentInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!studentId) {
            setError("Please select a student to view attendance.");
            setLoading(false);
            return;
        }

        const fetchAttendance = async () => {
            try {
                const response = await getStudentAttendance(studentId, 1, 10000);

                const records = response.data.attendance.map(
                    (record: Attendance) => ({
                        ...record,
                        date: record.date.split("T")[0]
                    })
                );

                setAttendance(records);

                setStudent(response.data.student);
            }
            catch (error: any) {
                setError(
                    error.response?.data?.message ||
                    "Failed to fetch student attendance."
                );
            }
            finally {
                setLoading(false);
            }
        };

        fetchAttendance();
    }, [studentId]);

    return (
        <div className="flex min-h-screen flex-col font-fredoka">
            <NavBar />

            <div className="flex flex-1 bg-purple-100">
                <SideBar />

                <div className="flex min-w-0 flex-1 flex-col">
                    <Breadcrumb />

                    <div className="flex w-fit max-w-full flex-col px-16 pt-10 pb-12">
                        <div className="mb-8 flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-medium text-gray-900">
                                    Student Attendance Calendar
                                </h1>

                                <p className="mt-1 text-sm text-gray-600">
                                    View a student's attendance by date
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="cursor-pointer rounded-lg bg-purple-300 px-6 py-3 font-medium text-purple-950 shadow-[0_2px_3px] transition-colors hover:bg-violet-300"
                            >
                                Back
                            </button>
                        </div>

                        {loading ? (
                            <p className="text-gray-600">
                                Loading attendance...
                            </p>
                        ) : error ? (
                            <p className="text-red-600">{error}</p>
                        ) : (
                            <>
                                {student && (
                                    <div className="mb-6 flex flex-wrap gap-8">
                                        <div>
                                            Student:
                                            <span className="ml-1 font-medium">
                                                {student.name}
                                            </span>
                                        </div>

                                        <div>
                                            UID:
                                            <span className="ml-1 font-medium">
                                                {student.uid.toUpperCase()}
                                            </span>
                                        </div>

                                        <div>
                                            Class:
                                            <span className="ml-1 font-medium">
                                                {student.class}
                                            </span>
                                        </div>

                                        <div>
                                            Roll Number:
                                            <span className="ml-1 font-medium">
                                                {student.rollNumber}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <AttendanceCalendar
                                    attendance={attendance}
                                    holidays={[]}
                                />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TeacherAttendanceCalendarPage;