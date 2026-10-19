
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
        department: string;
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
};

function ViewTeacherAttendance() {
    const navigate = useNavigate();

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [classFilter, setClassFilter] = useState("1st");

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

    /*
     * Reset pagination whenever a filter changes.
     */
    useEffect(() => {
        setCurrentPage(1);
    }, [date, debouncedSearch, limit, classFilter]);

    useEffect(() => {
        let cancelled = false;

        const fetchAttendance = async () => {
            setLoading(true);
            setErrorMessage("");

            try {
                const response: AttendanceResponse =
                    await getTeacherAttendance({
                        date,
                        search: debouncedSearch.trim(),
                        page: currentPage,
                        limit,
                        classFilter
                    });

                if (cancelled) {
                    return;
                }

                setAttendanceData(response.attendance);
                setTotalTeachers(response.totalRecords);
                setTotalPages(Math.max(1, response.totalPages));

                setPresentCount(response.presentCount);
                setAbsentCount(response.absentCount);
                setLeaveCount(response.leaveCount);
                setNotMarkedCount(response.notMarkedCount);

                if (currentPage !== response.currentPage) {
                    setCurrentPage(response.currentPage);
                }
            } catch (error) {
                if (cancelled) {
                    return;
                }

                const apiError = error as {
                    response?: {
                        data?: {
                            message?: string;
                        };
                    };
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
                                className="rounded-lg bg-purple-300 px-6 py-3 font-medium text-purple-950 shadow-[0_2px_3px] transition-colors hover:bg-violet-300 cursor-pointer"
                            >
                                Mark Attendance
                            </button>
                        </div>

                        <div className="flex justify-between items-center mb-5">
                            <div className="flex gap-5">
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
                                        className="border-2 border-gray-500 rounded-sm p-2 focus:outline-none focus:border-gray-900 transition-colors duration-300 ease-in-out"
                                    />
                                </div>
                                <ClassFilter
                                    classFilter={classFilter}
                                    setClassFilter={setClassFilter}
                                />
                            </div>
                            <SearchBar
                                search={search}
                                setSearch={setSearch}
                            />
                        </div>

                        <div className="flex justify-between items-center mb-5">
                            <div className="flex flex-wrap gap-5 items-center">
                                <div>
                                    Total Teachers:
                                    <span className="font-medium ml-1">
                                        {totalTeachers}
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

                                <div>
                                    Not Marked:
                                    <span className="font-medium ml-1">
                                        {notMarkedCount}
                                    </span>
                                </div>
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

export default ViewTeacherAttendance;
