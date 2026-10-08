import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import SearchBar from "../../components/searchBar";
import Pagination from "../../components/pagination";
import Limit from "../../components/limit";
import { useNavigate } from "react-router-dom";
import {
    getStudentsForAttendance,
    createAttendance,
    getHolidays
} from "../../services/teacherApi";
import TeacherAttendanceTable from "../../components/attendanceTable";
import { useState, useEffect } from "react";
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
};

type Attendance = {
    [studentId: string]: "Present" | "Absent";
};

type Holiday = {
    id: string;
    date: string;
    name: string;
};

function TeacherAttendance() {
    const navigate = useNavigate();

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] =
        useState("");

    const [studentsData, setStudentsData] =
        useState<Student[]>([]);

    const [className, setClassName] =
        useState("");

    const [totalStudents, setTotalStudents] =
        useState(0);

    const [totalPages, setTotalPages] =
        useState(1);

    const [date, setDate] = useState(
        new Date().toISOString().split("T")[0]
    );

    const [holidays, setHolidays] =
        useState<Holiday[]>([]);

    const [currentPage, setCurrentPage] =
        useState(1);

    const [limit, setLimit] = useState(10);

    /*
     * Stores only individual attendance decisions.
     *
     * Example:
     *
     * {
     *     "studentId1": "Absent",
     *     "studentId2": "Present"
     * }
     */
    const [attendance, setAttendance] =
        useState<Attendance>(() => {
            const savedAttendance =
                localStorage.getItem(
                    `attendance-${date}`
                );

            return savedAttendance
                ? JSON.parse(savedAttendance)
                : {};
        });

    /*
     * Global attendance action.
     *
     * null      = no "mark all" action
     * Present   = mark everyone present
     * Absent    = mark everyone absent
     */
    const [markAllStatus, setMarkAllStatus] =
        useState<"Present" | "Absent" | null>(
            () => {
                const savedStatus =
                    localStorage.getItem(
                        `attendance-all-${date}`
                    );

                return savedStatus === "Present" ||
                    savedStatus === "Absent"
                    ? savedStatus
                    : null;
            }
        );

    const [modalOpen, setModalOpen] =
        useState(false);

    const [modalTitle, setModalTitle] =
        useState("");

    const [modalMessage, setModalMessage] =
        useState("");

    const [modalConfirm, setModalConfirm] =
        useState<(() => void) | undefined>();

    const fetchHolidays = async () => {
        try {
            const response = await getHolidays();

            const formattedHolidays =
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
        }
        catch (error) {
            console.error(
                "Failed to fetch holidays:",
                error
            );

            setHolidays([]);
        }
    };

    const fetchStudents = async () => {
        try {
            const response =
                await getStudentsForAttendance(
                    date,
                    debouncedSearch,
                    currentPage,
                    limit
                );

            setStudentsData(
                response.data.students
            );

            setClassName(
                response.data.class
            );

            setTotalStudents(
                response.data.totalStudents
            );

            setTotalPages(
                response.data.totalPages
            );
        }
        catch (error) {
            console.log(error);

            setStudentsData([]);
            setClassName("");
            setTotalStudents(0);
            setTotalPages(1);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);

        return () => {
            clearTimeout(timer);
        };
    }, [search]);

    useEffect(() => {
        fetchHolidays();
    }, []);

    useEffect(() => {
        fetchStudents();
    }, [
        date,
        debouncedSearch,
        currentPage,
        limit
    ]);

    useEffect(() => {
        setCurrentPage(1);
    }, [
        debouncedSearch,
        limit,
        date
    ]);

    /*
     * Load attendance whenever the date changes.
     */
    useEffect(() => {
        const savedAttendance =
            localStorage.getItem(
                `attendance-${date}`
            );

        const savedMarkAll =
            localStorage.getItem(
                `attendance-all-${date}`
            );

        if (savedAttendance) {
            setAttendance(
                JSON.parse(savedAttendance)
            );
        }
        else {
            setAttendance({});
        }

        if (
            savedMarkAll === "Present" ||
            savedMarkAll === "Absent"
        ) {
            setMarkAllStatus(
                savedMarkAll
            );
        }
        else {
            setMarkAllStatus(null);
        }
    }, [date]);

    /*
     * Save individual attendance decisions.
     */
    useEffect(() => {
        localStorage.setItem(
            `attendance-${date}`,
            JSON.stringify(attendance)
        );
    }, [attendance, date]);

    /*
     * Save the global "mark all" state.
     */
    useEffect(() => {
        if (markAllStatus) {
            localStorage.setItem(
                `attendance-all-${date}`,
                markAllStatus
            );
        }
        else {
            localStorage.removeItem(
                `attendance-all-${date}`
            );
        }
    }, [markAllStatus, date]);

    const isSunday = (
        selectedDate: Date
    ) => {
        return selectedDate.getDay() === 0;
    };

    const formatDate = (
        selectedDate: Date
    ) => {
        const year =
            selectedDate.getFullYear();

        const month =
            String(
                selectedDate.getMonth() + 1
            ).padStart(2, "0");

        const day =
            String(
                selectedDate.getDate()
            ).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    const isHoliday = (
        selectedDate: Date
    ) => {
        const formattedDate =
            formatDate(selectedDate);

        return holidays.some(
            (holiday) =>
                holiday.date === formattedDate
        );
    };

    const getHoliday = (
        selectedDate: Date
    ) => {
        const formattedDate =
            formatDate(selectedDate);

        return holidays.find(
            (holiday) =>
                holiday.date === formattedDate
        );
    };

    const isSelectableDate = (
        selectedDate: Date
    ) => {
        if (isSunday(selectedDate)) {
            return false;
        }

        if (isHoliday(selectedDate)) {
            return false;
        }

        return true;
    };

    const handleDateChange = (
        selectedDate: Date | null
    ) => {
        if (!selectedDate) {
            return;
        }

        if (isSunday(selectedDate)) {
            setModalTitle("Invalid Date");

            setModalMessage(
                "Attendance cannot be marked on Sunday."
            );

            setModalConfirm(undefined);
            setModalOpen(true);

            return;
        }

        const holiday =
            getHoliday(selectedDate);

        if (holiday) {
            setModalTitle("Holiday");

            setModalMessage(
                `Attendance cannot be marked because ${holiday.name} is a holiday.`
            );

            setModalConfirm(undefined);
            setModalOpen(true);

            return;
        }

        setDate(
            formatDate(selectedDate)
        );

        setCurrentPage(1);
    };

    const selectedDate =
        new Date(`${date}T00:00:00`);

    const handleSubmitAttendance =
        async () => {
            if (isSunday(selectedDate)) {
                setModalTitle("Invalid Date");

                setModalMessage(
                    "Attendance cannot be marked on Sunday."
                );

                setModalConfirm(undefined);
                setModalOpen(true);

                return;
            }

            const holiday =
                getHoliday(selectedDate);

            if (holiday) {
                setModalTitle("Holiday");

                setModalMessage(
                    `Attendance cannot be marked because ${holiday.name} is a holiday.`
                );

                setModalConfirm(undefined);
                setModalOpen(true);

                return;
            }

            /*
             * The backend now performs the complete
             * attendance validation.
             *
             * We only send:
             *
             * 1. date
             * 2. markAllStatus
             * 3. individual attendance changes
             */
            try {
                const attendanceData = {
                    date,
                    markAll: markAllStatus,
                    attendance:
                        Object.entries(
                            attendance
                        ).map(
                            ([
                                studentId,
                                status
                            ]) => ({
                                studentId,
                                status
                            })
                        )
                };

                await createAttendance(
                    attendanceData
                );

                localStorage.removeItem(
                    `attendance-${date}`
                );

                localStorage.removeItem(
                    `attendance-all-${date}`
                );

                setAttendance({});
                setMarkAllStatus(null);

                setModalTitle("Success");

                setModalMessage(
                    "Attendance submitted successfully."
                );

                setModalConfirm(undefined);
                setModalOpen(true);
            }
            catch (error: any) {
                console.log(error);

                setModalTitle("Error");

                setModalMessage(
                    error.response?.data?.message ||
                    "Failed to submit attendance"
                );

                setModalConfirm(undefined);
                setModalOpen(true);
            }
        };

    const handleReset = () => {
        setModalTitle("Confirm Action");

        setModalMessage(
            "Are you sure you want to reset all attendance data?"
        );

        setModalConfirm(() => () => {
            Object.keys(
                localStorage
            ).forEach((key) => {
                if (
                    key.startsWith(
                        "attendance-"
                    )
                ) {
                    localStorage.removeItem(
                        key
                    );
                }
            });

            setAttendance({});
            setMarkAllStatus(null);

            setModalConfirm(undefined);
            setModalOpen(false);
        });

        setModalOpen(true);
    };

    /*
     * If markAllStatus is set, all students who
     * are required to have attendance are already
     * considered marked.
     *
     * Otherwise count the individual attendance
     * decisions stored in the frontend.
     *
     * NOTE:
     * totalStudents currently includes students
     * on approved leave. See the backend note below
     * for making this count exact.
     */
    const markedCount =
        markAllStatus
            ? totalStudents
            : Object.keys(
                attendance
            ).length;

    const handleMarkAllPresent = () => {
        if (isSunday(selectedDate)) {
            setModalTitle("Invalid Date");

            setModalMessage(
                "Attendance cannot be marked on Sunday."
            );

            setModalConfirm(undefined);
            setModalOpen(true);

            return;
        }

        const holiday =
            getHoliday(selectedDate);

        if (holiday) {
            setModalTitle("Holiday");

            setModalMessage(
                `Attendance cannot be marked because ${holiday.name} is a holiday.`
            );

            setModalConfirm(undefined);
            setModalOpen(true);

            return;
        }

        /*
         * We no longer need allStudentIds.
         *
         * The backend knows all students in the
         * teacher's assigned class.
         */
        setMarkAllStatus("Present");
    };

    const handleMarkAllAbsent = () => {
        if (isSunday(selectedDate)) {
            setModalTitle("Invalid Date");

            setModalMessage(
                "Attendance cannot be marked on Sunday."
            );

            setModalConfirm(undefined);
            setModalOpen(true);

            return;
        }

        const holiday =
            getHoliday(selectedDate);

        if (holiday) {
            setModalTitle("Holiday");

            setModalMessage(
                `Attendance cannot be marked because ${holiday.name} is a holiday.`
            );

            setModalConfirm(undefined);
            setModalOpen(true);

            return;
        }

        setModalTitle("Confirm Action");

        setModalMessage(
            "Are you sure you want to mark all students as absent?"
        );

        setModalConfirm(() => () => {
            /*
             * Again, we don't modify hundreds of
             * student IDs in the frontend.
             *
             * We simply tell the backend that
             * everyone should be Absent.
             */
            setMarkAllStatus("Absent");

            setModalConfirm(undefined);
            setModalOpen(false);
        });

        setModalOpen(true);
    };

    const startIndex =
        (currentPage - 1) * limit;

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
                                    Attendance
                                </h1>

                                <p className="mt-1 text-sm text-gray-600">
                                    View and Manage Attendance
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        "viewAttendance"
                                    )
                                }
                                className="rounded-lg bg-purple-300 px-6 py-3 font-medium text-purple-950 shadow-[0_2px_3px] transition-colors hover:bg-violet-300 cursor-pointer"
                            >
                                View Attendance
                            </button>

                        </div>

                        <div className="flex justify-between items-center mb-5">

                            <div className="flex items-center gap-4">

                                <label
                                    htmlFor="date"
                                    className="text-lg"
                                >
                                    Date:
                                </label>

                                <DatePicker
                                    id="date"
                                    selected={
                                        selectedDate
                                    }
                                    onChange={
                                        handleDateChange
                                    }
                                    filterDate={
                                        isSelectableDate
                                    }
                                    maxDate={
                                        maxDate
                                    }
                                    dateFormat="yyyy-MM-dd"
                                    showPopperArrow={
                                        false
                                    }
                                    className="border-2 border-gray-500 rounded-sm p-2 focus:outline-none focus:border-gray-900 transition-colors duration-300 ease-in-out"
                                    placeholderText="Select date"
                                />

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
                                        {className || "-"}
                                    </span>
                                </div>

                                <div className="text-lg mb-5">
                                    Marked:{" "}

                                    <span className="font-medium">
                                        {markedCount}
                                        /
                                        {totalStudents}
                                    </span>
                                </div>

                            </div>

                            <div className="flex gap-3 self-start mt-1">

                                <button
                                    type="button"
                                    onClick={
                                        handleMarkAllPresent
                                    }
                                    className="rounded-lg bg-purple-300 px-6 py-3 font-medium text-purple-950 shadow-[0_2px_3px] transition-colors hover:bg-violet-300 cursor-pointer"
                                >
                                    Mark all present
                                </button>

                                <button
                                    type="button"
                                    onClick={
                                        handleMarkAllAbsent
                                    }
                                    className="rounded-lg bg-gray-200 px-6 py-3 font-medium text-purple-950 shadow-[0_2px_3px] transition-colors hover:bg-red-200 cursor-pointer"
                                >
                                    Mark all absent
                                </button>

                            </div>

                        </div>

                        <div className="flex flex-wrap gap-10">

                            <TeacherAttendanceTable
                                students={
                                    studentsData
                                }
                                attendance={
                                    attendance
                                }
                                setAttendance={
                                    setAttendance
                                }
                                startIndex={
                                    startIndex
                                }
                                markAllStatus={markAllStatus}
                            />

                        </div>

                        <div className="flex justify-between mt-5 mb-5 items-center">

                            <div className="mt-1">

                                <Pagination
                                    currentPage={
                                        currentPage
                                    }
                                    totalPages={
                                        totalPages
                                    }
                                    setCurrentPage={
                                        setCurrentPage
                                    }
                                />

                            </div>

                            <Limit
                                setLimit={
                                    setLimit
                                }
                                limit={
                                    limit
                                }
                            />

                        </div>

                        <div className="flex justify-center gap-10 pt-3">

                            <button
                                type="button"
                                onClick={
                                    handleSubmitAttendance
                                }
                                className="rounded-lg bg-purple-300 px-6 py-3 font-medium text-purple-950 shadow-[0_2px_3px] transition-colors hover:bg-violet-300 cursor-pointer"
                            >
                                Submit Attendance
                            </button>

                            <button
                                type="button"
                                onClick={
                                    handleReset
                                }
                                className="rounded-lg bg-purple-300 px-6 py-3 font-medium text-purple-950 shadow-[0_2px_3px] transition-colors hover:bg-violet-300 cursor-pointer"
                            >
                                Reset
                            </button>

                        </div>

                    </div>
                </div>
            </div>

            <Modal
                isOpen={
                    modalOpen
                }
                title={
                    modalTitle
                }
                message={
                    modalMessage
                }
                onClose={() => {
                    setModalOpen(false);
                    setModalConfirm(undefined);
                }}
                onConfirm={
                    modalConfirm
                }
            />

        </div>
    );
}

export default TeacherAttendance;