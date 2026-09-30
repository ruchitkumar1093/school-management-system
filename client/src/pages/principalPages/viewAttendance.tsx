import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import SearchBar from "../../components/searchBar";
import Pagination from "../../components/pagination";
import Limit from "../../components/limit";
import { useNavigate } from "react-router-dom";
import Breadcrumb from "../../components/breadcrumb";

import {
    getAttendance,
    getAttendanceSummary,
    getStudentsForAttendance,
    getStudentAttendance
} from "../../services/principalApi";

import { useState, useEffect } from "react";

type Summary = {
    class: string;
    present: number;
    absent: number;
    percentage: number;
};

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
    status: "Present" | "Absent" | "Leave";
};

type Student = {
    _id: string;
    userId: {
        name: string;
        uid: string;
    };
    class: string;
    rollNumber: string;
};

type StudentClass =
    | "1st"
    | "2nd"
    | "3rd"
    | "4th"
    | "5th"
    | "6th"
    | "7th"
    | "8th"
    | "9th"
    | "10th"
    | "11th"
    | "12th";

function PrincipalAttendance() {
    const navigate = useNavigate();

    const [viewMode, setViewMode] = useState<"date" | "student">("date");

    const [selectedClass, setSelectedClass] = useState<StudentClass>("1st");

    const [selectedDate, setSelectedDate] = useState(
        new Date().toISOString().split("T")[0]
    );

    const [summaryData, setSummaryData] = useState<Summary[]>([]);

    const [attendance, setAttendance] = useState<Attendance[]>([]);

    const [students, setStudents] = useState<Student[]>([]);

    const [selectedStudent, setSelectedStudent] = useState("");

    const [studentAttendance, setStudentAttendance] = useState<Attendance[]>([]);

    const [studentStats, setStudentStats] = useState({
        presentCount: 0,
        absentCount: 0,
        leaveCount: 0,
        totalDays: 0
    });

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const [totalPages, setTotalPages] = useState(1);
    const [studentAttendanceTotalPages, setStudentAttendanceTotalPages] = useState(1);

    const classes: StudentClass[] = [
        "1st",
        "2nd",
        "3rd",
        "4th",
        "5th",
        "6th",
        "7th",
        "8th",
        "9th",
        "10th",
        "11th",
        "12th"
    ];

    const fetchAttendanceSummary = async () => {
        try {
            const response = await getAttendanceSummary(selectedDate);

            setSummaryData(response.data);
        }
        catch (error) {
            console.log(error);
            setSummaryData([]);
        }
    };

    const fetchAttendance = async () => {
        try {
            const response = await getAttendance(
                selectedClass,
                selectedDate,
                debouncedSearch,
                currentPage,
                limit
            );

            setAttendance(response.data.attendance);
            setTotalPages(response.data.totalPages);
        }
        catch (error) {
            console.log(error);
            setAttendance([]);
            setTotalPages(1);
        }
    };

    const fetchStudents = async () => {
        try {
            const response = await getStudentsForAttendance(selectedClass);

            setStudents(response.data);
        }
        catch (error) {
            console.log(error);
            setStudents([]);
        }
    };

    const fetchStudentAttendance = async (studentId: string) => {
        try {
            const response = await getStudentAttendance(
                studentId,
                currentPage,
                limit
            );

            setStudentAttendance(response.data.attendance);
            setStudentAttendanceTotalPages(response.data.totalPages);

            setStudentStats({
                presentCount: response.data.presentCount,
                absentCount: response.data.absentCount,
                leaveCount: response.data.leaveCount,
                totalDays: response.data.totalDays
            });
        }
        catch (error) {
            console.log(error);
            setStudentAttendance([]);
            setStudentAttendanceTotalPages(1);

            setStudentStats({
                presentCount: 0,
                absentCount: 0,
                leaveCount: 0,
                totalDays: 0
            });
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
        fetchAttendanceSummary();
    }, [selectedDate]);

    useEffect(() => {
        fetchStudents();

        setSelectedStudent("");
        setStudentAttendance([]);
        setSearch("");
        setDebouncedSearch("");
        setCurrentPage(1);
        setStudentAttendanceTotalPages(1);

        setStudentStats({
            presentCount: 0,
            absentCount: 0,
            leaveCount: 0,
            totalDays: 0
        });
    }, [selectedClass, selectedDate]);

    useEffect(() => {
        if (viewMode === "date") {
            fetchAttendance();
        }
    }, [
        selectedClass,
        selectedDate,
        debouncedSearch,
        currentPage,
        limit,
        viewMode
    ]);

    useEffect(() => {
        if (viewMode === "student" && selectedStudent) {
            fetchStudentAttendance(selectedStudent);
        }
        else if (viewMode === "student") {
            setStudentAttendance([]);
            setStudentAttendanceTotalPages(1);

            setStudentStats({
                presentCount: 0,
                absentCount: 0,
                leaveCount: 0,
                totalDays: 0
            });
        }
    }, [selectedStudent, currentPage, limit, viewMode]);

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch, limit]);

    const selectedClassSummary = summaryData.find(
        (summary) => summary.class === selectedClass
    );

    const studentPresentCount = studentStats.presentCount;
    const studentAbsentCount = studentStats.absentCount;
    const studentLeaveCount = studentStats.leaveCount;
    const studentTotalDays = studentStats.totalDays;

    const studentPercentage =
        studentTotalDays > 0
            ? ((studentPresentCount / studentTotalDays) * 100).toFixed(2)
            : "0.00";

    const startIndex = (currentPage - 1) * limit;

    const selectedStudentData = students.find(
        (student) => student._id === selectedStudent
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
                                onClick={() => navigate(-1)}
                                className="rounded-lg bg-purple-300 px-3 py-3 font-medium text-purple-950 shadow-[0_2px_3px] transition-colors hover:bg-violet-300 cursor-pointer"
                            >
                                View Summary
                            </button>

                            {viewMode === "date" ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setViewMode("student");
                                        setSearch("");
                                        setDebouncedSearch("");
                                        setCurrentPage(1);
                                    }}
                                    className="rounded-lg bg-purple-300 px-3 py-3 font-medium text-purple-950 shadow-[0_2px_3px] transition-colors hover:bg-violet-300 cursor-pointer"
                                >
                                    View Student Wise
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setViewMode("date");
                                        setSearch("");
                                        setDebouncedSearch("");
                                        setCurrentPage(1);
                                    }}
                                    className="rounded-lg bg-purple-300 px-3 py-3 font-medium text-purple-950 shadow-[0_2px_3px] transition-colors hover:bg-violet-300 cursor-pointer"
                                >
                                    View Date Wise
                                </button>
                            )}
                        </div>

                        {viewMode === "date" && (
                            <>
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center gap-4">
                                        <label
                                            htmlFor="class"
                                            className="text-lg"
                                        >
                                            Class:
                                        </label>

                                        <select
                                            id="class"
                                            value={selectedClass}
                                            onChange={(e) => {
                                                setSelectedClass(
                                                    e.target.value as StudentClass
                                                );
                                                setCurrentPage(1);
                                            }}
                                            className="border-2 border-gray-500 rounded-sm p-2 focus:outline-none focus:border-gray-900"
                                        >
                                            {classes.map((studentClass) => (
                                                <option
                                                    key={studentClass}
                                                    value={studentClass}
                                                >
                                                    {studentClass}
                                                </option>
                                            ))}
                                        </select>

                                        <label
                                            htmlFor="date"
                                            className="text-lg ml-4"
                                        >
                                            Date:
                                        </label>

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

                                        <SearchBar
                                            search={search}
                                            setSearch={setSearch}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-8 mb-5">
                                    <div>
                                        Class:
                                        <span className="font-medium ml-1">
                                            {selectedClass}
                                        </span>
                                    </div>

                                    <div>
                                        Present:
                                        <span className="font-medium ml-1">
                                            {selectedClassSummary?.present ?? 0}
                                        </span>
                                    </div>

                                    <div>
                                        Absent:
                                        <span className="font-medium ml-1">
                                            {selectedClassSummary?.absent ?? 0}
                                        </span>
                                    </div>

                                    <div>
                                        Attendance:
                                        <span className="font-medium ml-1">
                                            {selectedClassSummary
                                                ? `${selectedClassSummary.percentage.toFixed(2)}%`
                                                : "0.00%"}
                                        </span>
                                    </div>
                                </div>

                                <div className="overflow-x-auto rounded-lg shadow-md">
                                    <table className="w-full border-collapse bg-purple-200 text-left text-gray-900">
                                        <thead>
                                            <tr className="border-b border-purple-300 bg-purple-300/80">
                                                <th className="border-r border-purple-300 p-3 font-semibold text-purple-950">
                                                    S.No.
                                                </th>

                                                <th className="border-r border-purple-300 p-3 font-semibold text-purple-950">
                                                    Student Name:
                                                </th>

                                                <th className="border-r border-purple-300 p-3 font-semibold text-purple-950">
                                                    UID:
                                                </th>

                                                <th className="p-3 font-semibold text-purple-950">
                                                    Attendance:
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {attendance.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={4}
                                                        className="p-4 text-center text-gray-500"
                                                    >
                                                        No attendance records found
                                                    </td>
                                                </tr>
                                            ) : (
                                                attendance.map(
                                                    (record, index) => (
                                                        <tr
                                                            key={record._id}
                                                            className="border-b border-purple-300 last:border-b-0 transition-colors hover:bg-purple-300/40"
                                                        >
                                                            <td className="border-r border-purple-300 p-3 font-medium">
                                                                {startIndex + index + 1}
                                                            </td>

                                                            <td className="border-r border-purple-300 p-3 font-medium">
                                                                {record.studentId.userId.name}
                                                            </td>

                                                            <td className="border-r border-purple-300 p-3">
                                                                {record.studentId.userId.uid.toUpperCase()}
                                                            </td>

                                                            <td
                                                                className={`p-3 text-center font-medium ${
                                                                    record.status === "Present"
                                                                        ? "text-emerald-600"
                                                                        : record.status === "Leave"
                                                                        ? "text-amber-600"
                                                                        : "text-red-600"
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
                            </>
                        )}

                        {viewMode === "student" && (
                            <>
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center gap-4">
                                        <label
                                            htmlFor="studentClass"
                                            className="text-lg"
                                        >
                                            Class:
                                        </label>

                                        <select
                                            id="studentClass"
                                            value={selectedClass}
                                            onChange={(e) => {
                                                setSelectedClass(
                                                    e.target.value as StudentClass
                                                );
                                                setSelectedStudent("");
                                                setCurrentPage(1);
                                            }}
                                            className="border-2 border-gray-500 rounded-sm p-2 focus:outline-none focus:border-gray-900"
                                        >
                                            {classes.map((studentClass) => (
                                                <option
                                                    key={studentClass}
                                                    value={studentClass}
                                                >
                                                    {studentClass}
                                                </option>
                                            ))}
                                        </select>

                                        <label
                                            htmlFor="student"
                                            className="text-lg ml-4"
                                        >
                                            Student:
                                        </label>

                                        <select
                                            id="student"
                                            value={selectedStudent}
                                            onChange={(e) => {
                                                setSelectedStudent(e.target.value);
                                                setCurrentPage(1);
                                            }}
                                            className="border-2 border-gray-500 rounded-sm p-2 focus:outline-none focus:border-gray-900"
                                        >
                                            <option value="">
                                                Select Student
                                            </option>

                                            {students.map((student) => (
                                                <option
                                                    key={student._id}
                                                    value={student._id}
                                                >
                                                    {student.userId.name}
                                                    {" - "}
                                                    {student.userId.uid.toUpperCase()}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {!selectedStudent && (
                                    <div className="text-gray-600">
                                        Please select a student to view attendance.
                                    </div>
                                )}

                                {selectedStudent && selectedStudentData && (
                                    <>
                                        <div className="flex gap-8 mb-5">
                                            <div>
                                                Student:
                                                <span className="font-medium ml-1">
                                                    {selectedStudentData.userId.name}
                                                </span>
                                            </div>

                                            <div>
                                                UID:
                                                <span className="font-medium ml-1">
                                                    {selectedStudentData.userId.uid.toUpperCase()}
                                                </span>
                                            </div>

                                            <div>
                                                Class:
                                                <span className="font-medium ml-1">
                                                    {selectedStudentData.class}
                                                </span>
                                            </div>

                                            <div>
                                                Roll Number:
                                                <span className="font-medium ml-1">
                                                    {selectedStudentData.rollNumber}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex gap-8 mb-5">
                                            <div>
                                                Total Days:
                                                <span className="font-medium ml-1">
                                                    {studentTotalDays}
                                                </span>
                                            </div>

                                            <div>
                                                Present:
                                                <span className="font-medium ml-1">
                                                    {studentPresentCount}
                                                </span>
                                            </div>

                                            <div>
                                                Absent:
                                                <span className="font-medium ml-1">
                                                    {studentAbsentCount}
                                                </span>
                                            </div>

                                            <div>
                                                Leave:
                                                <span className="font-medium ml-1">
                                                    {studentLeaveCount}
                                                </span>
                                            </div>

                                            <div>
                                                Attendance:
                                                <span className="font-medium ml-1">
                                                    {studentPercentage}%
                                                </span>
                                            </div>
                                        </div>

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
                                                    {studentAttendance.length === 0 ? (
                                                        <tr>
                                                            <td
                                                                colSpan={3}
                                                                className="p-4 text-center text-gray-500"
                                                            >
                                                                No attendance records found
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        studentAttendance.map(
                                                            (record, index) => (
                                                                <tr
                                                                    key={record._id}
                                                                    className="border-b border-purple-300 last:border-b-0 transition-colors hover:bg-purple-300/40"
                                                                >
                                                                    <td className="border-r border-purple-300 p-3 font-medium">
                                                                        {startIndex + index + 1}
                                                                    </td>

                                                                    <td className="border-r border-purple-300 p-3">
                                                                        {new Date(
                                                                            record.date
                                                                        ).toLocaleDateString(
                                                                            "en-GB"
                                                                        )}
                                                                    </td>

                                                                    <td
                                                                        className={`p-3 font-medium ${
                                                                            record.status === "Present"
                                                                                ? "text-emerald-600"
                                                                                : record.status === "Leave"
                                                                                ? "text-amber-600"
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
                                        </div>

                                        <div className="flex justify-between mt-5 mb-5 items-center">
                                            <Pagination
                                                currentPage={currentPage}
                                                totalPages={studentAttendanceTotalPages}
                                                setCurrentPage={setCurrentPage}
                                            />

                                            <Limit
                                                setLimit={setLimit}
                                                limit={limit}
                                            />
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PrincipalAttendance;