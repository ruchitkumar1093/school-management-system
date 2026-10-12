
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import Breadcrumb from "../../components/breadcrumb";
import AttendanceCalendar from "../../components/attendanceCalendar";

import {
    getMonthlyAttendance,
    getHolidays
} from "../../services/studentApi";

type Attendance = {
    date: string;
    status: "Present" | "Absent" | "Leave";
};

type Holiday = {
    date: string;
    name: string;
};

type StudentInfo = {
    name: string;
    uid: string;
    class: string;
    rollNumber: string;
};

type AttendanceResponse = {
    attendance: Attendance[];
};

function AttendanceCalendarPage() {
    const location = useLocation();

    const [attendance, setAttendance] =
        useState<Attendance[]>([]);

    const [holidays, setHolidays] =
        useState<Holiday[]>([]);

    const [student, setStudent] =
        useState<StudentInfo | null>(
            location.state?.student ?? null
        );

    const [loading, setLoading] =
        useState(true);

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

    // Fetch attendance for the selected month only
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
                    const response = await getMonthlyAttendance(
                        year,
                        month
                    );

                    const data =
                        response.data as AttendanceResponse;

                    monthAttendance = data.attendance.map(
                        (record) => ({
                            ...record,
                            date: record.date.slice(0, 10)
                        })
                    );

                    attendanceCache.current[cacheKey] =
                        monthAttendance;
                }

                if (
                    !cancelled &&
                    requestId === attendanceRequestId.current
                ) {
                    setAttendance(monthAttendance);
                }
            } catch (error) {
                console.error(
                    "Failed to fetch monthly attendance:",
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

    // Fetch holidays once for each year
    useEffect(() => {
        let cancelled = false;

        const fetchHolidays = async () => {
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

        void fetchHolidays();

        return () => {
            cancelled = true;
        };
    }, [currentMonth.year]);

    // Called whenever the calendar's displayed month changes
    const handleMonthChange = (
        year: number,
        month: number
    ) => {
        setCurrentMonth({ year, month });
    };

    // Fetch student details only if navigation state wasn't provided
    useEffect(() => {
        if (student) return;

        // Student details are normally passed through navigation state.
        // If the page is opened directly or refreshed, they can be
        // recovered from the existing attendance endpoint.
        let cancelled = false;

        const fetchStudent = async () => {
            try {
                const response = await import(
                    "../../services/studentApi"
                ).then(({ getAttendance }) =>
                    getAttendance(1, 1)
                );

                if (!cancelled) {
                    setStudent(response.data.student);
                }
            } catch (error) {
                console.error(
                    "Failed to fetch student details:",
                    error
                );
            }
        };

        void fetchStudent();

        return () => {
            cancelled = true;
        };
    }, [student]);

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

export default AttendanceCalendarPage;
