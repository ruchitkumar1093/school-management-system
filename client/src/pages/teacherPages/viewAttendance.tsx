import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import SearchBar from "../../components/searchBar";
import Pagination from "../../components/pagination";
import Limit from "../../components/limit";
import { useNavigate } from "react-router-dom";
import Breadcrumb from "../../components/breadcrumb";
import {
    getAttendance,
    getAttendanceStudents,
    getStudentAttendance
} from "../../services/teacherApi";
import TeacherViewAttendanceTable from "../../components/viewAttendanceTable";
import { useState, useEffect } from "react";

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

function TeacherViewAttendance() {
    const navigate = useNavigate();

    const [viewMode, setViewMode] =
        useState<"date" | "student">("date");

    const [search, setSearch] =
        useState("");

    const [debouncedSearch, setDebouncedSearch] =
        useState("");

    const [attendanceData, setAttendanceData] =
        useState<Attendance[]>([]);

    const [students, setStudents] =
        useState<Student[]>([]);

    const [selectedStudent, setSelectedStudent] =
        useState("");

    const [studentAttendance, setStudentAttendance] =
        useState<Attendance[]>([]);

    const [date, setDate] = useState(
        new Date().toISOString().split("T")[0]
    );

    const [currentPage, setCurrentPage] =
        useState(1);

    const [limit, setLimit] =
        useState(10);

    const [dateWiseTotalPages, setDateWiseTotalPages] =
        useState(1);

    const [presentCount, setPresentCount] =
        useState(0);

    const [absentCount, setAbsentCount] =
        useState(0);

    const [leaveCount, setLeaveCount] =
        useState(0);

    const [studentWiseTotalPages, setStudentWiseTotalPages] =
        useState(1);

    const [studentPresentCount, setStudentPresentCount] =
        useState(0);

    const [studentAbsentCount, setStudentAbsentCount] =
        useState(0);

    const [studentLeaveCount, setStudentLeaveCount] =
        useState(0);

    const [studentTotalDays, setStudentTotalDays] =
        useState(0);

    const [studentPercentage, setStudentPercentage] =
        useState("0.00");

    const fetchAttendance = async () => {
        try {
            const response =
                await getAttendance(
                    date,
                    debouncedSearch,
                    currentPage,
                    limit
                );

            setAttendanceData(
                response.data.attendance
            );

            setDateWiseTotalPages(
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
        }
        catch (error) {
            console.log(error);

            setAttendanceData([]);

            setDateWiseTotalPages(1);

            setPresentCount(0);

            setAbsentCount(0);

            setLeaveCount(0);
        }
    };

    const fetchStudents = async () => {
        try {
            const response =
                await getAttendanceStudents();

            setStudents(
                response.data
            );
        }
        catch (error) {
            console.log(error);

            setStudents([]);
        }
    };

    const fetchStudentAttendance = async (
        studentId: string
    ) => {
        try {
            const response =
                await getStudentAttendance(
                    studentId,
                    currentPage,
                    limit
                );

            setStudentAttendance(
                response.data.attendance
            );

            setStudentWiseTotalPages(
                response.data.totalPages
            );

            setStudentPresentCount(
                response.data.presentCount
            );

            setStudentAbsentCount(
                response.data.absentCount
            );

            setStudentLeaveCount(
                response.data.leaveCount
            );

            setStudentTotalDays(
                response.data.totalDays
            );

            setStudentPercentage(
                response.data.percentage
            );
        }
        catch (error) {
            console.log(error);

            setStudentAttendance([]);

            setStudentWiseTotalPages(1);

            setStudentPresentCount(0);

            setStudentAbsentCount(0);

            setStudentLeaveCount(0);

            setStudentTotalDays(0);

            setStudentPercentage("0.00");
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
        if (viewMode === "date") {
            fetchAttendance();
        }
    }, [
        date,
        debouncedSearch,
        currentPage,
        limit,
        viewMode
    ]);

    useEffect(() => {
        fetchStudents();
    }, []);

    useEffect(() => {
        if (
            viewMode === "student" &&
            selectedStudent
        ) {
            fetchStudentAttendance(
                selectedStudent
            );
        }
        else {
            setStudentAttendance([]);
        }
    }, [
        selectedStudent,
        currentPage,
        limit,
        viewMode
    ]);

    useEffect(() => {
        setCurrentPage(1);
    }, [
        debouncedSearch,
        limit,
        date
    ]);

    const className =
        attendanceData[0]?.studentId.class ||
        students[0]?.class ||
        "-";

    const selectedStudentData =
        students.find(
            (student) =>
                student._id === selectedStudent
        );

    const dateWiseStartIndex =
        (currentPage - 1) * limit;

    const studentWiseStartIndex =
        (currentPage - 1) * limit;

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
                                onClick={() =>
                                    navigate(-1)
                                }
                                className="rounded-lg bg-purple-300 px-3 py-3 font-medium text-purple-950 shadow-[0_2px_3px] transition-colors hover:bg-violet-300 cursor-pointer"
                            >
                                Mark Attendance
                            </button>
                        </div>

                        {viewMode === "date" && (
                            <>
                                <div className="flex justify-between items-center mb-5">
                                    <div className="flex items-center gap-4">
                                        <label
                                            htmlFor="date"
                                            className="text-lg"
                                        >
                                            Date:
                                        </label>

                                        <input
                                            max={
                                                new Date()
                                                    .toISOString()
                                                    .split("T")[0]
                                            }
                                            type="date"
                                            id="date"
                                            value={date}
                                            onChange={(e) => {
                                                setDate(
                                                    e.target.value
                                                );

                                                setCurrentPage(
                                                    1
                                                );
                                            }}
                                            className="border-2 border-gray-500 rounded-sm p-2 focus:outline-none focus:border-gray-900 transition-colors duration-300 ease-in-out"
                                        />
                                    </div>

                                    <SearchBar
                                        search={search}
                                        setSearch={setSearch}
                                    />
                                </div>

                                <div className="flex gap-5 items-center justify-between mb-5">
                                    <div className="flex gap-5">
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

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setViewMode(
                                                "student"
                                            );

                                            setSearch("");

                                            setDebouncedSearch("");

                                            setCurrentPage(
                                                1
                                            );
                                        }}
                                        className="rounded-lg bg-purple-300 px-3 py-3 font-medium text-purple-950 shadow-[0_2px_3px] transition-colors hover:bg-violet-300 cursor-pointer"
                                    >
                                        View Student Wise
                                    </button>
                                </div>

                                <div className="flex flex-wrap gap-10">
                                    <TeacherViewAttendanceTable
                                        attendance={
                                            attendanceData
                                        }
                                        startIndex={
                                            dateWiseStartIndex
                                        }
                                    />
                                </div>

                                <div className="flex justify-between mt-5 mb-5 items-center">
                                    <div className="mt-1">
                                        <Pagination
                                            currentPage={
                                                currentPage
                                            }
                                            totalPages={
                                                dateWiseTotalPages
                                            }
                                            setCurrentPage={
                                                setCurrentPage
                                            }
                                        />
                                    </div>

                                    <Limit
                                        setLimit={
                                            setLimit
                                        }
                                        limit={
                                            limit
                                        }
                                    />
                                </div>
                            </>
                        )}

                        {viewMode === "student" && (
                            <>
                                <div className="flex justify-between items-center gap-4 mb-6">
                                    <div>
                                        <div className="flex gap-2 items-center">
                                            <label
                                                htmlFor="student"
                                                className="text-lg"
                                            >
                                                Student:
                                            </label>

                                            <select
                                                id="student"
                                                value={
                                                    selectedStudent
                                                }
                                                onChange={(e) => {
                                                    setSelectedStudent(
                                                        e.target.value
                                                    );

                                                    setCurrentPage(
                                                        1
                                                    );
                                                }}
                                                className="border-2 border-gray-500 rounded-sm p-2 focus:outline-none focus:border-gray-900"
                                            >
                                                <option value="">
                                                    Select Student
                                                </option>

                                                {students.map(
                                                    (student) => (
                                                        <option
                                                            key={
                                                                student._id
                                                            }
                                                            value={
                                                                student._id
                                                            }
                                                        >
                                                            {
                                                                student.userId.name
                                                            }
                                                            {" - "}
                                                            {
                                                                student.userId.uid.toUpperCase()
                                                            }
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setViewMode(
                                                "date"
                                            );

                                            setSearch("");

                                            setDebouncedSearch("");

                                            setCurrentPage(
                                                1
                                            );
                                        }}
                                        className="rounded-lg bg-purple-300 px-3 py-3 font-medium text-purple-950 shadow-[0_2px_3px] transition-colors hover:bg-violet-300 cursor-pointer"
                                    >
                                        View Date Wise
                                    </button>
                                </div>

                                {selectedStudent &&
                                    selectedStudentData && (
                                    <>
                                        <div className="flex gap-8 mb-2">
                                            <div>
                                                Student:

                                                <span className="font-medium ml-1">
                                                    {
                                                        selectedStudentData
                                                            .userId.name
                                                    }
                                                </span>
                                            </div>

                                            <div>
                                                UID:

                                                <span className="font-medium ml-1">
                                                    {
                                                        selectedStudentData
                                                            .userId.uid
                                                            .toUpperCase()
                                                    }
                                                </span>
                                            </div>

                                            <div>
                                                Class:

                                                <span className="font-medium ml-1">
                                                    {
                                                        selectedStudentData
                                                            .class
                                                    }
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex gap-8 mb-5">
                                            <div>
                                                Total Days:

                                                <span className="font-medium ml-1">
                                                    {
                                                        studentTotalDays
                                                    }
                                                </span>
                                            </div>

                                            <div>
                                                Present:

                                                <span className="font-medium ml-1">
                                                    {
                                                        studentPresentCount
                                                    }
                                                </span>
                                            </div>

                                            <div>
                                                Absent:

                                                <span className="font-medium ml-1">
                                                    {
                                                        studentAbsentCount
                                                    }
                                                </span>
                                            </div>

                                            <div>
                                                Leave:

                                                <span className="font-medium ml-1">
                                                    {
                                                        studentLeaveCount
                                                    }
                                                </span>
                                            </div>

                                            <div>
                                                Attendance:

                                                <span className="font-medium ml-1">
                                                    {
                                                        studentPercentage
                                                    }%
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-10">
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
                                                                (
                                                                    record,
                                                                    index
                                                                ) => (
                                                                    <tr
                                                                        key={
                                                                            record._id
                                                                        }
                                                                        className="border-b border-purple-300 last:border-b-0 transition-colors hover:bg-purple-300/40"
                                                                    >
                                                                        <td className="border-r border-purple-300 p-3 font-medium">
                                                                            {
                                                                                studentWiseStartIndex +
                                                                                index +
                                                                                1
                                                                            }
                                                                        </td>

                                                                        <td className="border-r border-purple-300 p-3">
                                                                            {
                                                                                new Date(
                                                                                    record.date
                                                                                ).toLocaleDateString(
                                                                                    "en-GB"
                                                                                )
                                                                            }
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
                                        </div>

                                        <div className="flex justify-between mt-5 mb-5 items-center">
                                            <div className="mt-1">
                                                <Pagination
                                                    currentPage={
                                                        currentPage
                                                    }
                                                    totalPages={
                                                        studentWiseTotalPages
                                                    }
                                                    setCurrentPage={
                                                        setCurrentPage
                                                    }
                                                />
                                            </div>

                                            <Limit
                                                setLimit={
                                                    setLimit
                                                }
                                                limit={
                                                    limit
                                                }
                                            />
                                        </div>
                                    </>
                                )}

                                {!selectedStudent && (
                                    <div className="text-lg text-gray-600">
                                        Please select a student to view attendance.
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TeacherViewAttendance;