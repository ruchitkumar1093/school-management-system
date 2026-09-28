import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import Breadcrumb from "../../components/breadcrumb";
import { useNavigate } from "react-router-dom";
import { viewHome } from "../../services/studentApi";
import { useEffect, useState } from "react";
import {
    FiBookOpen,
    FiCalendar,
    FiBarChart2,
    FiUser,
    FiChevronRight
} from "react-icons/fi";

type HomeInfo = {
    class: string;
    rollNumber: number;
    attendancePercentage: number;
    totalSubjects: number;
};

function StudentHome() {

    const navigate = useNavigate();

    const [homeInfo, setHomeInfo] = useState<HomeInfo | null>(null);

    const user = JSON.parse(
        localStorage.getItem("user") || "{}"
    );

    useEffect(() => {
        const fetchHome = async () => {
            try {
                const response = await viewHome();
                setHomeInfo(response.data);
            }
            catch (error) {
                console.log(error);
            }
        };
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
                            <h1 className="text-3xl font-medium text-gray-900">
                                Welcome, {user.name}
                            </h1>

                            <p className="mt-2 text-gray-500">
                                Here's an overview of your academic information.
                            </p>
                        </div>


                        {/* Basic Information Cards */}
                        <div className="mb-10 grid grid-cols-4 gap-5">

                            {/* Class */}
                            <div className="rounded-xl bg-purple-200 p-5 shadow-md">
                                <p className="mb-2 text-sm font-medium text-gray-500">
                                    Class
                                </p>

                                <p className="text-2xl font-medium text-gray-900">
                                    {homeInfo?.class}
                                </p>
                            </div>


                            {/* Roll Number */}
                            <div className="rounded-xl bg-purple-200 p-5 shadow-md">
                                <p className="mb-2 text-sm font-medium text-gray-500">
                                    Roll Number
                                </p>

                                <p className="text-2xl font-medium text-gray-900">
                                    {homeInfo?.rollNumber}
                                </p>
                            </div>


                            {/* Attendance */}
                            <div className="rounded-xl bg-purple-200 p-5 shadow-md">
                                <p className="mb-2 text-sm font-medium text-gray-500">
                                    Attendance
                                </p>

                                <p className="text-2xl font-medium text-gray-900">
                                    {homeInfo?.attendancePercentage}%
                                </p>
                            </div>


                            {/* Subjects */}
                            <div className="rounded-xl bg-purple-200 p-5 shadow-md">
                                <p className="mb-2 text-sm font-medium text-gray-500">
                                    Subjects
                                </p>

                                <p className="text-2xl font-medium text-gray-900">
                                    {homeInfo?.totalSubjects}
                                </p>
                            </div>

                        </div>


                        {/* Quick Navigation + My Profile */}
                        <div className="grid grid-cols-2 gap-8">

                            {/* Quick Navigation */}
                            <div className="rounded-xl bg-purple-200 p-7 shadow-md">

                                <div className="mb-10">
                                    <h2 className="text-2xl font-medium text-gray-900">
                                        Quick Navigation
                                    </h2>

                                    <p className="mt-1 text-sm text-gray-500">
                                        Quickly access your academic information
                                    </p>
                                </div>


                                <div className="grid grid-cols-2 gap-3">

                                    {/* Marks */}
                                    <button
                                        className="group flex items-center justify-between
                                        rounded-lg border border-purple-300 bg-purple-100
                                        px-4 py-4 text-left transition-all duration-200
                                        hover:bg-purple-50 hover:shadow-sm"
                                        onClick={() => navigate("viewMarks")}
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
                                                    View your marks
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
                                        className="group flex items-center justify-between
                                        rounded-lg border border-purple-300 bg-purple-100
                                        px-4 py-4 text-left transition-all duration-200
                                        hover:bg-purple-50 hover:shadow-sm"
                                        onClick={() => navigate("attendance")}
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
                                                    View attendance
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
                                        className="group flex items-center justify-between
                                        rounded-lg border border-purple-300 bg-purple-100
                                        px-4 py-4 text-left transition-all duration-200
                                        hover:bg-purple-50 hover:shadow-sm"
                                        onClick={() => navigate("viewSubjects   ")}
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


                                    {/* Profile */}
                                    <button
                                        className="group flex items-center justify-between
                                        rounded-lg border border-purple-300 bg-purple-100
                                        px-4 py-4 text-left transition-all duration-200
                                        hover:bg-purple-50 hover:shadow-sm"
                                        onClick={() => navigate("profile")}
                                    >
                                        <div className="flex items-center gap-3">

                                            <div className="flex h-10 w-10 items-center justify-center
                                            rounded-lg bg-purple-200 text-gray-700">
                                                <FiUser size={20} />
                                            </div>

                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    Profile
                                                </p>

                                                <p className="text-xs text-gray-500">
                                                    View your profile
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


                                    {/* Role */}
                                    <div className="flex items-center justify-between">

                                        <span className="text-gray-500">
                                            Role
                                        </span>

                                        <span className="text-lg font-medium text-gray-900 capitalize">
                                            {user.role}
                                        </span>

                                    </div>

                                </div>


                                <button
                                    className="mt-7 rounded-lg bg-gray-800 px-5 py-2.5
                                    text-sm font-medium text-white
                                    transition-colors duration-200
                                    hover:bg-gray-700"
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

export default StudentHome;