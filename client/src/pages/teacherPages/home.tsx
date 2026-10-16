import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import { useEffect, useState } from "react";
import { viewHome } from "../../services/teacherApi";
import Breadcrumb from "../../components/breadcrumb";
import { useNavigate } from "react-router-dom";
import {
    FiUsers,
    FiCalendar,
    FiBarChart2,
    FiBookOpen,
    FiChevronRight
} from "react-icons/fi";


type HomeInfo = {
    employeeID: string;
    department: string;
    classAssigned: string;
    students: number;
    subjects: number;
    isClassTeacher: boolean;
    temporaryArrangement?: {
        class: string;
        department: string;
    } | null;
};

function TeacherHome() {

    const navigate = useNavigate();

    const [homeInfo, setHomeInfo] = useState<HomeInfo | null>(null);

    const user = JSON.parse(
        localStorage.getItem("user") || "{}"
    );

    const fetchHome = async () => {
        try {
            const response = await viewHome();
            setHomeInfo(response.data);
        }
        catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        fetchHome();
    }, []);

    return (
        <div className="flex min-h-screen flex-col font-fredoka">

            <NavBar />

            <div className="flex flex-1 bg-purple-100">

                <SideBar />

                <div className="flex-1">

                    <Breadcrumb />

                    <div className="flex flex-col px-20 pt-12 pb-16">

                        {/* Welcome */}
                        <div className="mb-10">
                            <div className="flex items-center gap-4">
                                <h1 className="text-3xl font-medium text-gray-900">
                                    Welcome, {user.name}
                                </h1>

                                {homeInfo?.isClassTeacher && (
                                    <span className="rounded-full bg-purple-200 px-3 py-1 text-sm font-medium text-purple-800">
                                        Class Teacher
                                    </span>
                                )}
                            </div>

                            <p className="mt-2 text-gray-500">
                                Here's an overview of your teaching information.
                            </p>


                            {homeInfo?.temporaryArrangement && (
                                <div className="mt-6 flex items-start gap-4 rounded-xl border border-amber-300 bg-amber-50 p-5 shadow-sm">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                                        <FiCalendar size={22} />
                                    </div>

                                    <div>
                                        <h2 className="text-lg font-semibold text-amber-900">
                                            Temporary Teaching Assignment
                                        </h2>

                                        <p className="mt-1 text-sm leading-6 text-amber-800">
                                            You have been temporarily assigned to cover{" "}
                                            <strong>
                                                Class {homeInfo.temporaryArrangement.class}
                                            </strong>{" "}
                                            for{" "}
                                            <strong>
                                                {homeInfo.temporaryArrangement.department}
                                            </strong>.
                                            This assignment will remain in place until a permanent
                                            replacement is appointed.
                                        </p>
                                    </div>
                                </div>
                            )}

                        </div>


                        {/* Basic Information Cards */}
                        <div className="mb-10 grid grid-cols-5 gap-5">

                            {/* Employee ID */}
                            <div className="rounded-xl bg-purple-200 p-5 shadow-md">
                                <p className="mb-2 text-sm font-medium text-gray-500">
                                    Employee ID
                                </p>

                                <p className="text-2xl font-medium text-gray-900">
                                    {homeInfo?.employeeID}
                                </p>
                            </div>


                            {/* UID */}
                            <div className="rounded-xl bg-purple-200 p-5 shadow-md">
                                <p className="mb-2 text-sm font-medium text-gray-500">
                                    UID
                                </p>

                                <p className="text-2xl font-medium text-gray-900">
                                    {user.uid.toUpperCase()}
                                </p>
                            </div>


                            {/* Department */}
                            <div className="rounded-xl bg-purple-200 p-5 shadow-md">
                                <p className="mb-2 text-sm font-medium text-gray-500">
                                    Department
                                </p>

                                <p className="text-2xl font-medium text-gray-900">
                                    {homeInfo?.department}
                                </p>
                            </div>


                            {/* Class Assigned */}
                            <div className="rounded-xl bg-purple-200 p-5 shadow-md">
                                <p className="mb-2 text-sm font-medium text-gray-500">
                                    Class Assigned
                                </p>

                                <p className="text-2xl font-medium text-gray-900">
                                    {homeInfo?.classAssigned}
                                </p>
                            </div>


                            {/* Role */}
                            <div className="rounded-xl bg-purple-200 p-5 shadow-md">
                                <p className="mb-2 text-sm font-medium text-gray-500">
                                    Role
                                </p>

                                <p className="text-2xl font-medium text-gray-900 capitalize">
                                    {user.role}
                                </p>
                            </div>

                        </div>


                        {/* Quick Navigation + My Profile */}
                        <div className="mb-10 grid grid-cols-2 gap-8">

                            {/* Quick Navigation */}
                            <div className="rounded-xl bg-purple-200 p-7 shadow-md">

                                <div className="mb-10">
                                    <h2 className="text-2xl font-medium text-gray-900">
                                        Quick Navigation
                                    </h2>

                                    <p className="mt-1 text-sm text-gray-500">
                                        Quickly access frequently used sections
                                    </p>
                                </div>


                                <div className="grid grid-cols-2 gap-3">

                                    {/* Students */}
                                    <button
                                        onClick={() =>
                                            navigate("viewStudents")
                                        }
                                        className="group flex items-center justify-between
                                        rounded-lg border border-purple-300 bg-purple-100
                                        px-4 py-4 text-left transition-all duration-200
                                        hover:bg-purple-50 hover:shadow-sm"
                                    >
                                        <div className="flex items-center gap-3">

                                            <div className="flex h-10 w-10 items-center justify-center
                                            rounded-lg bg-purple-200 text-gray-700">
                                                <FiUsers size={20} />
                                            </div>

                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    Students
                                                </p>

                                                <p className="text-xs text-gray-500">
                                                    View your students
                                                </p>
                                            </div>

                                        </div>

                                        <FiChevronRight
                                            className="text-gray-400 transition-transform
                                            duration-200 group-hover:translate-x-1"
                                            size={18}
                                        />

                                    </button>


                                    {/* Attendance */}
                                    <button
                                        onClick={() =>
                                            navigate("attendance")
                                        }
                                        className="group flex items-center justify-between
                                        rounded-lg border border-purple-300 bg-purple-100
                                        px-4 py-4 text-left transition-all duration-200
                                        hover:bg-purple-50 hover:shadow-sm"
                                    >
                                        <div className="flex items-center gap-3">

                                            <div className="flex h-10 w-10 items-center justify-center
                                            rounded-lg bg-purple-200 text-gray-700">
                                                <FiCalendar size={20} />
                                            </div>

                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    Attendance
                                                </p>

                                                <p className="text-xs text-gray-500">
                                                    Manage attendance
                                                </p>
                                            </div>

                                        </div>

                                        <FiChevronRight
                                            className="text-gray-400 transition-transform
                                            duration-200 group-hover:translate-x-1"
                                            size={18}
                                        />

                                    </button>


                                    {/* Marks */}
                                    <button
                                        onClick={() =>
                                            navigate("viewMarks")
                                        }
                                        className="group flex items-center justify-between
                                        rounded-lg border border-purple-300 bg-purple-100
                                        px-4 py-4 text-left transition-all duration-200
                                        hover:bg-purple-50 hover:shadow-sm"
                                    >
                                        <div className="flex items-center gap-3">

                                            <div className="flex h-10 w-10 items-center justify-center
                                            rounded-lg bg-purple-200 text-gray-700">
                                                <FiBarChart2 size={20} />
                                            </div>

                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    Marks
                                                </p>

                                                <p className="text-xs text-gray-500">
                                                    Manage student marks
                                                </p>
                                            </div>

                                        </div>

                                        <FiChevronRight
                                            className="text-gray-400 transition-transform
                                            duration-200 group-hover:translate-x-1"
                                            size={18}
                                        />

                                    </button>


                                    {/* Subjects */}
                                    <button
                                        onClick={() =>
                                            navigate("viewSubjects")
                                        }
                                        className="group flex items-center justify-between
                                        rounded-lg border border-purple-300 bg-purple-100
                                        px-4 py-4 text-left transition-all duration-200
                                        hover:bg-purple-50 hover:shadow-sm"
                                    >
                                        <div className="flex items-center gap-3">

                                            <div className="flex h-10 w-10 items-center justify-center
                                            rounded-lg bg-purple-200 text-gray-700">
                                                <FiBookOpen size={20} />
                                            </div>

                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    Subjects
                                                </p>

                                                <p className="text-xs text-gray-500">
                                                    View your subjects
                                                </p>
                                            </div>

                                        </div>

                                        <FiChevronRight
                                            className="text-gray-400 transition-transform
                                            duration-200 group-hover:translate-x-1"
                                            size={18}
                                        />

                                    </button>

                                </div>

                            </div>


                            {/* My Profile */}
                            <div className="rounded-xl bg-purple-200 p-7 shadow-md">

                                <div className="mb-6">
                                    <h2 className="text-2xl font-medium text-gray-900">
                                        My Profile
                                    </h2>

                                    <p className="mt-1 text-sm text-gray-500">
                                        Your account information
                                    </p>
                                </div>


                                <div className="flex flex-col gap-5">

                                    {/* Name */}
                                    <div className="flex items-center justify-between
                                    border-b border-purple-300 pb-4">

                                        <span className="text-gray-500">
                                            Name
                                        </span>

                                        <span className="text-lg font-medium text-gray-900">
                                            {user.name}
                                        </span>

                                    </div>


                                    {/* UID */}
                                    <div className="flex items-center justify-between
                                    border-b border-purple-300 pb-4">

                                        <span className="text-gray-500">
                                            UID
                                        </span>

                                        <span className="text-lg font-medium text-gray-900">
                                            {user.uid.toUpperCase()}
                                        </span>

                                    </div>


                                    {/* Department */}
                                    <div className="flex items-center justify-between">

                                        <span className="text-gray-500">
                                            Department
                                        </span>

                                        <span className="text-lg font-medium text-gray-900">
                                            {homeInfo?.department}
                                        </span>

                                    </div>

                                </div>


                                <button
                                    className="mt-7 rounded-lg bg-gray-800 px-5 py-2.5
                                    text-sm font-medium text-white transition-colors
                                    duration-200 hover:bg-gray-700"
                                    onClick={() => navigate("profile")}
                                >
                                    View Profile
                                </button>

                            </div>

                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

export default TeacherHome;