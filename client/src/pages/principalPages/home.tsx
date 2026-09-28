import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import Breadcrumb from "../../components/breadcrumb";
import { viewHome } from "../../services/principalApi";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FiUsers,
    FiUserPlus,
    FiGrid,
    FiChevronRight
} from "react-icons/fi";

type HomeInfo = {
    totalStudents: number;
    totalTeachers: number;
    totalSubjects: number;
    totalClasses: number;
};

function PrincipalHome() {

    const [homeInfo, setHomeInfo] = useState<HomeInfo | null>(null);

    const navigate = useNavigate();

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
                            <h1 className="text-3xl font-medium text-gray-900">
                                Welcome, {user.name}
                            </h1>

                            <p className="mt-2 text-gray-500">
                                Here's an overview of your school's information.
                            </p>
                        </div>


                        {/* Basic Information Cards */}
                        <div className="mb-10 grid grid-cols-4 gap-5">

                            {/* Total Students */}
                            <div className="rounded-xl bg-purple-200 p-5 shadow-md">
                                <p className="mb-2 text-sm font-medium text-gray-500">
                                    Total Students
                                </p>

                                <p className="text-2xl font-medium text-gray-900">
                                    {homeInfo?.totalStudents}
                                </p>
                            </div>


                            {/* Total Teachers */}
                            <div className="rounded-xl bg-purple-200 p-5 shadow-md">
                                <p className="mb-2 text-sm font-medium text-gray-500">
                                    Total Teachers
                                </p>

                                <p className="text-2xl font-medium text-gray-900">
                                    {homeInfo?.totalTeachers}
                                </p>
                            </div>


                            {/* Total Subjects */}
                            <div className="rounded-xl bg-purple-200 p-5 shadow-md">
                                <p className="mb-2 text-sm font-medium text-gray-500">
                                    Total Subjects
                                </p>

                                <p className="text-2xl font-medium text-gray-900">
                                    {homeInfo?.totalSubjects}
                                </p>
                            </div>


                            {/* Total Classes */}
                            <div className="rounded-xl bg-purple-200 p-5 shadow-md">
                                <p className="mb-2 text-sm font-medium text-gray-500">
                                    Total Classes
                                </p>

                                <p className="text-2xl font-medium text-gray-900">
                                    {homeInfo?.totalClasses}
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
                                        Quickly access frequently used sections
                                    </p>
                                </div>


                                <div className="grid grid-cols-2 gap-3">

                                    {/* Teachers */}
                                    <button
                                        onClick={() =>
                                            navigate("viewTeachers")
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
                                                    Teachers
                                                </p>

                                                <p className="text-xs text-gray-500">
                                                    Manage teachers
                                                </p>
                                            </div>

                                        </div>

                                        <FiChevronRight
                                            className="text-gray-400 transition-transform
                                            duration-200 group-hover:translate-x-1"
                                            size={18}
                                        />
                                    </button>


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
                                                    Manage students
                                                </p>
                                            </div>

                                        </div>

                                        <FiChevronRight
                                            className="text-gray-400 transition-transform
                                            duration-200 group-hover:translate-x-1"
                                            size={18}
                                        />
                                    </button>


                                    {/* Admissions */}
                                    <button
                                        onClick={() =>
                                            navigate("admissionRequests")
                                        }
                                        className="group flex items-center justify-between
                                        rounded-lg border border-purple-300 bg-purple-100
                                        px-4 py-4 text-left transition-all duration-200
                                        hover:bg-purple-50 hover:shadow-sm"
                                    >
                                        <div className="flex items-center gap-3">

                                            <div className="flex h-10 w-10 items-center justify-center
                                            rounded-lg bg-purple-200 text-gray-700">
                                                <FiUserPlus size={20} />
                                            </div>

                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    Admissions
                                                </p>

                                                <p className="text-xs text-gray-500">
                                                    Review requests
                                                </p>
                                            </div>

                                        </div>

                                        <FiChevronRight
                                            className="text-gray-400 transition-transform
                                            duration-200 group-hover:translate-x-1"
                                            size={18}
                                        />
                                    </button>


                                    {/* Classes */}
                                    <button
                                        onClick={() =>
                                            navigate("viewClass")
                                        }
                                        className="group flex items-center justify-between
                                        rounded-lg border border-purple-300 bg-purple-100
                                        px-4 py-4 text-left transition-all duration-200
                                        hover:bg-purple-50 hover:shadow-sm"
                                    >
                                        <div className="flex items-center gap-3">

                                            <div className="flex h-10 w-10 items-center justify-center
                                            rounded-lg bg-purple-200 text-gray-700">
                                                <FiGrid size={20} />
                                            </div>

                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    Classes
                                                </p>

                                                <p className="text-xs text-gray-500">
                                                    View class overview
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
                                    onClick={() =>
                                        navigate("profile")
                                    }
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

export default PrincipalHome;