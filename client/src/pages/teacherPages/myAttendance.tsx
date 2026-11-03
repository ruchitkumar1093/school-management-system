import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import Pagination from "../../components/pagination";
import Limit from "../../components/limit";
import Breadcrumb from "../../components/breadcrumb";
import { getMyAttendance } from "../../services/teacherApi";
import { useNavigate } from "react-router-dom";

import { useState, useEffect } from "react";

type Attendance = {
    _id: string;
    date: string;
    status: "Present" | "Absent" | "Leave";
};

type TeacherInfo = {
    name: string;
    uid: string;
    employeeID: string;
};

function MyAttendance() {
    const navigate = useNavigate();
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [teacher, setTeacher] = useState<TeacherInfo | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    const [presentCount, setPresentCount] = useState(0);
    const [absentCount, setAbsentCount] = useState(0);
    const [leaveCount, setLeaveCount] = useState(0);
    const [totalDays, setTotalDays] = useState(0);
    const [percentage, setPercentage] = useState(0);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const fetchAttendance = async () => {
            setLoading(true);

            try {
                const response = await getMyAttendance(
                    currentPage,
                    limit
                );

                if (cancelled) return;

                const data = response.data;

                setAttendance(data.attendance);
                setTeacher(data.teacher);
                setTotalPages(data.totalPages);

                setPresentCount(data.presentCount);
                setAbsentCount(data.absentCount);
                setLeaveCount(data.leaveCount);
                setTotalDays(data.totalDays);
                setPercentage(data.percentage);
            } catch (error) {
                if (cancelled) return;

                console.error(error);

                setAttendance([]);
                setTeacher(null);
                setTotalPages(1);

                setPresentCount(0);
                setAbsentCount(0);
                setLeaveCount(0);
                setTotalDays(0);
                setPercentage(0);
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
    }, [currentPage, limit]);

    useEffect(() => {
        setCurrentPage(1);
    }, [limit]);

    const startIndex = (currentPage - 1) * limit;

    return (
        <div className="flex min-h-screen flex-col font-fredoka">
            <NavBar />

            <div className="flex flex-1 bg-purple-100">
                <SideBar />

                <div>
                    <Breadcrumb />

                    <div className="mb-10 flex flex-col pt-12 pl-20">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-medium text-gray-900">
                                    Attendance
                                </h1>

                                <p className="mt-1 text-sm text-gray-600">
                                    View your attendance
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        "/teacher/myAttendance/attendanceCalendar"
                                    )
                                }
                                className="cursor-pointer rounded-lg bg-purple-300 px-6 py-3 font-medium text-purple-950 shadow-[0_2px_3px] transition-colors hover:bg-violet-300"
                            >
                                Attendance Calendar
                            </button>
                        </div>

                        {teacher && (
                            <>
                                <div className="mb-5 flex flex-wrap gap-8">
                                    <div>
                                        Teacher:
                                        <span className="ml-1 font-medium">
                                            {teacher.name}
                                        </span>
                                    </div>

                                    <div>
                                        UID:
                                        <span className="ml-1 font-medium">
                                            {teacher.uid.toUpperCase()}
                                        </span>
                                    </div>

                                    <div>
                                        Employee ID:
                                        <span className="ml-1 font-medium">
                                            {teacher.employeeID}
                                        </span>
                                    </div>
                                </div>

                                <div className="mb-5 flex flex-wrap gap-8">
                                    <div>
                                        Total Days:
                                        <span className="ml-1 font-medium">
                                            {totalDays}
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
                                        Attendance:
                                        <span className="ml-1 font-medium">
                                            {percentage.toFixed(2)}%
                                        </span>
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="w-full overflow-x-auto">
                            <table className="w-full border-separate border-spacing-y-2 text-left text-gray-900">
                                <thead>
                                    <tr className="bg-purple-300 text-purple-950">
                                        <th className="rounded-l-lg px-3 py-2 font-semibold">
                                            S.No.
                                        </th>

                                        <th className="px-3 py-2 font-semibold">
                                            Date
                                        </th>

                                        <th className="rounded-r-lg px-3 py-2 text-center font-semibold">
                                            Attendance
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td
                                                colSpan={3}
                                                className="rounded-lg bg-purple-100 p-4 text-center text-gray-500"
                                            >
                                                Loading attendance...
                                            </td>
                                        </tr>
                                    ) : attendance.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={3}
                                                className="rounded-lg bg-purple-100 p-4 text-center text-gray-500"
                                            >
                                                No attendance records found
                                            </td>
                                        </tr>
                                    ) : (
                                        attendance.map((record, index) => (
                                            <tr
                                                key={record._id}
                                                className="group"
                                            >
                                                <td className="rounded-l-lg bg-purple-200 p-3 font-medium transition-colors group-hover:bg-purple-200/70">
                                                    {startIndex + index + 1}
                                                </td>

                                                <td className="bg-purple-200 p-3 transition-colors group-hover:bg-purple-200/70">
                                                    {new Date(
                                                        record.date
                                                    ).toLocaleDateString(
                                                        "en-GB",
                                                        {
                                                            timeZone: "UTC"
                                                        }
                                                    )}
                                                </td>

                                                <td
                                                    className={`rounded-r-lg bg-purple-200 p-3 text-center font-medium transition-colors group-hover:bg-purple-200/70 ${
                                                        record.status === "Present"
                                                            ? "text-emerald-600"
                                                            : record.status === "Absent"
                                                              ? "text-red-600"
                                                              : "text-amber-600"
                                                    }`}
                                                >
                                                    {record.status}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="mb-5 mt-5 flex items-center justify-between">
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

export default MyAttendance;