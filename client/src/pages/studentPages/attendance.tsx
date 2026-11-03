import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import Pagination from "../../components/pagination";
import Limit from "../../components/limit";
import Breadcrumb from "../../components/breadcrumb";
import { getAttendance } from "../../services/studentApi";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

type Attendance = {
    _id: string;
    date: string;
    status: "Present" | "Absent" | "Leave";
};

type StudentInfo = {
    name: string;
    uid: string;
    class: string;
    rollNumber: string;
};

function StudentAttendance() {
    const navigate = useNavigate();

    const [attendance, setAttendance] =
        useState<Attendance[]>([]);

    const [student, setStudent] =
        useState<StudentInfo | null>(null);

    const [currentPage, setCurrentPage] =
        useState(1);

    const [limit, setLimit] =
        useState(10);

    const [totalPages, setTotalPages] =
        useState(1);

    const [presentCount, setPresentCount] =
        useState(0);

    const [absentCount, setAbsentCount] =
        useState(0);

    const [leaveCount, setLeaveCount] =
        useState(0);

    const [totalDays, setTotalDays] =
        useState(0);

    const [percentage, setPercentage] =
        useState(0);

    const fetchAttendance = async () => {
        try {
            const response =
                await getAttendance(
                    currentPage,
                    limit
                );

            setAttendance(
                response.data.attendance
            );

            setStudent(
                response.data.student
            );

            setTotalPages(
                response.data.totalPages
            );

            setPresentCount(
                response.data.presentCount
            );

            setAbsentCount(
                response.data.absentCount
            );

            setLeaveCount(
                response.data.leaveCount
            );

            setTotalDays(
                response.data.totalDays
            );

            setPercentage(
                response.data.percentage
            );
        }
        catch (error) {
            console.log(error);

            setAttendance([]);
            setStudent(null);
            setTotalPages(1);
            setPresentCount(0);
            setAbsentCount(0);
            setLeaveCount(0);
            setTotalDays(0);
            setPercentage(0);
        }
    };

    useEffect(() => {
        fetchAttendance();
    }, [
        currentPage,
        limit
    ]);

    useEffect(() => {
        setCurrentPage(1);
    }, [limit]);

    const startIndex =
        (currentPage - 1) * limit;

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
                                    View your Attendance
                                </p>
                            </div>

                            <button
                                onClick={() =>
                                    navigate("calender", {
                                        state: { student }
                                    })
                                }
                                type="button"
                                className="cursor-pointer rounded-lg bg-purple-300 px-6 py-3 font-medium text-purple-950 shadow-[0_2px_3px] transition-colors hover:bg-violet-300"
                            >
                                Attendance Calender
                            </button>
                        </div>

                        {student && (
                            <>
                                <div className="mb-5 flex flex-wrap gap-8">
                                    <div>
                                        Student:
                                        <span className="ml-1 font-medium">
                                            {student.name}
                                        </span>
                                    </div>

                                    <div>
                                        UID:
                                        <span className="ml-1 font-medium">
                                            {student.uid.toUpperCase()}
                                        </span>
                                    </div>

                                    <div>
                                        Class:
                                        <span className="ml-1 font-medium">
                                            {student.class}
                                        </span>
                                    </div>

                                    <div>
                                        Roll Number:
                                        <span className="ml-1 font-medium">
                                            {student.rollNumber}
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
                                    {attendance.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={3}
                                                className="rounded-lg bg-purple-100 p-4 text-center text-gray-500"
                                            >
                                                No attendance records found
                                            </td>
                                        </tr>
                                    ) : (
                                        attendance.map(
                                            (record, index) => (
                                                <tr
                                                    key={record._id}
                                                    className="group"
                                                >
                                                    <td className="rounded-l-lg bg-purple-200 p-3 font-medium transition-colors group-hover:bg-purple-200/70">
                                                        {startIndex +
                                                            index +
                                                            1}
                                                    </td>

                                                    <td className="bg-purple-200 p-3 transition-colors group-hover:bg-purple-200/70">
                                                        {new Date(
                                                            record.date
                                                        ).toLocaleDateString(
                                                            "en-GB"
                                                        )}
                                                    </td>

                                                    <td
                                                        className={`rounded-r-lg bg-purple-200 p-3 text-center font-medium transition-colors group-hover:bg-purple-200/70 ${
                                                            record.status ===
                                                            "Present"
                                                                ? "text-emerald-600"
                                                                : record.status ===
                                                                  "Absent"
                                                                  ? "text-red-600"
                                                                  : "text-amber-600"
                                                        }`}
                                                    >
                                                        {record.status}
                                                    </td>
                                                </tr>
                                            )
                                        )
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

export default StudentAttendance;