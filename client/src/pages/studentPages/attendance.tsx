import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import Pagination from "../../components/pagination";
import Limit from "../../components/limit";
import Breadcrumb from "../../components/breadcrumb";
import { getAttendance } from "../../services/studentApi";
import { useState, useEffect } from "react";

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
                                    View your Attendance
                                </p>
                            </div>
                        </div>

                        {student && (
                            <>
                                <div className="flex gap-8 mb-5">
                                    <div>
                                        Student:

                                        <span className="font-medium ml-1">
                                            {student.name}
                                        </span>
                                    </div>

                                    <div>
                                        UID:

                                        <span className="font-medium ml-1">
                                            {student.uid.toUpperCase()}
                                        </span>
                                    </div>

                                    <div>
                                        Class:

                                        <span className="font-medium ml-1">
                                            {student.class}
                                        </span>
                                    </div>

                                    <div>
                                        Roll Number:

                                        <span className="font-medium ml-1">
                                            {student.rollNumber}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-8 mb-5">
                                    <div>
                                        Total Days:

                                        <span className="font-medium ml-1">
                                            {totalDays}
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
                                        Attendance:

                                        <span className="font-medium ml-1">
                                            {percentage.toFixed(2)}%
                                        </span>
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="overflow-x-auto rounded-lg shadow-md">
                            <table className="w-full border-collapse bg-purple-200 text-left text-gray-900">
                                <thead>
                                    <tr className="border-b border-purple-300 bg-purple-300/80">
                                        <th className="border-r border-purple-300 p-3 font-semibold text-purple-950">
                                            S.No.
                                        </th>

                                        <th className="border-r border-purple-300 p-3 font-semibold text-purple-950">
                                            Date
                                        </th>

                                        <th className="p-3 font-semibold text-purple-950">
                                            Attendance
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {attendance.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={3}
                                                className="p-4 text-center text-gray-500"
                                            >
                                                No attendance records found
                                            </td>
                                        </tr>
                                    ) : (
                                        attendance.map(
                                            (record, index) => (
                                                <tr
                                                    key={
                                                        record._id
                                                    }
                                                    className="border-b border-purple-300 last:border-b-0 transition-colors hover:bg-purple-300/40"
                                                >
                                                    <td className="border-r border-purple-300 p-3 font-medium">
                                                        {startIndex +
                                                            index +
                                                            1}
                                                    </td>

                                                    <td className="border-r border-purple-300 p-3">
                                                        {new Date(
                                                            record.date
                                                        ).toLocaleDateString(
                                                            "en-GB"
                                                        )}
                                                    </td>

                                                    <td
                                                        className={`p-3 text-center font-medium ${
                                                            record.status ===
                                                            "Present"
                                                                ? "text-emerald-600"
                                                                : record.status ===
                                                                  "Absent"
                                                                ? "text-red-600"
                                                                : "text-amber-600"
                                                        }`}
                                                    >
                                                        {
                                                            record.status
                                                        }
                                                    </td>
                                                </tr>
                                            )
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-between mt-5 mb-5 items-center">
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