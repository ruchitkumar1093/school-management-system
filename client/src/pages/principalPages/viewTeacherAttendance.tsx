import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import SearchBar from "../../components/searchBar";
import Pagination from "../../components/pagination";
import Limit from "../../components/limit";
import Breadcrumb from "../../components/breadcrumb";
import ClassFilter from "../../components/classFilter";
import PrincipalViewTeacherAttendanceTable from "../../components/principalComponents/teacherViewAttendanceTable";

import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

import { getTeacherAttendance } from "../../services/principalApi";

type TeacherAttendance = {
    _id: string;
    teacherId: {
        _id: string;
        name: string;
        employeeID: string;
        classes?: string[];
    };
    date: string;
    status: "Present" | "Absent" | "Leave" | "Not Marked";
};

type AttendanceResponse = {
    attendance: TeacherAttendance[];
    totalRecords: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    presentCount: number;
    absentCount: number;
    leaveCount: number;
    notMarkedCount: number;
    classes?: string[];
};

function ViewTeacherAttendance() {
    const navigate = useNavigate();

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [classFilter, setClassFilter] = useState("1st");
    const [availableClasses, setAvailableClasses] = useState<string[]>([]);

    const [date, setDate] = useState(
        new Date().toLocaleDateString("en-CA")
    );

    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const [attendanceData, setAttendanceData] = useState<
        TeacherAttendance[]
    >([]);

    const [totalTeachers, setTotalTeachers] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const [presentCount, setPresentCount] = useState(0);
    const [absentCount, setAbsentCount] = useState(0);
    const [leaveCount, setLeaveCount] = useState(0);
    const [notMarkedCount, setNotMarkedCount] = useState(0);

    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);

        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        setCurrentPage(1);
    }, [date, debouncedSearch, limit, classFilter]);

    useEffect(() => {
        let cancelled = false;

        const fetchAttendance = async () => {
            setLoading(true);
            setErrorMessage("");

            try {
                const response = await getTeacherAttendance({
                    date,
                    search: debouncedSearch.trim(),
                    page: currentPage,
                    limit,
                    classFilter
                });

                if (cancelled) return;

                /*
                 * Supports either an Axios response or a service
                 * that already returns response.data.
                 */
                const data: AttendanceResponse =
                    response?.data ?? response;

                if (!data || !Array.isArray(data.attendance)) {
                    throw new Error(
                        "The attendance API returned an unexpected response."
                    );
                }

                if (Array.isArray(data.classes)) {
                    setAvailableClasses(data.classes);
                }

                setAttendanceData(data.attendance);
                setTotalTeachers(data.totalRecords ?? 0);
                setTotalPages(Math.max(1, data.totalPages ?? 1));

                setPresentCount(data.presentCount ?? 0);
                setAbsentCount(data.absentCount ?? 0);
                setLeaveCount(data.leaveCount ?? 0);
                setNotMarkedCount(data.notMarkedCount ?? 0);

                if (
                    data.currentPage &&
                    currentPage !== data.currentPage
                ) {
                    setCurrentPage(data.currentPage);
                }
            } catch (error) {
                if (cancelled) return;

                const apiError = error as {
                    response?: {
                        data?: {
                            message?: string;
                        };
                    };
                    message?: string;
                };

                setAttendanceData([]);
                setTotalTeachers(0);
                setTotalPages(1);

                setPresentCount(0);
                setAbsentCount(0);
                setLeaveCount(0);
                setNotMarkedCount(0);

                setErrorMessage(
                    apiError.response?.data?.message ??
                    apiError.message ??
                    "Failed to fetch teacher attendance."
                );
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void fetchAttendance();

        return () => {
            cancelled = true;
        };
    }, [
        date,
        debouncedSearch,
        currentPage,
        limit,
        classFilter
    ]);

    return (
        <div className="flex min-h-screen flex-col font-fredoka">
            <NavBar />

            <div className="flex flex-1 bg-purple-100">
                <SideBar />

                <div className="min-w-0 flex-1">
                    <Breadcrumb />

                    <div className="mb-10 flex flex-col px-8 pt-12 lg:pl-20">
                        <div className="mb-6 flex items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-medium text-gray-900">
                                    View Attendance
                                </h1>

                                <p className="mt-1 text-sm text-gray-600">
                                    View and manage teachers' attendance records
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    navigate("/principal/teacherAttendance")
                                }
                                className="cursor-pointer rounded-lg bg-purple-300 px-6 py-3 font-medium text-purple-950 shadow-[0_2px_3px] transition-colors hover:bg-violet-300"
                            >
                                Mark Attendance
                            </button>
                        </div>

                        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-5">
                                <div className="flex items-center gap-4">
                                    <label
                                        htmlFor="teacher-attendance-date"
                                        className="text-lg"
                                    >
                                        Date:
                                    </label>

                                    <input
                                        max={new Date().toLocaleDateString("en-CA")}
                                        type="date"
                                        id="teacher-attendance-date"
                                        value={date}
                                        onChange={(event) =>
                                            setDate(event.target.value)
                                        }
                                        className="rounded-sm border-2 border-gray-500 p-2 transition-colors duration-300 ease-in-out focus:border-gray-900 focus:outline-none"
                                    />
                                </div>

                                <ClassFilter
                                    classFilter={classFilter}
                                    setClassFilter={setClassFilter}
                                    classes={availableClasses}
                                />
                            </div>

                            <SearchBar
                                search={search}
                                setSearch={setSearch}
                            />
                        </div>

                        <div className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-3">
                            <div>
                                Total Teachers:
                                <span className="ml-1 font-medium">
                                    {totalTeachers}
                                </span>
                            </div>

                            <div>
                                Present:
                                <span className="ml-1 font-medium">
                                    {presentCount}
                                </span>
                            </div>

                            <div>
                                Absent:
                                <span className="ml-1 font-medium">
                                    {absentCount}
                                </span>
                            </div>

                            <div>
                                Leave:
                                <span className="ml-1 font-medium">
                                    {leaveCount}
                                </span>
                            </div>

                            <div>
                                Not Marked:
                                <span className="ml-1 font-medium">
                                    {notMarkedCount}
                                </span>
                            </div>
                        </div>

                        {loading ? (
                            <div className="py-10 text-center text-gray-600">
                                Loading teacher attendance...
                            </div>
                        ) : errorMessage ? (
                            <div className="rounded-lg border border-red-200 bg-white p-6 text-center text-red-700">
                                {errorMessage}
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-10">
                                <PrincipalViewTeacherAttendanceTable
                                    attendance={attendanceData}
                                    startIndex={(currentPage - 1) * limit}
                                />
                            </div>
                        )}

                        <div className="mb-5 mt-5 flex items-center justify-between gap-4">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                setCurrentPage={setCurrentPage}
                            />

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

export default ViewTeacherAttendance;