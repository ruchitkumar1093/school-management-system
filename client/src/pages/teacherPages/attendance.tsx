import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import SearchBar from "../../components/searchBar";
import Pagination from "../../components/pagination";
import Limit from "../../components/limit";
import { useNavigate } from "react-router-dom";
import {
    getStudentsForAttendance,
    createAttendance,
    getHolidays,
    getTeacherSubjects
} from "../../services/teacherApi";
import TeacherAttendanceTable from "../../components/attendanceTable";
import { useState, useEffect, useMemo } from "react";
import Breadcrumb from "../../components/breadcrumb";
import Modal from "../../components/modal";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

type Student = {
    _id: string;
    userId: {
        name: string;
        uid: string;
    };
    onLeave: boolean;
    attendanceStatus: "Present" | "Absent" | null;
};

type Attendance = {
    [studentId: string]: "Present" | "Absent";
};

type Holiday = {
    id: string;
    date: string;
    name: string;
};

type TeacherSubject = {
    _id: string;
    name: string;
    subjectCode: string;
    class: string;
};

function TeacherAttendance() {
    const navigate = useNavigate();

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [attendanceMarked, setAttendanceMarked] = useState(false);

    const [studentsData, setStudentsData] = useState<Student[]>([]);
    const [className, setClassName] = useState("");
    const [totalStudents, setTotalStudents] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const [date, setDate] = useState(
        new Date().toISOString().split("T")[0]
    );

    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [holidaysYear, setHolidaysYear] = useState<number | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const [teacherSubjects, setTeacherSubjects] = useState<TeacherSubject[]>([]);
    const [classesLoading, setClassesLoading] = useState(true);
    const [classFilter, setClassFilter] = useState("");

    const teacherClasses = useMemo(
        () =>
            [
                ...new Set(
                    teacherSubjects.map(subject => subject.class)
                )
            ].sort(
                (a, b) =>
                    Number.parseInt(a, 10) -
                    Number.parseInt(b, 10)
            ),
        [teacherSubjects]
    );

    // Drafts are stored separately for each selected class and date.
    const attendanceStorageKey =
        `attendance-${classFilter}-${date}`;

    const markAllStorageKey =
        `attendance-all-${classFilter}-${date}`;

    const [attendance, setAttendance] = useState<Attendance>({});
    const [markAllStatus, setMarkAllStatus] =
        useState<"Present" | "Absent" | null>(null);

    const [modalOpen, setModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [modalMessage, setModalMessage] = useState("");
    const [modalConfirm, setModalConfirm] =
        useState<(() => void) | undefined>();

    const [isClassTeacher, setIsClassTeacher] = useState(false);
    const [loadingTeacherStatus, setLoadingTeacherStatus] = useState(true);

    const attendanceControlsDisabled =
        attendanceMarked ||
        !isClassTeacher ||
        loadingTeacherStatus ||
        classesLoading ||
        !classFilter;

    const attendanceControlsForSelectedClass =
        !attendanceControlsDisabled;

    // Load classes from the teacher's assignments.
    useEffect(() => {
        const fetchAssignedClasses = async () => {
            try {
                const response = await getTeacherSubjects();

                const subjects: TeacherSubject[] =
                    response.data.subjects ?? [];

                setTeacherSubjects(subjects);

                const assignedClasses = [
                    ...new Set(
                        subjects.map(subject => subject.class)
                    )
                ].sort(
                    (a, b) =>
                        Number.parseInt(a, 10) -
                        Number.parseInt(b, 10)
                );

                setClassFilter(current =>
                    assignedClasses.includes(current)
                        ? current
                        : assignedClasses[0] ?? ""
                );
            } catch (error) {
                console.error(
                    "Failed to fetch assigned classes:",
                    error
                );

                setTeacherSubjects([]);
                setClassFilter("");
            } finally {
                setClassesLoading(false);
            }
        };

        void fetchAssignedClasses();
    }, []);

    // Load holidays for the selected year.
    useEffect(() => {
        const year = Number(date.split("-")[0]);

        if (holidaysYear === year) {
            return;
        }

        const fetchYearHolidays = async () => {
            try {
                const response = await getHolidays(year);

                const formattedHolidays: Holiday[] =
                    response.data.map(
                        (holiday: {
                            _id: string;
                            date: string;
                            name: string;
                        }) => ({
                            id: holiday._id,
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
    }, [date, holidaysYear]);

    // Debounce student search.
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);

        return () => clearTimeout(timer);
    }, [search]);

    // Restore the draft belonging to the current class and date.
    useEffect(() => {
        if (!classFilter) {
            setAttendance({});
            setMarkAllStatus(null);
            return;
        }

        const savedAttendance =
            localStorage.getItem(attendanceStorageKey);

        const savedMarkAll =
            localStorage.getItem(markAllStorageKey);

        try {
            setAttendance(
                savedAttendance
                    ? JSON.parse(savedAttendance) as Attendance
                    : {}
            );
        } catch {
            setAttendance({});
        }

        setMarkAllStatus(
            savedMarkAll === "Present" ||
            savedMarkAll === "Absent"
                ? savedMarkAll
                : null
        );
    }, [attendanceStorageKey, markAllStorageKey, classFilter]);

    // Save the draft for the current class and date.
    useEffect(() => {
        if (!classFilter) {
            return;
        }

        localStorage.setItem(
            attendanceStorageKey,
            JSON.stringify(attendance)
        );
    }, [attendance, attendanceStorageKey, classFilter]);

    useEffect(() => {
        if (!classFilter) {
            return;
        }

        if (markAllStatus) {
            localStorage.setItem(
                markAllStorageKey,
                markAllStatus
            );
        } else {
            localStorage.removeItem(markAllStorageKey);
        }
    }, [markAllStatus, markAllStorageKey, classFilter]);

    // Reset pagination when the filters change.
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch, limit, date, classFilter]);

    // Fetch students and permissions for the selected class.
    useEffect(() => {
        if (classesLoading) {
            return;
        }

        if (!classFilter) {
            setStudentsData([]);
            setClassName("");
            setTotalStudents(0);
            setTotalPages(1);
            setAttendanceMarked(false);
            setIsClassTeacher(false);
            setLoadingTeacherStatus(false);
            return;
        }

        let cancelled = false;

        const fetchStudents = async () => {
            setLoadingTeacherStatus(true);

            try {
                const response = await getStudentsForAttendance(
                    date,
                    debouncedSearch,
                    currentPage,
                    limit,
                    classFilter
                );

                if (cancelled) {
                    return;
                }

                setStudentsData(response.data.students);
                setClassName(response.data.class);
                setTotalStudents(response.data.totalStudents);
                setTotalPages(response.data.totalPages);
                setAttendanceMarked(response.data.attendanceMarked);
                setIsClassTeacher(
                    response.data.isClassTeacher === true
                );
            } catch (error) {
                if (cancelled) {
                    return;
                }

                console.error("Failed to fetch students:", error);

                setStudentsData([]);
                setClassName("");
                setTotalStudents(0);
                setTotalPages(1);
                setAttendanceMarked(false);
                setIsClassTeacher(false);
            } finally {
                if (!cancelled) {
                    setLoadingTeacherStatus(false);
                }
            }
        };

        void fetchStudents();

        return () => {
            cancelled = true;
        };
    }, [
        date,
        debouncedSearch,
        currentPage,
        limit,
        classFilter,
        classesLoading
    ]);

    const isSunday = (selectedDate: Date) =>
        selectedDate.getDay() === 0;

    const formatDate = (selectedDate: Date) => {
        const year = selectedDate.getFullYear();
        const month = String(
            selectedDate.getMonth() + 1
        ).padStart(2, "0");
        const day = String(
            selectedDate.getDate()
        ).padStart(2, "0");

        return `${year}-${month}-${day}`;
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

    const showDateError = (
        title: string,
        message: string
    ) => {
        setModalTitle(title);
        setModalMessage(message);
        setModalConfirm(undefined);
        setModalOpen(true);
    };

    const validateSelectedDate = () => {
        if (isSunday(selectedDate)) {
            showDateError(
                "Invalid Date",
                "Attendance cannot be marked on Sunday."
            );

            return false;
        }

        const holiday = getHoliday(selectedDate);

        if (holiday) {
            showDateError(
                "Holiday",
                `Attendance cannot be marked because ${holiday.name} is a holiday.`
            );

            return false;
        }

        return true;
    };

    const handleDateChange = (selectedDate: Date | null) => {
        if (!selectedDate) {
            return;
        }

        if (isSunday(selectedDate)) {
            showDateError(
                "Invalid Date",
                "Attendance cannot be marked on Sunday."
            );

            return;
        }

        const holiday = getHoliday(selectedDate);

        if (holiday) {
            showDateError(
                "Holiday",
                `Attendance cannot be marked because ${holiday.name} is a holiday.`
            );

            return;
        }

        setDate(formatDate(selectedDate));
        setCurrentPage(1);
    };

    const selectedDate = new Date(`${date}T00:00:00`);
    const maxDate = new Date();

    const handleSubmitAttendance = async () => {
        if (!classFilter) {
            showDateError(
                "Select Class",
                "Please select an assigned class first."
            );

            return;
        }

        if (!isClassTeacher) {
            showDateError(
                "Permission Denied",
                "Only the class teacher can submit attendance for this class."
            );

            return;
        }

        if (!validateSelectedDate()) {
            return;
        }

        try {
            const attendanceData = {
                date,
                class: classFilter,
                markAll: markAllStatus,
                attendance: Object.entries(attendance).map(
                    ([studentId, status]) => ({
                        studentId,
                        status
                    })
                )
            };

            await createAttendance(attendanceData);

            localStorage.removeItem(attendanceStorageKey);
            localStorage.removeItem(markAllStorageKey);

            setAttendance({});
            setMarkAllStatus(null);
            setAttendanceMarked(true);

            setModalTitle("Success");
            setModalMessage(
                "Attendance submitted successfully."
            );
            setModalConfirm(undefined);
            setModalOpen(true);
        } catch (error: any) {
            console.error(error);

            showDateError(
                "Error",
                error.response?.data?.message ||
                    "Failed to submit attendance"
            );
        }
    };

    const handleReset = () => {
        setModalTitle("Confirm Action");
        setModalMessage(
            `Are you sure you want to reset attendance for ${classFilter}, dated ${date}?`
        );

        setModalConfirm(() => () => {
            localStorage.removeItem(attendanceStorageKey);
            localStorage.removeItem(markAllStorageKey);

            setAttendance({});
            setMarkAllStatus(null);

            setModalConfirm(undefined);
            setModalOpen(false);
        });

        setModalOpen(true);
    };

    const markedCount = markAllStatus
        ? totalStudents
        : Object.keys(attendance).length;

    const handleMarkAllPresent = () => {
        if (!validateSelectedDate()) {
            return;
        }

        setMarkAllStatus("Present");
    };

    const handleMarkAllAbsent = () => {
        if (!validateSelectedDate()) {
            return;
        }

        setModalTitle("Confirm Action");
        setModalMessage(
            "Are you sure you want to mark all students as absent?"
        );

        setModalConfirm(() => () => {
            setMarkAllStatus("Absent");
            setModalConfirm(undefined);
            setModalOpen(false);
        });

        setModalOpen(true);
    };

    const startIndex = (currentPage - 1) * limit;

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
                                    Mark Attendance
                                </h1>

                                <p className="mt-1 text-sm text-gray-600">
                                    View and Manage Attendance
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => navigate("viewAttendance")}
                                className="rounded-lg bg-purple-300 px-6 py-3 font-medium text-purple-950 shadow-[0_2px_3px] transition-colors hover:bg-violet-300 cursor-pointer"
                            >
                                View Attendance
                            </button>
                        </div>

                        <div className="flex justify-between items-center mb-5">
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center gap-3">
                                    <label
                                        htmlFor="attendanceClass"
                                        className="text-lg"
                                    >
                                        Class:
                                    </label>

                                    <select
                                        id="attendanceClass"
                                        value={classFilter}
                                        onChange={event =>
                                            setClassFilter(event.target.value)
                                        }
                                        disabled={
                                            classesLoading ||
                                            teacherClasses.length === 0
                                        }
                                        className="rounded-md border-2 border-purple-400 bg-purple-200 p-2 text-purple-950 focus:outline-none focus:border-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {classesLoading ? (
                                            <option value="">
                                                Loading classes...
                                            </option>
                                        ) : teacherClasses.length === 0 ? (
                                            <option value="">
                                                No assigned classes
                                            </option>
                                        ) : (
                                            teacherClasses.map(className => (
                                                <option
                                                    key={className}
                                                    value={className}
                                                >
                                                    {className}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                </div>

                                <div className="flex items-center gap-3">
                                    <label
                                        htmlFor="date"
                                        className="text-lg"
                                    >
                                        Date:
                                    </label>

                                    <DatePicker
                                        id="date"
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
                            </div>

                            <SearchBar
                                search={search}
                                setSearch={setSearch}
                            />
                        </div>

                        <div className="flex justify-between">
                            <div>
                                <div className="text-lg">
                                    Class:{" "}
                                    <span className="font-medium">
                                        {className || classFilter || "-"}
                                    </span>
                                </div>

                                {!attendanceMarked &&
                                    isClassTeacher &&
                                    !loadingTeacherStatus && (
                                        <div className="text-lg mb-5">
                                            Marked:{" "}
                                            <span className="font-medium">
                                                {markedCount}/{totalStudents}
                                            </span>
                                        </div>
                                    )}
                            </div>

                            <div className="flex gap-3 self-start mt-1 mb-5">
                                <button
                                    type="button"
                                    onClick={handleMarkAllPresent}
                                    disabled={
                                        !attendanceControlsForSelectedClass
                                    }
                                    className="ml-5 rounded-lg bg-purple-300 px-6 py-3 font-medium text-purple-950 shadow-[0_2px_3px] transition-colors hover:bg-violet-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Mark all present
                                </button>

                                <button
                                    type="button"
                                    onClick={handleMarkAllAbsent}
                                    disabled={
                                        !attendanceControlsForSelectedClass
                                    }
                                    className="rounded-lg bg-gray-200 px-6 py-3 font-medium text-purple-950 shadow-[0_2px_3px] transition-colors hover:bg-red-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Mark all absent
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-10">
                            <TeacherAttendanceTable
                                students={studentsData}
                                attendance={attendance}
                                setAttendance={setAttendance}
                                startIndex={startIndex}
                                markAllStatus={markAllStatus}
                                isClassTeacher={isClassTeacher}
                                attendanceMarked={attendanceMarked}
                            />
                        </div>

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
                                disabled={attendanceControlsDisabled}
                                className="rounded-lg bg-purple-300 px-6 py-3 font-medium text-purple-950 shadow-[0_2px_3px] transition-colors hover:bg-violet-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Submit Attendance
                            </button>

                            <button
                                type="button"
                                onClick={handleReset}
                                disabled={attendanceControlsDisabled}
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

export default TeacherAttendance;