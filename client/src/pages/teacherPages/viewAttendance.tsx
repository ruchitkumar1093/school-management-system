import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import SearchBar from "../../components/searchBar";

import Pagination from "../../components/pagination";
import Limit from "../../components/limit";

import { useNavigate } from "react-router-dom";

import Breadcrumb from "../../components/breadcrumb";

import {
    getAttendance,
    getStudentsForAttendance,
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
    status: "Present" | "Absent";
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

    const [viewMode, setViewMode] = useState<"date" | "student">("date");

    const [search, setSearch] = useState("");

    const [attendanceData, setAttendanceData] = useState<Attendance[]>([]);

    const [students, setStudents] = useState<Student[]>([]);

    const [selectedStudent, setSelectedStudent] = useState("");

    const [studentAttendance, setStudentAttendance] = useState<Attendance[]>([]);

    const [date, setDate] = useState(
        new Date().toISOString().split("T")[0]
    );

    const [currentPage, setCurrentPage] = useState(1);

    const [limit, setLimit] = useState(10);

    const fetchAttendance = async () => {

        try {

            const attendance = await getAttendance(date);

            console.log(
                "Attendance response:",
                attendance.data
            );

            setAttendanceData(attendance.data);

        }
        catch (error) {

            console.log(error);

            setAttendanceData([]);

        }

    };

    const fetchStudents = async () => {

        try {

            const studentsResponse =
                await getStudentsForAttendance();

            console.log(
                "Students response:",
                studentsResponse.data
            );

            setStudents(studentsResponse.data);

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

            const attendance =
                await getStudentAttendance(studentId);

            console.log(
                "Student attendance response:",
                attendance.data
            );

            setStudentAttendance(attendance.data);

        }
        catch (error) {

            console.log(error);

            setStudentAttendance([]);

        }

    };

    useEffect(() => {

        fetchAttendance();

    }, [date]);

    useEffect(() => {

        fetchStudents();

    }, []);

    useEffect(() => {

        if (selectedStudent) {

            fetchStudentAttendance(selectedStudent);

        }
        else {

            setStudentAttendance([]);

        }

    }, [selectedStudent]);

    useEffect(() => {

        setCurrentPage(1);

    }, [search, limit]);

    let processedAttendance = [...attendanceData];

    if (search.trim() !== "") {

        processedAttendance =
            processedAttendance.filter(
                (record) =>
                    record.studentId.userId.name
                        .toLowerCase()
                        .includes(search.toLowerCase()) ||

                    record.studentId.userId.uid
                        .toLowerCase()
                        .includes(search.toLowerCase())
            );

    }

    const dateWiseTotalPages = Math.ceil(
        processedAttendance.length / limit
    );

    const dateWiseStartIndex =
        (currentPage - 1) * limit;

    const dateWiseEndIndex =
        dateWiseStartIndex + limit;

    const currentAttendance =
        processedAttendance.slice(
            dateWiseStartIndex,
            dateWiseEndIndex
        );

    const presentCount =
        attendanceData.filter(
            (record) => record.status === "Present"
        ).length;


    const absentCount =
        attendanceData.filter(
            (record) => record.status === "Absent"
        ).length;


    const className =
        attendanceData[0]?.studentId.class || "-";

    const studentPresentCount =
        studentAttendance.filter(
            (record) => record.status === "Present"
        ).length;


    const studentAbsentCount =
        studentAttendance.filter(
            (record) => record.status === "Absent"
        ).length;


    const studentTotalDays =
        studentAttendance.length;


    const studentPercentage =
        studentTotalDays > 0
            ? (
                (studentPresentCount / studentTotalDays) * 100
            ).toFixed(2)
            : "0.00";

    const studentWiseTotalPages = Math.ceil(
        studentAttendance.length / limit
    );

    const studentWiseStartIndex =
        (currentPage - 1) * limit;

    const studentWiseEndIndex =
        studentWiseStartIndex + limit;

    const currentStudentAttendance =
        studentAttendance.slice(
            studentWiseStartIndex,
            studentWiseEndIndex
        );

    const selectedStudentData =
        students.find(
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

                        <div className="flex gap-3 justify-between items-center mb-6">

                            <h1 className="text-3xl">
                                View Attendance:
                            </h1>


                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="p-2 bg-purple-300 rounded-lg
                            shadow-[0_2px_1px]
                            hover:bg-violet-300
                            cursor-pointer"
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
                                            type="date"
                                            id="date"
                                            value={date}
                                            onChange={(e) => {

                                                setDate(e.target.value);

                                                setCurrentPage(1);

                                            }}
                                            className="border-2 border-gray-500
                                        rounded-sm p-2
                                        focus:outline-none
                                        focus:border-gray-900
                                        transition-colors
                                        duration-300
                                        ease-in-out"
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

                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setViewMode("student");
                                            setSearch("");
                                            setCurrentPage(1);
                                        }}
                                        className="p-2 bg-purple-300 rounded-lg
    shadow-[0_2px_1px]
    hover:bg-violet-300
    cursor-pointer"
                                    >
                                        View Student Wise
                                    </button>

                                </div>

                                <div className="flex flex-wrap gap-10">

                                    <TeacherViewAttendanceTable
                                        attendance={currentAttendance}
                                        startIndex={dateWiseStartIndex}
                                    />

                                </div>

                                <div className="flex justify-between mt-5 mb-5 items-center">

                                    <div className="mt-1">

                                        <Pagination
                                            currentPage={currentPage}
                                            totalPages={dateWiseTotalPages}
                                            setCurrentPage={setCurrentPage}
                                        />

                                    </div>


                                    <Limit
                                        setLimit={setLimit}
                                        limit={limit}
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
                                                value={selectedStudent}
                                                onChange={(e) => {

                                                    setSelectedStudent(
                                                        e.target.value
                                                    );

                                                    setCurrentPage(1);

                                                }}
                                                className="border-2 border-gray-500
                                    rounded-sm p-2
                                    focus:outline-none
                                    focus:border-gray-900"
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



                                    <button
                                        type="button"
                                        onClick={() => {
                                            setViewMode("date");
                                            setSearch("");
                                            setCurrentPage(1);
                                        }}
                                        className="p-2 bg-purple-300 rounded-lg
    shadow-[0_2px_1px]
    hover:bg-violet-300
    cursor-pointer"
                                    >
                                        View Date Wise
                                    </button>

                                </div>

                                {selectedStudent && selectedStudentData && (

                                    <>

                                        <div className="flex gap-8 mb-2">

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
                                                Attendance:

                                                <span className="font-medium ml-1">
                                                    {studentPercentage}%
                                                </span>
                                            </div>

                                        </div>

                                        <div className="flex flex-wrap gap-10">

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

                                                    {currentStudentAttendance.length === 0 ? (

                                                        <tr>

                                                            <td
                                                                colSpan={3}
                                                                className="border border-gray-400 p-3 text-center text-gray-600"
                                                            >
                                                                No attendance records found
                                                            </td>

                                                        </tr>

                                                    ) : (

                                                        currentStudentAttendance.map(
                                                            (record, index) => (

                                                                <tr key={record._id}>

                                                                    <td className="border border-gray-400 p-3">
                                                                        {studentWiseStartIndex + index + 1}
                                                                    </td>


                                                                    <td className="border border-gray-400 p-3">
                                                                        {new Date(
                                                                            record.date
                                                                        ).toLocaleDateString(
                                                                            "en-GB"
                                                                        )}
                                                                    </td>


                                                                    <td
                                                                        className={`border border-gray-400 p-3 ${record.status === "Present"
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

                                        </div>

                                        <div className="flex justify-between mt-5 mb-5 items-center">

                                            <div className="mt-1">

                                                <Pagination
                                                    currentPage={currentPage}
                                                    totalPages={studentWiseTotalPages}
                                                    setCurrentPage={setCurrentPage}
                                                />

                                            </div>


                                            <Limit
                                                setLimit={setLimit}
                                                limit={limit}
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