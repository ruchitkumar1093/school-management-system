
import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import SearchBar from "../../components/searchBar";
import Pagination from "../../components/pagination";
import Limit from "../../components/limit";
import { useNavigate } from "react-router-dom";
import Breadcrumb from "../../components/breadcrumb";
import { getAttendance } from "../../services/teacherApi";
import TeacherViewAttendanceTable from "../../components/viewAttendanceTable";
import { useState, useEffect, useRef } from "react";

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

function TeacherViewAttendance() {
    const navigate = useNavigate();

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [attendanceData, setAttendanceData] = useState<Attendance[]>([]);
    const [date, setDate] = useState(
        new Date().toISOString().split("T")[0]
    );
    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [presentCount, setPresentCount] = useState(0);
    const [absentCount, setAbsentCount] = useState(0);
    const [leaveCount, setLeaveCount] = useState(0);

    const attendanceCache = useRef(
        new Map<
            string,
            {
                attendance: Attendance[];
                totalPages: number;
                presentCount: number;
                absentCount: number;
                leaveCount: number;
            }
        >()
    );

    const fetchAttendance = async () => {
        const cacheKey =
            `${date}|${debouncedSearch}|${currentPage}|${limit}`;

        const cachedData = attendanceCache.current.get(cacheKey);

        if (cachedData) {
            setAttendanceData(cachedData.attendance);
            setTotalPages(cachedData.totalPages);
            setPresentCount(cachedData.presentCount);
            setAbsentCount(cachedData.absentCount);
            setLeaveCount(cachedData.leaveCount);
            return;
        }

        try {
            const response = await getAttendance(
                date,
                debouncedSearch,
                currentPage,
                limit
            );

            const data = {
                attendance: response.data.attendance,
                totalPages: response.data.totalPages,
                presentCount: response.data.presentCount,
                absentCount: response.data.absentCount,
                leaveCount: response.data.leaveCount
            };

            attendanceCache.current.set(cacheKey, data);

            setAttendanceData(data.attendance);
            setTotalPages(data.totalPages);
            setPresentCount(data.presentCount);
            setAbsentCount(data.absentCount);
            setLeaveCount(data.leaveCount);
        } catch (error) {
            console.log(error);
            setAttendanceData([]);
            setTotalPages(1);
            setPresentCount(0);
            setAbsentCount(0);
            setLeaveCount(0);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);

        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        fetchAttendance();
    }, [date, debouncedSearch, currentPage, limit]);

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch, limit, date]);

    const className = attendanceData[0]?.studentId.class || "-";
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
                                    View and Manage Attendance
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

                        <div className="flex justify-between items-center mb-5">
                            <div className="flex items-center gap-4">
                                <label htmlFor="date" className="text-lg">
                                    Date:
                                </label>

                                <input
                                    max={new Date().toISOString().split("T")[0]}
                                    type="date"
                                    id="date"
                                    value={date}
                                    onChange={(e) => {
                                        setDate(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="border-2 border-gray-500 rounded-sm p-2 focus:outline-none focus:border-gray-900 transition-colors duration-300 ease-in-out"
                                />
                            </div>

                            <SearchBar
                                search={search}
                                setSearch={setSearch}
                            />
                        </div>

                        <div className="flex gap-5 items-center mb-5">
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
