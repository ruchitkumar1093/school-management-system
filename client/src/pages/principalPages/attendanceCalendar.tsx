import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import Breadcrumb from "../../components/breadcrumb";
import AttendanceCalendar from "../../components/attendanceCalendar";
import { getStudentAttendance, getHolidays } from "../../services/principalApi";

type AttendanceRecord = {
    _id: string;
    date: string;
    status: "Present" | "Absent" | "Leave";
    studentId?: {
        _id: string;
        class?: string;
        rollNumber?: string;
        userId?: { name?: string; uid?: string };
    };
};
type AttendanceDay = { date: string; status: "Present" | "Absent" | "Leave" };
type Holiday = { id: string; date: string; name: string };

function PrincipalAttendanceCalendarPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const studentId = location.state?.studentId as string | undefined;
    const [attendance, setAttendance] = useState<AttendanceDay[]>([]);
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [studentName, setStudentName] = useState("");
    const [studentUid, setStudentUid] = useState("");
    const [studentClass, setStudentClass] = useState("");
    const [rollNumber, setRollNumber] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!studentId) {
            setError("Student was not selected. Open the calendar from the attendance table.");
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            setError("");
            try {
                const [attendanceResponse, holidaysResponse] = await Promise.all([
                    getStudentAttendance(studentId, 1, 10000),
                    getHolidays()
                ]);
                const responseData = attendanceResponse.data;
                const records: AttendanceRecord[] = Array.isArray(responseData.attendance) ? responseData.attendance : [];

                setAttendance(records.map((record) => ({
                    date: record.date.split("T")[0],
                    status: record.status
                })));

                const student = responseData.student ?? records[0]?.studentId;
                if (student) {
                    setStudentName(student.name ?? student.userId?.name ?? "");
                    setStudentUid(student.uid ?? student.userId?.uid ?? "");
                    setStudentClass(student.class ?? "");
                    setRollNumber(student.rollNumber ?? "");
                }

                const holidayData = holidaysResponse.data.holidays ?? holidaysResponse.data;
                setHolidays(Array.isArray(holidayData) ? holidayData.map((holiday: any) => ({
                    id: holiday._id ?? holiday.id ?? holiday.date,
                    date: String(holiday.date).split("T")[0],
                    name: holiday.name
                })) : []);
            } catch (fetchError) {
                console.error(fetchError);
                setError("Unable to load this student's attendance calendar.");
                setAttendance([]);
                setHolidays([]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [studentId]);

    return (
        <div className="flex min-h-screen flex-col font-fredoka">
            <NavBar />
            <div className="flex flex-1 bg-purple-100">
                <SideBar />
                <div className="min-w-0 flex-1">
                    <Breadcrumb />
                    <div className="mb-10 flex w-fit max-w-full flex-col px-6 pt-10 md:px-12 lg:px-20">
                        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-medium text-gray-900">Student Attendance Calendar</h1>
                                <p className="mt-1 text-sm text-gray-600">View attendance history by date.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => navigate("/principal/attendance")}
                                className="cursor-pointer rounded-lg bg-purple-300 px-4 py-3 font-medium text-purple-950 shadow-[0_2px_3px] transition-colors hover:bg-violet-300"
                            >
                                Back to Attendance
                            </button>
                        </div>

                        {(studentName || studentUid || studentClass || rollNumber) && (
                            <div className="mb-6 flex flex-wrap gap-x-8 gap-y-3">
                                {studentName && <div>Name: <span className="font-medium">{studentName}</span></div>}
                                {studentUid && <div>UID: <span className="font-medium">{studentUid.toUpperCase()}</span></div>}
                                {studentClass && <div>Class: <span className="font-medium">{studentClass}</span></div>}
                                {rollNumber && <div>Roll Number: <span className="font-medium">{rollNumber}</span></div>}
                            </div>
                        )}

                        {loading ? (
                            <p className="py-8 text-center text-gray-600">Loading attendance calendar...</p>
                        ) : error ? (
                            <p className="rounded-lg bg-white p-5 text-center text-red-600">{error}</p>
                        ) : (
                            <AttendanceCalendar attendance={attendance} holidays={holidays} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PrincipalAttendanceCalendarPage;
