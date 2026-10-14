import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import Breadcrumb from "../../components/breadcrumb";
import AttendanceCalendar from "../../components/attendanceCalendar";

import {
    getTeacherAttendanceDetails,
    getTeacherMonthlyAttendance,
    getHolidays
} from "../../services/principalApi";

type Attendance = {
    date: string;
    status: "Present" | "Absent" | "Leave";
};

type Holiday = {
    id: string;
    date: string;
    name: string;
};

type TeacherInfo = {
    _id: string;
    employeeID: string;
    department: string;
    userId: {
        name: string;
        uid?: string;
    };
};

type AttendanceResponse = {
    attendance: Attendance[];
};

function PrincipalTeacherAttendanceCalendarPage() {
    const { teacherId } = useParams<{ teacherId: string }>();

    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [teacher, setTeacher] = useState<TeacherInfo | null>(null);

    const [loading, setLoading] = useState(true);
    const [teacherLoading, setTeacherLoading] = useState(true);
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

    // Fetch teacher details when the selected teacher changes.
    useEffect(() => {
        if (!teacherId) {
            setError("Please select a teacher to view attendance.");
            setTeacher(null);
            setTeacherLoading(false);
            setLoading(false);
            return;
        }

        let cancelled = false;

        const fetchTeacher = async () => {
            setTeacherLoading(true);

            try {
                const response =
                    await getTeacherAttendanceDetails(teacherId);

                if (!cancelled) {
                    setTeacher(response.data.teacher);
                }
            } catch (error: any) {
                if (!cancelled) {
                    setTeacher(null);
                    setError(
                        error.response?.data?.message ||
                        "Failed to fetch teacher details."
                    );
                }
            } finally {
                if (!cancelled) {
                    setTeacherLoading(false);
                }
            }
        };

        void fetchTeacher();

        return () => {
            cancelled = true;
        };
    }, [teacherId]);

    // Fetch attendance for the selected month.
    useEffect(() => {
        if (!teacherId) return;

        let cancelled = false;
        const currentRequestId = ++attendanceRequestId.current;

        const fetchAttendance = async () => {
            setLoading(true);
            setError("");

            const { year, month } = currentMonth;
            const cacheKey =
                `${teacherId}-${year}-${String(month).padStart(2, "0")}`;

            try {
                let records = attendanceCache.current[cacheKey];

                if (!records) {
                    const response =
                        await getTeacherMonthlyAttendance(
                            teacherId,
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
                        "Failed to fetch teacher attendance."
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
    }, [teacherId, currentMonth]);

    // Fetch holidays once per year using the shared endpoint.
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
                console.error("Failed to fetch holidays:", error);

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
                                    Teacher Attendance Calendar
                                </h1>

                                <p className="mt-1 text-sm text-gray-600">
                                    View a teacher's attendance by date
                                </p>
                            </div>
                        </div>

                        {(teacherLoading || loading || holidayLoading) && (
                            <p className="mb-3 text-gray-600">
                                Loading calendar...
                            </p>
                        )}

                        {error ? (
                            <p className="text-red-600">{error}</p>
                        ) : (
                            <>
                                {teacher && (
                                    <div className="mb-6 flex flex-wrap gap-8">
                                        <div>
                                            Teacher:
                                            <span className="ml-1 font-medium">
                                                {teacher.userId?.name ?? "N/A"}
                                            </span>
                                        </div>

                                        <div>
                                            Employee ID:
                                            <span className="ml-1 font-medium">
                                                {teacher.employeeID}
                                            </span>
                                        </div>

                                        <div>
                                            Department:
                                            <span className="ml-1 font-medium">
                                                {teacher.department}
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

export default PrincipalTeacherAttendanceCalendarPage;
