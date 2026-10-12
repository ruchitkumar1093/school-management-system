import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import Breadcrumb from "../../components/breadcrumb";
import AttendanceCalendar from "../../components/attendanceCalendar";

import {
    getStudentAttendanceDetails,
    getStudentMonthlyAttendance,
    getHolidays
} from "../../services/principalApi";

type AttendanceDay = {
    date: string;
    status: "Present" | "Absent" | "Leave";
};

type Holiday = {
    id: string;
    date: string;
    name: string;
};

type StudentInfo = {
    _id?: string;
    name?: string;
    uid?: string;
    class?: string;
    rollNumber?: string | number;
    userId?: {
        name?: string;
        uid?: string;
    };
};

type AttendanceResponse = {
    attendance: AttendanceDay[];
};

type HolidayResponse = {
    _id?: string;
    id?: string;
    date: string;
    name: string;
};

function PrincipalAttendanceCalendarPage() {
    const navigate = useNavigate();
    const { studentId } = useParams<{ studentId: string }>();

    const [attendance, setAttendance] = useState<AttendanceDay[]>([]);
    const [holidays, setHolidays] = useState<Holiday[]>([]);

    const [studentName, setStudentName] = useState("");
    const [studentUid, setStudentUid] = useState("");
    const [studentClass, setStudentClass] = useState("");
    const [rollNumber, setRollNumber] = useState("");

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

    const attendanceCache = useRef<Record<string, AttendanceDay[]>>({});
    const holidaysCache = useRef<Record<number, Holiday[]>>({});
    const attendanceRequestId = useRef(0);

    // Fetch student details once when the selected student changes.
    useEffect(() => {
        if (!studentId) {
            setError(
                "Student was not selected. Open the calendar from the attendance table."
            );
            setStudentLoading(false);
            setLoading(false);
            setHolidayLoading(false);
            return;
        }

        let cancelled = false;

        const fetchStudentDetails = async () => {
            setStudentLoading(true);

            try {
                const response = await getStudentAttendanceDetails(studentId);

                if (cancelled) return;

                const student: StudentInfo | undefined = response.data.student;

                if (!student) {
                    setError("Student details could not be found.");
                    return;
                }

                setStudentName(
                    student.name ?? student.userId?.name ?? ""
                );

                setStudentUid(
                    student.uid ?? student.userId?.uid ?? ""
                );

                setStudentClass(student.class ?? "");

                setRollNumber(
                    student.rollNumber == null
                        ? ""
                        : String(student.rollNumber)
                );
            } catch (error: any) {
                if (!cancelled) {
                    setError(
                        error.response?.data?.message ??
                        "Failed to fetch student details."
                    );
                }
            } finally {
                if (!cancelled) {
                    setStudentLoading(false);
                }
            }
        };

        void fetchStudentDetails();

        return () => {
            cancelled = true;
        };
    }, [studentId]);

    // Fetch attendance only for the selected month.
    useEffect(() => {
        if (!studentId) return;

        let cancelled = false;
        const requestId = ++attendanceRequestId.current;

        const fetchMonthlyAttendance = async () => {
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

                    const data = response.data as AttendanceResponse;

                    records = (data.attendance ?? []).map((record) => ({
                        date: record.date.slice(0, 10),
                        status: record.status
                    }));

                    attendanceCache.current[cacheKey] = records;
                }

                if (
                    !cancelled &&
                    requestId === attendanceRequestId.current
                ) {
                    setAttendance(records);
                }
            } catch (error: any) {
                if (
                    !cancelled &&
                    requestId === attendanceRequestId.current
                ) {
                    setError(
                        error.response?.data?.message ??
                        "Unable to load this student's attendance."
                    );

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

        void fetchMonthlyAttendance();

        return () => {
            cancelled = true;
        };
    }, [studentId, currentMonth]);

    // Fetch holidays once per year and reuse cached results.
    useEffect(() => {
        let cancelled = false;

        const fetchYearHolidays = async () => {
            setHolidayLoading(true);

            try {
                const { year } = currentMonth;
                let yearHolidays = holidaysCache.current[year];

                if (!yearHolidays) {
                    const response = await getHolidays(year);

                    const holidayData: HolidayResponse[] =
                        Array.isArray(response.data)
                            ? response.data
                            : response.data.holidays ?? [];

                    yearHolidays = holidayData.map((holiday) => ({
                        id: holiday._id ?? holiday.id ?? holiday.date,
                        date: holiday.date.slice(0, 10),
                        name: holiday.name
                    }));

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

    const handleMonthChange = (year: number, month: number) => {
        setCurrentMonth({ year, month });
    };

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
                                <h1 className="text-3xl font-medium text-gray-900">
                                    Student Attendance Calendar
                                </h1>

                                <p className="mt-1 text-sm text-gray-600">
                                    View attendance history by date.
                                </p>
                            </div>
                        </div>

                        {(studentName || studentUid || studentClass || rollNumber) && (
                            <div className="mb-6 flex flex-wrap gap-x-8 gap-y-3">
                                {studentName && (
                                    <div>
                                        Name:{" "}
                                        <span className="font-medium">
                                            {studentName}
                                        </span>
                                    </div>
                                )}

                                {studentUid && (
                                    <div>
                                        UID:{" "}
                                        <span className="font-medium">
                                            {studentUid.toUpperCase()}
                                        </span>
                                    </div>
                                )}

                                {studentClass && (
                                    <div>
                                        Class:{" "}
                                        <span className="font-medium">
                                            {studentClass}
                                        </span>
                                    </div>
                                )}

                                {rollNumber && (
                                    <div>
                                        Roll Number:{" "}
                                        <span className="font-medium">
                                            {rollNumber}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {(studentLoading || loading || holidayLoading) && (
                            <p className="mb-3 text-gray-600">
                                Loading calendar...
                            </p>
                        )}

                        {error ? (
                            <p className="rounded-lg bg-white p-5 text-center text-red-600">
                                {error}
                            </p>
                        ) : (
                            <AttendanceCalendar
                                attendance={attendance}
                                holidays={holidays}
                                currentMonth={
                                    new Date(
                                        currentMonth.year,
                                        currentMonth.month - 1,
                                        1
                                    )
                                }
                                onMonthChange={handleMonthChange}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PrincipalAttendanceCalendarPage;