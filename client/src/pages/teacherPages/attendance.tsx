import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import SearchBar from "../../components/searchBar";

import Pagination from "../../components/pagination";
import Limit from "../../components/limit";

import { useNavigate } from "react-router-dom";

import { getStudentsForAttendance, createAttendance } from "../../services/teacherApi";

import TeacherAttendanceTable from "../../components/attendanceTable";

import { useState, useEffect } from "react";

import Breadcrumb from "../../components/breadcrumb";

type Student = {
    _id: string;
    userId: {
        name: string;
        uid: string;
    };
    class: string;
    rollNumber: string;
};

type Attendance = {
    [studentId: string]: "Present" | "Absent";
};

function TeacherAttendance() {

    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [studentsData, setStudentsData] = useState<Student[]>([]);

    const [date, setDate] = useState(
        new Date().toISOString().split("T")[0]
    );

    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const fetchStudents = async () => {
        try {
            const students = await getStudentsForAttendance();
            console.log("Students response:", students.data);
            setStudentsData(students.data);
        }
        catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        fetchStudents();
    }, []);

    const [attendance, setAttendance] = useState<Attendance>(() => {
        const savedAttendance = localStorage.getItem(
            `attendance-${date}`
        );

        return savedAttendance
            ? JSON.parse(savedAttendance)
            : {};
    });

    useEffect(() => {
        const savedAttendance = localStorage.getItem(
            `attendance-${date}`
        );

        if (savedAttendance) {
            setAttendance(JSON.parse(savedAttendance));
        } else {
            setAttendance({});
        }
    }, [date]);

    useEffect(() => {
        localStorage.setItem(
            `attendance-${date}`,
            JSON.stringify(attendance)
        );
    }, [attendance, date]);

    let processedStudents = [...studentsData];

    if (search.trim() !== "") {
        processedStudents = processedStudents.filter(
            (student) =>
                student.userId.name
                    .toLowerCase()
                    .includes(search.toLowerCase()) ||
                student.userId.uid
                    .toLowerCase()
                    .includes(search.toLowerCase())
        );
    }

    const totalPages = Math.ceil(processedStudents.length / limit);

    const startIndex = (currentPage - 1) * limit;
    const endIndex = startIndex + limit;

    const currentStudents = processedStudents.slice(
        startIndex,
        endIndex
    );

    const handleSubmitAttendance = async () => {

        const allStudentsMarked = studentsData.every(
            (student) => attendance[student._id]
        );

        if (!allStudentsMarked) {
            alert("Please mark attendance for all students before submitting.");
            return;
        }

        try {

            const attendanceData = {
                date,
                attendance: studentsData.map((student) => ({
                    studentId: student._id,
                    status: attendance[student._id]
                }))
            };

            await createAttendance(attendanceData);
            localStorage.removeItem(`attendance-${date}`);

            alert("Attendance submitted successfully.");

        } catch (error: any) {

            console.log(error);

            alert(
                error.response?.data?.message ||
                "Failed to submit attendance"
            );
        }
    };

    const handleReset = () => {
        const confirmReset = window.confirm(
            "Are you sure you want to reset all attendance data?"
        );

        if (!confirmReset) {
            return;
        }

        Object.keys(localStorage).forEach((key) => {
            if (key.startsWith("attendance-")) {
                localStorage.removeItem(key);
            }
        });

        setAttendance({});
    };

    const markedCount = studentsData.filter(
        (student) => attendance[student._id]
    ).length;

    const handleMarkAllPresent = () => {
        const updatedAttendance: Attendance = {};

        studentsData.forEach((student) => {
            updatedAttendance[student._id] = "Present";
        });

        setAttendance(updatedAttendance);
    };

    const handleMarkAllAbsent = () => {
        const confirmAbsent = window.confirm(
            "Are you sure you want to mark all students as absent?"
        );

        if (!confirmAbsent) {
            return;
        }

        const updatedAttendance: Attendance = {};

        studentsData.forEach((student) => {
            updatedAttendance[student._id] = "Absent";
        });

        setAttendance(updatedAttendance);
    };

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
                            <button
                                type="button" onClick={() => navigate("viewAttendance")}
                                className="p-2 bg-purple-300 rounded-lg shadow-[0_2px_1px] hover:bg-violet-300 cursor-pointer"
                            >
                                View Attendance
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
                                    className="border-2 border-gray-500 rounded-sm p-2
                                focus:outline-none focus:border-gray-900
                                transition-colors duration-300 ease-in-out"
                                />
                            </div>
                            <SearchBar
                                search={search}
                                setSearch={setSearch}
                            />
                        </div>

                        <div className="flex justify-between">
                            <div>
                                <div className="text-lg">
                                    Class: <span className="font-medium">
                                        {studentsData[0]?.class || "-"}
                                    </span>
                                </div>

                                <div className="text-lg mb-5">
                                    Marked: <span className="font-medium">
                                        {markedCount}/{studentsData.length}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-3 self-start mt-1">
                                <button
                                    type="button"
                                    onClick={handleMarkAllPresent}
                                    className="p-2 bg-purple-300 rounded-lg shadow-[0_2px_1px] hover:bg-violet-300 cursor-pointer"
                                >
                                    Mark all present
                                </button>

                                <button
                                    type="button"
                                    onClick={handleMarkAllAbsent}
                                    className="p-2 bg-gray-200 rounded-lg
                            shadow-[0_2px_1px] hover:bg-red-200
                            cursor-pointer"
                                >Mark all absent</button>
                            </div>
                        </div>



                        <div className="flex flex-wrap gap-10">
                            <TeacherAttendanceTable
                                students={currentStudents}
                                attendance={attendance}
                                setAttendance={setAttendance}
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
                        <div className="flex justify-center gap-10 pt-3">
                            <button
                                type="button"
                                onClick={handleSubmitAttendance}
                                className="p-3 px-6 bg-purple-300 rounded-lg shadow-[0_2px_1px] hover:bg-violet-300 cursor-pointer"
                            >
                                Submit Attendance
                            </button>

                            <button
                                type="button"
                                onClick={handleReset}
                                className="p-3 px-6 bg-gray-200 rounded-lg
                            shadow-[0_2px_1px] hover:bg-red-200
                            cursor-pointer"
                            >Reset</button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default TeacherAttendance;