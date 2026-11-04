import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import SearchBar from "../../components/searchBar";
import Pagination from "../../components/pagination";
import Limit from "../../components/limit";
import { useNavigate, useLocation } from "react-router-dom";
import { FiCalendar } from "react-icons/fi";
import Breadcrumb from "../../components/breadcrumb";
import { getAttendance } from "../../services/principalApi";
import { useState, useEffect, useRef } from "react";

type Summary = { class: string; present: number; absent: number; percentage: number };
type Attendance = {
    _id: string;
    studentId: {
        _id: string;
        userId: { name: string; uid: string };
        class: string;
        rollNumber: string;
    };
    date: string;
    status: "Present" | "Absent" | "Leave" | "Not Marked";
};
type StudentClass = "1st" | "2nd" | "3rd" | "4th" | "5th" | "6th" | "7th" | "8th" | "9th" | "10th" | "11th" | "12th";
type AttendanceCache = { attendance: Attendance[]; summary: Summary; totalPages: number };

const classes: StudentClass[] = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"];

function PrincipalAttendance() {
    const navigate = useNavigate();
    const location = useLocation();

    const [selectedClass, setSelectedClass] = useState<StudentClass>(
        location.state?.selectedClass ?? "1st"
    );
    // const [selectedClass, setSelectedClass] = useState<StudentClass>("1st");
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
    const [summaryData, setSummaryData] = useState<Summary | null>(null);
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const attendanceCache = useRef<Map<string, AttendanceCache>>(new Map());

    const getAttendanceCacheKey = () => `${selectedClass}-${selectedDate}-${debouncedSearch}-${currentPage}-${limit}`;

    const fetchAttendance = async () => {
        const cacheKey = getAttendanceCacheKey();
        const cachedData = attendanceCache.current.get(cacheKey);
        if (cachedData) {
            setAttendance(cachedData.attendance);
            setSummaryData(cachedData.summary);
            setTotalPages(cachedData.totalPages);
            return;
        }
        try {
            const response = await getAttendance(selectedClass, selectedDate, debouncedSearch, currentPage, limit);
            const data: AttendanceCache = {
                attendance: response.data.attendance,
                summary: response.data.summary,
                totalPages: response.data.totalPages
            };
            attendanceCache.current.set(cacheKey, data);
            setAttendance(data.attendance);
            setSummaryData(data.summary);
            setTotalPages(data.totalPages);
        } catch (error) {
            console.log(error);
            setAttendance([]);
            setSummaryData(null);
            setTotalPages(1);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        fetchAttendance();
    }, [selectedClass, selectedDate, debouncedSearch, currentPage, limit]);

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch, limit, selectedClass, selectedDate]);

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
                                <h1 className="text-3xl font-medium text-gray-900">View Attendance</h1>
                                <p className="mt-1 text-sm text-gray-600">View and Manage Attendance</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => navigate("/principal/attendance")}
                                className="rounded-lg bg-purple-300 px-3 py-3 font-medium text-purple-950 shadow-[0_2px_3px] transition-colors hover:bg-violet-300 cursor-pointer"
                            >
                                View Summary
                            </button>
                        </div>

                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-4">
                                <label htmlFor="class" className="text-lg">Class:</label>
                                <select
                                    id="class"
                                    value={selectedClass}
                                    onChange={(e) => {
                                        setSelectedClass(e.target.value as StudentClass);
                                        setCurrentPage(1);
                                    }}
                                    className="border-2 border-gray-500 rounded-sm p-2 focus:outline-none focus:border-gray-900"
                                >
                                    {classes.map((studentClass) => (
                                        <option key={studentClass} value={studentClass}>{studentClass}</option>
                                    ))}
                                </select>
                                <label htmlFor="date" className="text-lg ml-4">Date:</label>
                                <input
                                    max={new Date().toISOString().split("T")[0]}
                                    type="date"
                                    id="date"
                                    value={selectedDate}
                                    onChange={(e) => {
                                        setSelectedDate(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="border-2 border-gray-500 rounded-sm p-2 focus:outline-none focus:border-gray-900"
                                />
                                <SearchBar search={search} setSearch={setSearch} />
                            </div>
                        </div>

                        <div className="flex gap-8 mb-5">
                            <div>Class:<span className="font-medium ml-1">{selectedClass}</span></div>
                            <div>Present:<span className="font-medium ml-1">{summaryData?.present ?? 0}</span></div>
                            <div>Absent:<span className="font-medium ml-1">{summaryData?.absent ?? 0}</span></div>
                            <div>
                                Attendance:
                                <span className="font-medium ml-1">
                                    {summaryData ? `${summaryData.percentage.toFixed(2)}%` : "0.00%"}
                                </span>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full border-separate border-spacing-y-2 text-left text-gray-900">
                                <thead>
                                    <tr className="bg-purple-300 text-purple-950">
                                        <th className="rounded-l-lg px-3 py-2 font-semibold">S.No.</th>
                                        <th className="px-3 py-2 font-semibold">Student Name</th>
                                        <th className="px-3 py-2 font-semibold">UID</th>
                                        <th className="px-3 py-2 font-semibold">Attendance</th>
                                        <th className="rounded-r-lg px-3 py-2 text-center font-semibold">Calendar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendance.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="rounded-lg bg-purple-100 p-4 text-center text-gray-500">
                                                No students found
                                            </td>
                                        </tr>
                                    ) : attendance.map((record, index) => (
                                        <tr key={record._id} className="group">
                                            <td className="rounded-l-lg bg-purple-200 p-3 font-medium transition-colors group-hover:bg-purple-200/70">
                                                {startIndex + index + 1}
                                            </td>
                                            <td className="bg-purple-200 p-3 font-medium transition-colors group-hover:bg-purple-200/70">
                                                {record.studentId.userId.name}
                                            </td>
                                            <td className="bg-purple-200 p-3 transition-colors group-hover:bg-purple-200/70">
                                                {record.studentId.userId.uid.toUpperCase()}
                                            </td>
                                            <td className="bg-purple-200 p-3 text-center font-medium transition-colors group-hover:bg-purple-200/70">
                                                <span className={
                                                    record.status === "Present"
                                                        ? "text-emerald-600"
                                                        : record.status === "Leave"
                                                            ? "text-amber-600"
                                                            : record.status === "Absent"
                                                                ? "text-red-600"
                                                                : "text-gray-500"
                                                }>
                                                    {record.status}
                                                </span>
                                            </td>
                                            <td className="rounded-r-lg bg-purple-200 p-2 text-center transition-colors group-hover:bg-purple-200/70">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        navigate(
                                                            `/principal/attendance/viewAttendance/attendanceCalendar/${record.studentId._id}`
                                                        )
                                                    }
                                                    title="View attendance calendar"
                                                    aria-label={`View attendance calendar for ${record.studentId.userId.name}`}
                                                    className="inline-flex cursor-pointer items-center justify-center rounded-md p-1.5 text-purple-800 transition-colors hover:bg-purple-300 hover:text-purple-950"
                                                >
                                                    <FiCalendar size={20} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-between mt-5 mb-5 items-center">
                            <Pagination currentPage={currentPage} totalPages={totalPages} setCurrentPage={setCurrentPage} />
                            <Limit setLimit={setLimit} limit={limit} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PrincipalAttendance;