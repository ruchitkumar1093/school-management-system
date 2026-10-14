import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import SearchBar from "../../components/searchBar";
import Pagination from "../../components/pagination";
import Limit from "../../components/limit";
import Breadcrumb from "../../components/breadcrumb";
import Modal from "../../components/modal";
import ClassFilter from "../../components/classFilter";
import PrincipalTeacherAttendanceTable from "../../components/principalComponents/teacherAttendanceTable";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import {
    getTeachersForAttendance,
    createTeacherAttendance
} from "../../services/principalApi";

type Teacher = {
    _id: string;
    employeeID: string;
    name: string;
    department: string;
    onLeave: boolean;
    attendanceStatus: "Present" | "Absent" | null;
};

type Attendance = {
    [teacherId: string]: "Present" | "Absent";
};

type Holiday = {
    id: string;
    date: string;
    name: string;
};

type AttendanceResponse = {
    teachers: Teacher[];
    attendanceMarked: boolean;
    isHoliday: boolean;
    holidayName: string | null;
    totalTeachers: number;
    totalPages: number;
    currentPage: number;
    limit: number;
};

function MarkTeacherAttendance() {
    const navigate = useNavigate();

    const [classFilter, setClassFilter] = useState("1st");
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [teachersData, setTeachersData] = useState<Teacher[]>([]);
    const [attendance, setAttendance] = useState<Attendance>({});

    const [markAllStatus, setMarkAllStatus] =
        useState<"Present" | "Absent" | null>(null);

    const [attendanceMarked, setAttendanceMarked] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [totalTeachers, setTotalTeachers] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const [date, setDate] = useState(
        new Date().toISOString().split("T")[0]
    );

    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [holidaysYear, setHolidaysYear] = useState<number | null>(null);

    const [modalOpen, setModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [modalMessage, setModalMessage] = useState("");
    const [modalConfirm, setModalConfirm] =
        useState<(() => void) | undefined>();


    const attendanceStorageKey =
        `principal-teacher-attendance-${classFilter}-${date}`;

    const markAllStorageKey =
        `principal-teacher-attendance-all-${classFilter}-${date}`;


    const selectedDate = new Date(`${date}T00:00:00`);

    const formatDate = (selectedDate: Date) => {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
        const day = String(selectedDate.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    const isSunday = (selectedDate: Date) =>
        selectedDate.getDay() === 0;

    const showModal = (
        title: string,
        message: string,
        confirm?: () => void
    ) => {
        setModalTitle(title);
        setModalMessage(message);
        setModalConfirm(confirm ? () => confirm : undefined);
        setModalOpen(true);
    };

    const getErrorMessage = (
        error: unknown,
        fallback: string
    ) => {
        const apiError = error as {
            response?: {
                data?: {
                    message?: string;
                };
            };
            message?: string;
        };

        return (
            apiError.response?.data?.message ??
            apiError.message ??
            fallback
        );
    };

    const isHoliday = (selectedDate: Date) => {
        const formattedDate = formatDate(selectedDate);

        return holidays.some(
            holiday => holiday.date === formattedDate
        );
    };

    const getHoliday = (selectedDate: Date) => {
        const formattedDate = formatDate(selectedDate);

        return holidays.find(
            holiday => holiday.date === formattedDate
        );
    };

    const isSelectableDate = (selectedDate: Date) =>
        !isSunday(selectedDate) && !isHoliday(selectedDate);

    /*
     * Fetch holidays once per year, just like the teacher
     * attendance page. The existing principal endpoint is reused.
     */
    useEffect(() => {
        const year = Number(date.split("-")[0]);

        if (holidaysYear === year) {
            return;
        }

        let cancelled = false;

        const fetchYearHolidays = async () => {
            try {
                const response = await import("../../services/principalApi")
                    .then(module => module.getHolidays(year));

                if (cancelled) return;

                const formattedHolidays: Holiday[] =
                    response.data.map(
                        (holiday: {
                            _id?: string;
                            id?: string;
                            date: string;
                            name: string;
                        }) => ({
                            id: holiday._id ?? holiday.id ?? "",
                            date: holiday.date.split("T")[0],
                            name: holiday.name
                        })
                    );

                setHolidays(formattedHolidays);
                setHolidaysYear(year);
            } catch (error) {
                console.error("Failed to fetch holidays:", error);
            }
        };

        void fetchYearHolidays();

        return () => {
            cancelled = true;
        };
    }, [date, holidaysYear]);

    /*
     * Debounce search input.
     */
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);

        return () => clearTimeout(timer);
    }, [search]);

    /*
     * Reset pagination when the search, limit, or date changes.
     */
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch, limit, date]);

    /*
     * Restore unsaved selections for the selected date.
     */
    useEffect(() => {
        try {
            const savedAttendance =
                localStorage.getItem(attendanceStorageKey);

            const savedMarkAll =
                localStorage.getItem(markAllStorageKey);

            setAttendance(
                savedAttendance
                    ? JSON.parse(savedAttendance)
                    : {}
            );

            setMarkAllStatus(
                savedMarkAll === "Present" ||
                    savedMarkAll === "Absent"
                    ? savedMarkAll
                    : null
            );
        } catch {
            setAttendance({});
            setMarkAllStatus(null);
        }
    }, [date]);

    /*
     * Persist unsaved attendance separately for each date.
     */
    useEffect(() => {
        localStorage.setItem(
            attendanceStorageKey,
            JSON.stringify(attendance)
        );
    }, [attendance, attendanceStorageKey]);

    useEffect(() => {
        if (markAllStatus) {
            localStorage.setItem(
                markAllStorageKey,
                markAllStatus
            );
        } else {
            localStorage.removeItem(markAllStorageKey);
        }
    }, [markAllStatus, markAllStorageKey]);

    /*
     * Server-side search and pagination.
     * Only the requested page is fetched during normal page loading.
     */
    useEffect(() => {
        let cancelled = false;

        const fetchTeachers = async () => {
            setLoading(true);

            try {
                const response: AttendanceResponse =
                    await getTeachersForAttendance({
                        date,
                        search: debouncedSearch,
                        page: currentPage,
                        limit,
                        classFilter
                    });

                if (cancelled) return;

                if (response.isHoliday) {
                    setTeachersData([]);
                    setTotalTeachers(0);
                    setTotalPages(1);
                    setAttendanceMarked(false);

                    showModal(
                        "Holiday",
                        `Attendance cannot be marked because ${response.holidayName ?? "this date"
                        } is a holiday.`
                    );

                    return;
                }

                setTeachersData(response.teachers);
                setTotalTeachers(response.totalTeachers);
                setTotalPages(Math.max(1, response.totalPages));
                setAttendanceMarked(response.attendanceMarked);
            } catch (error) {
                if (cancelled) return;

                setTeachersData([]);
                setTotalTeachers(0);
                setTotalPages(1);

                showModal(
                    "Error",
                    getErrorMessage(
                        error,
                        "Failed to fetch teacher attendance."
                    )
                );
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void fetchTeachers();

        return () => {
            cancelled = true;
        };
    }, [date, debouncedSearch, currentPage, limit, classFilter]);


    const fetchAllTeachersForDate = async (
        selectedDateString: string
    ): Promise<Teacher[]> => {
        const firstResponse: AttendanceResponse =
            await getTeachersForAttendance({
                date: selectedDateString,
                page: 1,
                limit: 100,
                classFilter
            });

        if (firstResponse.isHoliday) {
            throw new Error(
                `Attendance cannot be marked because ${firstResponse.holidayName ?? "this date"
                } is a holiday.`
            );
        }

        const allTeachers = [...firstResponse.teachers];

        for (
            let page = 2;
            page <= firstResponse.totalPages;
            page++
        ) {
            const response: AttendanceResponse =
                await getTeachersForAttendance({
                    date: selectedDateString,
                    page,
                    limit: 100,
                    classFilter
                });

            if (response.isHoliday) {
                throw new Error(
                    `Attendance cannot be marked because ${response.holidayName ?? "this date"
                    } is a holiday.`
                );
            }

            allTeachers.push(...response.teachers);
        }

        return allTeachers;
    };



    const getStatus = (
        teacher: Teacher
    ): "Present" | "Absent" | null => {
        if (teacher.onLeave) {
            return null;
        }

        return (
            teacher.attendanceStatus ??
            attendance[teacher._id] ??
            markAllStatus
        );
    };


    const isAlreadyRecorded = (teacher: Teacher) =>
        teacher.onLeave || teacher.attendanceStatus !== null;

    const markedCount = markAllStatus
        ? totalTeachers
        : Object.keys(attendance).length;

    const startIndex = (currentPage - 1) * limit;

    const handleMarkAll = async (
        status: "Present" | "Absent"
    ) => {
        if (
            attendanceMarked ||
            loading ||
            submitting ||
            totalTeachers === 0
        ) {
            return;
        }

        const applyMarkAll = async () => {
            setSubmitting(true);

            try {
                const allTeachers =
                    await fetchAllTeachersForDate(date);

                setAttendance(previous => {
                    const updated = { ...previous };

                    allTeachers.forEach(teacher => {
                        if (isAlreadyRecorded(teacher)) {
                            return;
                        }

                        updated[teacher._id] = status;
                    });

                    return updated;
                });

                setMarkAllStatus(status);
                setModalOpen(false);
                setModalConfirm(undefined);
            } catch (error) {
                showModal(
                    "Error",
                    getErrorMessage(
                        error,
                        "Failed to mark all teachers."
                    )
                );
            } finally {
                setSubmitting(false);
            }
        };

        if (status === "Absent") {
            showModal(
                "Confirm Action",
                "Are you sure you want to mark all eligible teachers as absent?",
                () => {
                    void applyMarkAll();
                }
            );

            return;
        }

        await applyMarkAll();
    };

    /*
     * Submit a complete roster, not just the visible page.
     */

    const handleSubmitAttendance = async () => {
        if (attendanceMarked || loading || submitting) {
            return;
        }

        if (isSunday(selectedDate)) {
            showModal(
                "Invalid Date",
                "Teacher attendance cannot be marked on Sunday."
            );
            return;
        }

        const holiday = getHoliday(selectedDate);

        if (holiday) {
            showModal(
                "Holiday",
                `Attendance cannot be marked because ${holiday.name} is a holiday.`
            );
            return;
        }

        setSubmitting(true);

        try {
            // Submit only the attendance selections currently held
            // in state. The backend validates the complete roster.
            const finalAttendance = Object.entries(attendance).map(
                ([teacherId, status]) => ({
                    teacherId,
                    status
                })
            );

            const response = await createTeacherAttendance({
                date,
                classFilter,
                attendance: finalAttendance
            });

            // Clear temporary selections only after successful submission.
            localStorage.removeItem(attendanceStorageKey);
            localStorage.removeItem(markAllStorageKey);

            setAttendance({});
            setMarkAllStatus(null);
            setAttendanceMarked(true);

            showModal(
                "Success",
                response.message ??
                "Teacher attendance submitted successfully."
            );

            // Refresh only the currently selected page.
            const refreshed: AttendanceResponse =
                await getTeachersForAttendance({
                    date,
                    search: debouncedSearch,
                    page: currentPage,
                    limit,
                    classFilter
                });

            setTeachersData(refreshed.teachers);
            setTotalTeachers(refreshed.totalTeachers);
            setTotalPages(Math.max(1, refreshed.totalPages));
            setAttendanceMarked(refreshed.attendanceMarked);
        } catch (error) {
            showModal(
                "Error",
                getErrorMessage(
                    error,
                    "Failed to submit teacher attendance."
                )
            );
        } finally {
            setSubmitting(false);
        }
    };


    const handleReset = () => {
        if (attendanceMarked) {
            showModal(
                "Attendance Already Submitted",
                "Attendance has already been submitted for this date and cannot be reset from this page."
            );

            return;
        }

        showModal(
            "Confirm Action",
            "Are you sure you want to reset all attendance selections for this date?",
            () => {
                localStorage.removeItem(attendanceStorageKey);
                localStorage.removeItem(markAllStorageKey);

                setAttendance({});
                setMarkAllStatus(null);

                setModalOpen(false);
                setModalConfirm(undefined);
            }
        );
    };

    const handleDateChange = (selectedDate: Date | null) => {
        if (!selectedDate) return;

        if (isSunday(selectedDate)) {
            showModal(
                "Invalid Date",
                "Teacher attendance cannot be marked on Sunday."
            );
            return;
        }

        const holiday = getHoliday(selectedDate);

        if (holiday) {
            showModal(
                "Holiday",
                `Attendance cannot be marked because ${holiday.name} is a holiday.`
            );
            return;
        }

        setDate(formatDate(selectedDate));
        setCurrentPage(1);
    };

    const maxDate = new Date();

    return (
        <div className="flex flex-col min-h-screen font-fredoka">
            <NavBar />

            <div className="flex flex-1 bg-purple-100">
                <SideBar />

                <div>
                    <Breadcrumb />

                    <div className="flex flex-col pt-12 pl-20 mb-10">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h1 className="text-3xl font-medium text-gray-900">
                                    Teacher Attendance
                                </h1>

                                <p className="mt-1 text-sm text-gray-600">
                                    Mark and manage teachers' daily attendance
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    navigate("viewTeacherAttendance")
                                }
                                className="flex items-center gap-2 rounded-lg bg-purple-300 px-6 py-3 font-medium text-purple-950 shadow-[0_2px_3px] transition-colors hover:bg-violet-300 cursor-pointer"
                            >
                                View Attendance
                            </button>
                        </div>

                        <div className="flex justify-between items-center mb-5">
                            <div className="flex items-center gap-4">
                                <label
                                    htmlFor="teacher-attendance-date"
                                    className="text-lg"
                                >
                                    Date:
                                </label>

                                <DatePicker
                                    id="teacher-attendance-date"
                                    selected={selectedDate}
                                    onChange={handleDateChange}
                                    filterDate={isSelectableDate}
                                    maxDate={maxDate}
                                    dateFormat="yyyy-MM-dd"
                                    showPopperArrow={false}
                                    className="border-2 border-gray-500 rounded-sm p-2 focus:outline-none focus:border-gray-900 transition-colors duration-300 ease-in-out"
                                    placeholderText="Select date"
                                />
                            </div>

                            <SearchBar
                                search={search}
                                setSearch={setSearch}
                            />
                        </div>

                        <div className="flex justify-between items-start mb-5">
                            <div className="flex gap-5">
                                <div>
                                    <div className="text-lg">
                                        Total Teachers:{" "}
                                        <span className="font-medium">
                                            {totalTeachers}
                                        </span>
                                    </div>

                                    <div className="text-lg">
                                        Marked:{" "}
                                        <span className="font-medium">
                                            {markedCount}/{totalTeachers}
                                        </span>
                                    </div>
                                </div>

                                <ClassFilter
                                    classFilter={classFilter}
                                    setClassFilter={setClassFilter}
                                />
                            </div>


                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() =>
                                        void handleMarkAll("Present")
                                    }
                                    disabled={
                                        loading ||
                                        submitting ||
                                        attendanceMarked ||
                                        teachersData.length === 0
                                    }
                                    className="rounded-lg bg-purple-300 px-6 py-3 font-medium text-purple-950 shadow-[0_2px_3px] transition-colors hover:bg-violet-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Mark all present
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        void handleMarkAll("Absent")
                                    }
                                    disabled={
                                        loading ||
                                        submitting ||
                                        attendanceMarked ||
                                        teachersData.length === 0
                                    }
                                    className="rounded-lg bg-gray-200 px-6 py-3 font-medium text-purple-950 shadow-[0_2px_3px] transition-colors hover:bg-red-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Mark all absent
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="py-10 text-center text-gray-600">
                                Loading teacher attendance...
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-10">
                                <PrincipalTeacherAttendanceTable
                                    teachers={teachersData}
                                    attendance={attendance}
                                    setAttendance={setAttendance}
                                    markAllStatus={markAllStatus}
                                    startIndex={startIndex}
                                />
                            </div>
                        )}

                        <div className="flex justify-between mt-5 mb-5 items-center">
                            <div className="mt-1">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    setCurrentPage={setCurrentPage}
                                />
                            </div>

                            <Limit
                                setLimit={setLimit}
                                limit={limit}
                            />
                        </div>

                        <div className="flex justify-center gap-10 pt-3">
                            <button
                                type="button"
                                onClick={handleSubmitAttendance}
                                disabled={
                                    loading ||
                                    submitting ||
                                    attendanceMarked ||
                                    teachersData.length === 0
                                }
                                className="rounded-lg bg-purple-300 px-6 py-3 font-medium text-purple-950 shadow-[0_2px_3px] transition-colors hover:bg-violet-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting
                                    ? "Submitting..."
                                    : "Submit Attendance"}
                            </button>

                            <button
                                type="button"
                                onClick={handleReset}
                                disabled={
                                    loading ||
                                    submitting ||
                                    attendanceMarked
                                }
                                className="rounded-lg bg-purple-300 px-6 py-3 font-medium text-purple-950 shadow-[0_2px_3px] transition-colors hover:bg-violet-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={modalOpen}
                title={modalTitle}
                message={modalMessage}
                onClose={() => {
                    setModalOpen(false);
                    setModalConfirm(undefined);
                }}
                onConfirm={modalConfirm}
            />
        </div>
    );
}

export default MarkTeacherAttendance;
