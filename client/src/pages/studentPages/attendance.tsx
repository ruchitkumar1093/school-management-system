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
    status: "Present" | "Absent";
};

type StudentInfo = {
    name: string;
    uid: string;
    class: string;
    rollNumber: string;
};

function StudentAttendance() {
    const [attendance, setAttendance] = useState<Attendance[]>([]);

    const [student, setStudent] = useState<StudentInfo | null>(null);

    const [currentPage, setCurrentPage] = useState(1);

    const [limit, setLimit] = useState(10);

    const fetchAttendance = async () => {
        try {
            const response = await getAttendance();

            setAttendance(response.data.attendance);
            setStudent(response.data.student);
        } catch (error) {
            console.log(error);
            setAttendance([]);
            setStudent(null);
        }
    };

    useEffect(() => {
        fetchAttendance();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [limit]);

    const presentCount = attendance.filter(
        (record) => record.status === "Present"
    ).length;

    const absentCount = attendance.filter(
        (record) => record.status === "Absent"
    ).length;

    const totalDays = attendance.length;

    const percentage =
        totalDays > 0
            ? ((presentCount / totalDays) * 100).toFixed(2)
            : "0.00";

    const totalPages = Math.ceil(
        attendance.length / limit
    );

    const startIndex = (currentPage - 1) * limit;

    const endIndex = startIndex + limit;

    const currentAttendance = attendance.slice(
        startIndex,
        endIndex
    );

    return (
        <div className="flex flex-col min-h-screen font-fredoka">
            <NavBar />

            <div className="flex flex-1 bg-purple-100">
                <SideBar />
                <div>
                    <Breadcrumb />
                    <div className="flex flex-col pt-12 pl-20 mb-10">
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-3xl">
                                Attendance:
                            </h1>
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
                                        Attendance:
                                        <span className="font-medium ml-1">
                                            {percentage}%
                                        </span>
                                    </div>
                                </div>
                            </>
                        )}

                        <table className="border-collapse border border-gray-400 bg-purple-200">
                            <thead>
                                <tr className="bg-purple-300">
                                    <th className="border border-gray-400 p-3 font-medium">
                                        S.No.
                                    </th>

                                    <th className="border border-gray-400 p-3 font-medium">
                                        Date
                                    </th>

                                    <th className="border border-gray-400 p-3 font-medium">
                                        Attendance
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {currentAttendance.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={3}
                                            className="border border-gray-400 p-3 text-center text-gray-600"
                                        >
                                            No attendance records found
                                        </td>
                                    </tr>
                                ) : (
                                    currentAttendance.map(
                                        (record, index) => (
                                            <tr key={record._id}>
                                                <td className="border border-gray-400 p-3">
                                                    {startIndex + index + 1}
                                                </td>

                                                <td className="border border-gray-400 p-3">
                                                    {new Date(
                                                        record.date
                                                    ).toLocaleDateString(
                                                        "en-GB"
                                                    )}
                                                </td>

                                                <td
                                                    className={`border border-gray-400 p-3 text-center ${record.status === "Present"
                                                            ? "text-emerald-600"
                                                            : "text-rose-600"
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

                        <div className="flex justify-between mt-5 mb-5 items-center">
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