
import { useEffect, useRef, useState } from "react";

import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import Breadcrumb from "../../components/breadcrumb";
import AttendanceCalendar from "../../components/attendanceCalendar";

import {
    getMyMonthlyAttendance,
    getHolidays
} from "../../services/teacherApi";

type Attendance = {
    date: string;
    status: "Present" | "Absent" | "Leave";
};

type Holiday = {
    date: string;
    name: string;
};

type TeacherInfo = {
    name: string;
    uid: string;
    employeeID: string;
};

type AttendanceResponse = {
    attendance: Attendance[];
    teacher: TeacherInfo;
};

function TeacherAttendanceCalendar() {
    const [attendance, setAttendance] =
        useState<Attendance[]>([]);

    const [holidays, setHolidays] =
        useState<Holiday[]>([]);

    const [teacher, setTeacher] =
        useState<TeacherInfo | null>(null);

    const [loading, setLoading] = useState(true);
    const [holidayLoading, setHolidayLoading] =
        useState(true);

    const [currentMonth, setCurrentMonth] = useState(() => {
        const today = new Date();

        return {
            year: today.getFullYear(),
            month: today.getMonth() + 1
        };
    });

    const attendanceCache = useRef<
        Record<string, Attendance[]>
    >({});

    const holidaysCache = useRef<
        Record<number, Holiday[]>
    >({});

    const attendanceRequestId = useRef(0);

    // Fetch attendance for the selected month.
    useEffect(() => {
        let cancelled = false;
        const requestId = ++attendanceRequestId.current;

        const fetchAttendance = async () => {
            setLoading(true);

            const { year, month } = currentMonth;
            const cacheKey =
                `${year}-${String(month).padStart(2, "0")}`;

            try {
                let monthAttendance =
                    attendanceCache.current[cacheKey];

                if (!monthAttendance) {
                    const response =
                        await getMyMonthlyAttendance(year, month);

                    const data =
                        response.data as AttendanceResponse;

                    monthAttendance = data.attendance.map(
                        record => ({
                            ...record,
                            date: record.date.slice(0, 10)
                        })
                    );

                    attendanceCache.current[cacheKey] =
                        monthAttendance;

                    if (!cancelled) {
                        setTeacher(data.teacher);
                    }
                } else if (!cancelled && !teacher) {
                    // The monthly endpoint also returns teacher details.
                    const response =
                        await getMyMonthlyAttendance(year, month);

                    if (!cancelled) {
                        setTeacher(
                            (response.data as AttendanceResponse).teacher
                        );
                    }
                }

                if (
                    !cancelled &&
                    requestId === attendanceRequestId.current
                ) {
                    setAttendance(monthAttendance);
                }
            } catch (error) {
                console.error(
                    "Failed to fetch monthly teacher attendance:",
                    error
                );

                if (
                    !cancelled &&
                    requestId === attendanceRequestId.current
                ) {
                    setAttendance([]);
                }
            } finally {
                if (
                    !cancelled &&
                    requestId === attendanceRequestId.current
                ) {
                    setLoading(false);
                }
            }
        };

        void fetchAttendance();

        return () => {
            cancelled = true;
        };
    }, [currentMonth]);

    // Fetch holidays once per year.
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
                        (holiday: Holiday) => ({
                            ...holiday,
                            date: holiday.date.slice(0, 10)
                        })
                    );

                    holidaysCache.current[year] =
                        yearHolidays;
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

                    <div className="flex flex-1 flex-col px-16 pt-10 pb-12">
                        <div className="mb-8">
                            <h1 className="text-3xl font-medium text-gray-900">
                                Attendance Calendar
                            </h1>

                            <p className="mt-1 text-sm text-gray-600">
                                View your attendance by date
                            </p>
                        </div>

                        {teacher && (
                            <div className="mb-6 flex flex-wrap gap-8">
                                <div>
                                    Teacher:
                                    <span className="ml-1 font-medium">
                                        {teacher.name}
                                    </span>
                                </div>

                                <div>
                                    UID:
                                    <span className="ml-1 font-medium">
                                        {teacher.uid.toUpperCase()}
                                    </span>
                                </div>

                                <div>
                                    Employee ID:
                                    <span className="ml-1 font-medium">
                                        {teacher.employeeID}
                                    </span>
                                </div>
                            </div>
                        )}

                        {(loading || holidayLoading) && (
                            <p className="mb-3 text-gray-600">
                                Loading calendar...
                            </p>
                        )}

                        {loading ? (
                            <p className="text-gray-600">
                                Loading attendance...
                            </p>
                        ) : (
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
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TeacherAttendanceCalendar;
