import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import SearchBar from "../../components/searchBar";
import Pagination from "../../components/pagination";
import Limit from "../../components/limit";
import { useNavigate } from "react-router-dom";
import Breadcrumb from "../../components/breadcrumb";
import {
    getAttendance,
    getTeacherSubjects
} from "../../services/teacherApi";
import TeacherViewAttendanceTable from "../../components/viewAttendanceTable";
import {
    useState,
    useEffect,
    useRef,
    useMemo,
    useCallback
} from "react";

type Attendance = {
    _id: string;
    studentId: {
        _id: string;
        userId: {
            name: string;
            uid: string;
        };
        class: string;
        rollNumber: string;
    };
    date: string;
    status: "Present" | "Absent" | "Leave" | "Not Marked";
};

type TeacherSubject = {
    _id: string;
    name: string;
    subjectCode: string;
    class: string;
};

type AttendanceCacheEntry = {
    attendance: Attendance[];
    totalPages: number;
    presentCount: number;
    absentCount: number;
    leaveCount: number;
};

function TeacherViewAttendance() {
    const navigate = useNavigate();

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [attendanceData, setAttendanceData] =
        useState<Attendance[]>([]);

    const [date, setDate] = useState(
        new Date().toISOString().split("T")[0]
    );

    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    const [presentCount, setPresentCount] = useState(0);
    const [absentCount, setAbsentCount] = useState(0);
    const [leaveCount, setLeaveCount] = useState(0);

    const [teacherSubjects, setTeacherSubjects] =
        useState<TeacherSubject[]>([]);

    const [classFilter, setClassFilter] = useState("");
    const [classesLoading, setClassesLoading] = useState(true);
    const [attendanceLoading, setAttendanceLoading] = useState(false);

    const [errorMessage, setErrorMessage] = useState("");

    const attendanceCache = useRef(
        new Map<string, AttendanceCacheEntry>()
    );

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

    // Load the classes assigned to this teacher.
    useEffect(() => {
        let cancelled = false;

        const fetchAssignedClasses = async () => {
            try {
                const response = await getTeacherSubjects();

                if (cancelled) {
                    return;
                }

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
                if (cancelled) {
                    return;
                }

                console.error(
                    "Failed to fetch assigned classes:",
                    error
                );

                setTeacherSubjects([]);
                setClassFilter("");
                setErrorMessage(
                    "Failed to load your assigned classes."
                );
            } finally {
                if (!cancelled) {
                    setClassesLoading(false);
                }
            }
        };

        void fetchAssignedClasses();

        return () => {
            cancelled = true;
        };
    }, []);

    // Debounce search input.
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);

        return () => clearTimeout(timer);
    }, [search]);

    // Reset pagination when filters change.
    useEffect(() => {
        setCurrentPage(1);
    }, [date, debouncedSearch, limit, classFilter]);

    const fetchAttendance = useCallback(async () => {
        if (!classFilter || classesLoading) {
            setAttendanceData([]);
            setTotalPages(1);
            setPresentCount(0);
            setAbsentCount(0);
            setLeaveCount(0);
            setAttendanceLoading(false);
            return;
        }

        let cancelled = false;

        const cacheKey =
            `${classFilter}|${date}|${debouncedSearch}|${currentPage}|${limit}`;

        const cachedData =
            attendanceCache.current.get(cacheKey);

        if (cachedData) {
            setAttendanceData(cachedData.attendance);
            setTotalPages(cachedData.totalPages);
            setPresentCount(cachedData.presentCount);
            setAbsentCount(cachedData.absentCount);
            setLeaveCount(cachedData.leaveCount);
            setErrorMessage("");
            return;
        }

        setAttendanceLoading(true);
        setErrorMessage("");

        try {
            const response = await getAttendance(
                date,
                debouncedSearch,
                currentPage,
                limit,
                classFilter
            );

            if (cancelled) {
                return;
            }

            const data: AttendanceCacheEntry = {
                attendance: response.data.attendance ?? [],
                totalPages: response.data.totalPages ?? 1,
                presentCount: response.data.presentCount ?? 0,
                absentCount: response.data.absentCount ?? 0,
                leaveCount: response.data.leaveCount ?? 0
            };

            attendanceCache.current.set(cacheKey, data);

            setAttendanceData(data.attendance);
            setTotalPages(data.totalPages);
            setPresentCount(data.presentCount);
            setAbsentCount(data.absentCount);
            setLeaveCount(data.leaveCount);
        } catch (error) {
            if (cancelled) {
                return;
            }

            console.error("Failed to fetch attendance:", error);

            setAttendanceData([]);
            setTotalPages(1);
            setPresentCount(0);
            setAbsentCount(0);
            setLeaveCount(0);
            setErrorMessage(
                "Failed to load attendance. Please try again."
            );
        } finally {
            if (!cancelled) {
                setAttendanceLoading(false);
            }
        }

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

    useEffect(() => {
        let cancelled = false;

        const loadAttendance = async () => {
            await fetchAttendance();

            // The request's own error handling is inside fetchAttendance.
            // This flag prevents outdated requests from controlling this effect.
            if (cancelled) {
                return;
            }
        };

        void loadAttendance();

        return () => {
            cancelled = true;
        };
    }, [fetchAttendance]);

    const className =
        attendanceData[0]?.studentId.class || classFilter || "-";

    const startIndex = (currentPage - 1) * limit;

    return (
        <div className="flex flex-col min-h-screen font-fredoka">
            <NavBar />

            <div className="flex flex-1 bg-purple-100">
                <SideBar />

                <div>
                    <Breadcrumb />

                    <div className="flex flex-col pt-12 pl-20 mb-10">
                        <div className="flex gap-3 justify-between items-center mb-6">
                            <div>
                                <h1 className="text-3xl font-medium text-gray-900">
                                    View Attendance
                                </h1>

                                <p className="mt-1 text-sm text-gray-600">
                                    View attendance by class and date
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="rounded-lg bg-purple-300 px-3 py-3 font-medium text-purple-950 shadow-[0_2px_3px] transition-colors hover:bg-violet-300 cursor-pointer"
                            >
                                Mark Attendance
                            </button>
                        </div>

                        <div className="flex flex-wrap justify-between items-center gap-4 mb-5">
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <label
                                        htmlFor="attendanceClass"
                                        className="text-lg"
                                    >
                                        Class:
                                    </label>

                                    <select
                                        id="attendanceClass"
                                        value={classFilter}
                                        onChange={event => {
                                            setClassFilter(event.target.value);
                                            setCurrentPage(1);
                                        }}
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
                                            teacherClasses.map(classValue => (
                                                <option
                                                    key={classValue}
                                                    value={classValue}
                                                >
                                                    {classValue}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                </div>

                                <div className="flex items-center gap-2">
                                    <label
                                        htmlFor="date"
                                        className="text-lg"
                                    >
                                        Date:
                                    </label>

                                    <input
                                        max={new Date()
                                            .toISOString()
                                            .split("T")[0]}
                                        type="date"
                                        id="date"
                                        value={date}
                                        onChange={event => {
                                            setDate(event.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="border-2 border-gray-500 rounded-sm p-2 focus:outline-none focus:border-gray-900 transition-colors duration-300 ease-in-out"
                                    />
                                </div>
                            </div>

                            <SearchBar
                                search={search}
                                setSearch={setSearch}
                            />
                        </div>

                        <div className="flex flex-wrap gap-5 items-center mb-5">
                            <div>
                                Class:
                                <span className="font-medium ml-1">
                                    {className}
                                </span>
                            </div>

                            <div>
                                Present:
                                <span className="font-medium ml-1">
                                    {presentCount}
                                </span>
                            </div>

                            <div>
                                Absent:
                                <span className="font-medium ml-1">
                                    {absentCount}
                                </span>
                            </div>

                            <div>
                                Leave:
                                <span className="font-medium ml-1">
                                    {leaveCount}
                                </span>
                            </div>
                        </div>

                        {errorMessage && (
                            <div
                                role="alert"
                                className="mb-4 rounded-md bg-red-100 p-3 text-red-700"
                            >
                                {errorMessage}
                            </div>
                        )}

                        {attendanceLoading && (
                            <p className="mb-3 text-sm text-purple-800">
                                Loading attendance...
                            </p>
                        )}

                        <div className="flex flex-wrap gap-10">
                            <TeacherViewAttendanceTable
                                attendance={attendanceData}
                                startIndex={startIndex}
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
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TeacherViewAttendance;