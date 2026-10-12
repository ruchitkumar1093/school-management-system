
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import Breadcrumb from "../../components/breadcrumb";
import AttendanceCalendar from "../../components/attendanceCalendar";

import {
    getStudentAttendance,
    getStudentMonthlyAttendance,
    getHolidays
} from "../../services/teacherApi";

type Attendance = {
    date: string;
    status: "Present" | "Absent" | "Leave";
};

type Holiday = {
    id: string;
    date: string;
    name: string;
};

type StudentInfo = {
    _id: string;
    name: string;
    uid: string;
    class: string;
    rollNumber: string | number;
};

type AttendanceResponse = {
    attendance: Attendance[];
};

function TeacherAttendanceCalendarPage() {
    const { studentId } = useParams<{ studentId: string }>();

    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [student, setStudent] = useState<StudentInfo | null>(null);

    const [loading, setLoading] = useState(true);
    const [studentLoading, setStudentLoading] = useState(true);
    const [holidayLoading, setHolidayLoading] = useState(true);
    const [error, setError] = useState("");

    const [currentMonth, setCurrentMonth] = useState(() => {
        const today = new Date();

        return {
            year: today.getFullYear(),
            month: today.getMonth() + 1
        };
    });

    const attendanceCache = useRef<Record<string, Attendance[]>>({});
    const holidaysCache = useRef<Record<number, Holiday[]>>({});
    const attendanceRequestId = useRef(0);

    // Fetch student details once when the page opens
    useEffect(() => {
        if (!studentId) {
            setError("Please select a student to view attendance.");
            setStudentLoading(false);
            setLoading(false);
            return;
        }

        let cancelled = false;

        const fetchStudent = async () => {
            setStudentLoading(true);

            try {
                // Existing endpoint returns student details and attendance history.
                // We use it here only to obtain the student information.
                const response = await getStudentAttendance(
                    studentId,
                    1,
                    1
                );

                if (!cancelled) {
                    setStudent(response.data.student);
                }
            } catch (error: any) {
                if (!cancelled) {
                    setError(
                        error.response?.data?.message ||
                        "Failed to fetch student details."
                    );
                }
            } finally {
                if (!cancelled) {
                    setStudentLoading(false);
                }
            }
        };

        void fetchStudent();

        return () => {
            cancelled = true;
        };
    }, [studentId]);

    // Fetch attendance only for the selected month
    useEffect(() => {
        if (!studentId) return;

        let cancelled = false;
        const currentRequestId = ++attendanceRequestId.current;

        const fetchAttendance = async () => {
            setLoading(true);
            setError("");

            const { year, month } = currentMonth;
            const cacheKey =
                `${studentId}-${year}-${String(month).padStart(2, "0")}`;

            try {
                let records = attendanceCache.current[cacheKey];

                if (!records) {
                    const response = await getStudentMonthlyAttendance(
                        studentId,
                        year,
                        month
                    );

                    const data =
                        response.data as AttendanceResponse;

                    records = data.attendance.map((record) => ({
                        ...record,
                        date: record.date.slice(0, 10)
                    }));

                    attendanceCache.current[cacheKey] = records;
                }

                if (
                    !cancelled &&
                    currentRequestId === attendanceRequestId.current
                ) {
                    setAttendance(records);
                }
            } catch (error: any) {
                if (
                    !cancelled &&
                    currentRequestId === attendanceRequestId.current
                ) {
                    setError(
                        error.response?.data?.message ||
                        "Failed to fetch student attendance."
                    );
                    setAttendance([]);
                }
            } finally {
                if (
                    !cancelled &&
                    currentRequestId === attendanceRequestId.current
                ) {
                    setLoading(false);
                }
            }
        };

        void fetchAttendance();

        return () => {
            cancelled = true;
        };
    }, [studentId, currentMonth]);

    // Fetch holidays once per year
    useEffect(() => {
        let cancelled = false;

        const fetchYearHolidays = async () => {
            setHolidayLoading(true);

            try {
                const year = currentMonth.year;
                let yearHolidays = holidaysCache.current[year];

                if (!yearHolidays) {
                    const response = await getHolidays(year);

                    yearHolidays = response.data.map(
                        (holiday: {
                            _id?: string;
                            id?: string;
                            date: string;
                            name: string;
                        }) => ({
                            id: holiday._id ?? holiday.id ?? "",
                            date: holiday.date.slice(0, 10),
                            name: holiday.name
                        })
                    );

                    holidaysCache.current[year] = yearHolidays;
                }

                if (!cancelled) {
                    setHolidays(yearHolidays);
                }
            } catch (error) {
                console.error(
                    "Failed to fetch holidays:",
                    error
                );

                if (!cancelled) {
                    setHolidays([]);
                }
            } finally {
                if (!cancelled) {
                    setHolidayLoading(false);
                }
            }
        };

        void fetchYearHolidays();

        return () => {
            cancelled = true;
        };
    }, [currentMonth.year]);

    const handleMonthChange = (
        year: number,
        month: number
    ) => {
        setCurrentMonth({ year, month });
    };

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
                        </div>

                        {(studentLoading || loading || holidayLoading) && (
                            <p className="mb-3 text-gray-600">
                                Loading calendar...
                            </p>
                        )}

                        {error ? (
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
                                    holidays={holidays}
                                    currentMonth={new Date(
                                        currentMonth.year,
                                        currentMonth.month - 1,
                                        1
                                    )}
                                    onMonthChange={handleMonthChange}
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
