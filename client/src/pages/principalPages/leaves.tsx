import { useEffect, useState } from "react";
import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import Breadcrumb from "../../components/breadcrumb";
import ClassFilter from "../../components/classFilter";
import Pagination from "../../components/pagination";
import Limit from "../../components/limit";
import {
    getLeaveApplications,
    approveLeave,
    rejectLeave,
    getTeacherLeaveApplications,
    approveTeacherLeave,
    rejectTeacherLeave
} from "../../services/principalApi";

type LeaveStatus = "Pending" | "Approved" | "Rejected";

type LeaveType = "student" | "teacher";

type StudentLeaveApplication = {
    _id: string;
    student: {
        _id: string;
        name: string;
        uid: string;
        class: string;
    };
    startDate: string;
    endDate: string;
    reason: string;
    status: LeaveStatus;
};

type TeacherLeaveApplication = {
    _id: string;
    teacher: {
        _id: string;
        name: string;
        uid: string;
        employeeID: string;
        department: string;
        classAssigned: string;
    };
    startDate: string;
    endDate: string;
    reason: string;
    status: LeaveStatus;
};

function LeaveApplications() {
    const [leaveType, setLeaveType] = useState<LeaveType>("student");
    const [activeView, setActiveView] = useState<"pending" | "applications">("pending");

    const [classFilter, setClassFilter] = useState("All");
    const [departmentFilter, setDepartmentFilter] = useState("All");

    const [studentApplications, setStudentApplications] = useState<StudentLeaveApplication[]>([]);
    const [teacherApplications, setTeacherApplications] = useState<TeacherLeaveApplication[]>([]);

    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(5);
    const [totalPages, setTotalPages] = useState(1);

    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    async function fetchApplications() {
        try {
            setLoading(true);

            const status = activeView === "pending" ? "Pending" : "All";

            if (leaveType === "student") {
                const response = await getLeaveApplications(
                    status,
                    classFilter,
                    currentPage,
                    limit
                );

                setStudentApplications(response.data.leaves);
                setTotalPages(response.data.totalPages);
            } else {
                const response = await getTeacherLeaveApplications(
                    status,
                    departmentFilter,
                    currentPage,
                    limit
                );

                setTeacherApplications(response.data.leaves);
                setTotalPages(response.data.totalPages);
            }
        } catch (error) {
            console.error("Failed to fetch leave applications:", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchApplications();
    }, [
        leaveType,
        activeView,
        classFilter,
        departmentFilter,
        currentPage,
        limit
    ]);

    useEffect(() => {
        setCurrentPage(1);
    }, [
        leaveType,
        activeView,
        classFilter,
        departmentFilter,
        limit
    ]);

    function formatDate(date: string) {
        return new Date(date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    }

    async function handleApprove(id: string) {
        try {
            setActionLoading(id);

            if (leaveType === "student") {
                await approveLeave(id);
            } else {
                await approveTeacherLeave(id);
            }

            await fetchApplications();
        } catch (error) {
            console.error("Failed to approve leave application:", error);
        } finally {
            setActionLoading(null);
        }
    }

    async function handleReject(id: string) {
        try {
            setActionLoading(id);

            if (leaveType === "student") {
                await rejectLeave(id);
            } else {
                await rejectTeacherLeave(id);
            }

            await fetchApplications();
        } catch (error) {
            console.error("Failed to reject leave application:", error);
        } finally {
            setActionLoading(null);
        }
    }

    const startIndex = (currentPage - 1) * limit;

    return (
        <div className="flex min-h-screen flex-col font-fredoka">
            <NavBar />
            <div className="flex flex-1 bg-purple-100">
                <SideBar />
                <div className="flex min-w-0 flex-1 flex-col">
                    <Breadcrumb />
                    <div className="flex flex-1 flex-col px-16 pt-10 pb-12">
                        <div className="mb-7">
                            <h1 className="text-3xl font-medium text-gray-900">
                                Leave Applications
                            </h1>
                            <p className="mt-1 text-sm text-gray-600">
                                Review and manage student and teacher leave applications
                            </p>
                        </div>

                        <div className="mb-7 flex items-center gap-6 border-b border-purple-300">
                            <button
                                type="button"
                                onClick={() => setLeaveType("student")}
                                className={`cursor-pointer border-b-2 px-1 pb-2 text-sm font-medium transition-colors ${
                                    leaveType === "student"
                                        ? "border-purple-800 text-purple-800"
                                        : "border-transparent text-gray-600 hover:text-purple-800"
                                }`}
                            >
                                Student Leaves
                            </button>

                            <button
                                type="button"
                                onClick={() => setLeaveType("teacher")}
                                className={`cursor-pointer border-b-2 px-1 pb-2 text-sm font-medium transition-colors ${
                                    leaveType === "teacher"
                                        ? "border-purple-800 text-purple-800"
                                        : "border-transparent text-gray-600 hover:text-purple-800"
                                }`}
                            >
                                Teacher Leaves
                            </button>
                        </div>

                        <div className="mb-7 flex items-end gap-6">
                            <div className="w-fit rounded-xl bg-purple-200 p-1.5 shadow-sm">
                                <div className="flex gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setActiveView("pending")}
                                        className={`cursor-pointer rounded-lg px-7 py-3 text-base font-medium transition-all ${
                                            activeView === "pending"
                                                ? "bg-purple-800 text-white shadow-md"
                                                : "text-gray-700 hover:bg-purple-300"
                                        }`}
                                    >
                                        Pending Applications
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setActiveView("applications")}
                                        className={`cursor-pointer rounded-lg px-7 py-3 text-base font-medium transition-all ${
                                            activeView === "applications"
                                                ? "bg-purple-800 text-white shadow-md"
                                                : "text-gray-700 hover:bg-purple-300"
                                        }`}
                                    >
                                        All Applications
                                    </button>
                                </div>
                            </div>

                            {leaveType === "student" ? (
                                <ClassFilter
                                    classFilter={classFilter}
                                    setClassFilter={setClassFilter}
                                />
                            ) : (
                                <select
                                    value={departmentFilter}
                                    onChange={(event) => setDepartmentFilter(event.target.value)}
                                    className="cursor-pointer rounded-lg border-2 border-purple-300 bg-purple-200 px-4 py-2.5 text-sm font-medium text-gray-700 outline-none focus:border-purple-800"
                                >
                                    <option value="All">All Departments</option>
                                    <option value="Science">Science</option>
                                    <option value="Mathematics">Mathematics</option>
                                    <option value="English">English</option>
                                    <option value="Social Science">Social Science</option>
                                    <option value="Hindi">Hindi</option>
                                </select>
                            )}
                        </div>

                        <div className="w-full">
                            <h2 className="mb-4 text-xl font-medium text-gray-900">
                                {leaveType === "student"
                                    ? activeView === "pending"
                                        ? "Pending Student Leave Applications"
                                        : "All Student Leave Applications"
                                    : activeView === "pending"
                                        ? "Pending Teacher Leave Applications"
                                        : "All Teacher Leave Applications"}
                            </h2>

                            <div className="overflow-hidden rounded-2xl bg-purple-200 shadow-sm">
                                <div className="overflow-x-auto">
                                    {leaveType === "student" ? (
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="border-b border-white bg-purple-300">
                                                    <th className="px-5 py-4 text-left text-base font-medium text-gray-700">S.No.</th>
                                                    <th className="px-5 py-4 text-left text-base font-medium text-gray-700">Student</th>
                                                    <th className="px-5 py-4 text-left text-base font-medium text-gray-700">UID</th>
                                                    <th className="px-5 py-4 text-left text-base font-medium text-gray-700">Class</th>
                                                    <th className="px-5 py-4 text-left text-base font-medium text-gray-700">Start Date</th>
                                                    <th className="px-5 py-4 text-left text-base font-medium text-gray-700">End Date</th>
                                                    <th className="px-5 py-4 text-left text-base font-medium text-gray-700">Reason</th>
                                                    <th className="px-5 py-4 text-left text-base font-medium text-gray-700">Status</th>
                                                    <th className="px-5 py-4 text-left text-base font-medium text-gray-700">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {loading ? (
                                                    <tr>
                                                        <td colSpan={9} className="px-5 py-10 text-center text-base text-gray-500">
                                                            Loading leave applications...
                                                        </td>
                                                    </tr>
                                                ) : studentApplications.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={9} className="px-5 py-10 text-center text-base text-gray-500">
                                                            {activeView === "pending"
                                                                ? "No pending student leave applications found"
                                                                : "No student leave applications found"}
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    studentApplications.map((application, index) => (
                                                        <tr key={application._id} className="border-b border-white">
                                                            <td className="px-5 py-4 text-base text-gray-600">{startIndex + index + 1}</td>
                                                            <td className="px-5 py-4 text-base text-gray-600">{application.student.name}</td>
                                                            <td className="px-5 py-4 text-base text-gray-600 uppercase">{application.student.uid}</td>
                                                            <td className="px-5 py-4 text-base text-gray-600">{application.student.class}</td>
                                                            <td className="px-5 py-4 text-base text-gray-600">{formatDate(application.startDate)}</td>
                                                            <td className="px-5 py-4 text-base text-gray-600">{formatDate(application.endDate)}</td>
                                                            <td className="max-w-xs px-5 py-4 text-base text-gray-600">{application.reason}</td>
                                                            <td className="px-5 py-4">
                                                                <span className={`rounded-full px-3 py-1 text-sm font-medium ${
                                                                    application.status === "Approved"
                                                                        ? "bg-green-100 text-green-700"
                                                                        : application.status === "Rejected"
                                                                            ? "bg-red-100 text-red-700"
                                                                            : "bg-yellow-100 text-yellow-700"
                                                                }`}>
                                                                    {application.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                {application.status === "Pending" ? (
                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            type="button"
                                                                            disabled={actionLoading === application._id}
                                                                            onClick={() => handleApprove(application._id)}
                                                                            className="cursor-pointer rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                                                                        >
                                                                            {actionLoading === application._id ? "..." : "Approve"}
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            disabled={actionLoading === application._id}
                                                                            onClick={() => handleReject(application._id)}
                                                                            className="cursor-pointer rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                                                                        >
                                                                            {actionLoading === application._id ? "..." : "Reject"}
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-sm text-gray-500">No action needed</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="border-b border-white bg-purple-300">
                                                    <th className="px-5 py-4 text-left text-base font-medium text-gray-700">S.No.</th>
                                                    <th className="px-5 py-4 text-left text-base font-medium text-gray-700">Teacher</th>
                                                    <th className="px-5 py-4 text-left text-base font-medium text-gray-700">UID</th>
                                                    <th className="px-5 py-4 text-left text-base font-medium text-gray-700">Employee ID</th>
                                                    <th className="px-5 py-4 text-left text-base font-medium text-gray-700">Department</th>
                                                    <th className="px-5 py-4 text-left text-base font-medium text-gray-700">Class</th>
                                                    <th className="px-5 py-4 text-left text-base font-medium text-gray-700">Start Date</th>
                                                    <th className="px-5 py-4 text-left text-base font-medium text-gray-700">End Date</th>
                                                    <th className="px-5 py-4 text-left text-base font-medium text-gray-700">Reason</th>
                                                    <th className="px-5 py-4 text-left text-base font-medium text-gray-700">Status</th>
                                                    <th className="px-5 py-4 text-left text-base font-medium text-gray-700">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {loading ? (
                                                    <tr>
                                                        <td colSpan={11} className="px-5 py-10 text-center text-base text-gray-500">
                                                            Loading leave applications...
                                                        </td>
                                                    </tr>
                                                ) : teacherApplications.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={11} className="px-5 py-10 text-center text-base text-gray-500">
                                                            {activeView === "pending"
                                                                ? "No pending teacher leave applications found"
                                                                : "No teacher leave applications found"}
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    teacherApplications.map((application, index) => (
                                                        <tr key={application._id} className="border-b border-white">
                                                            <td className="px-5 py-4 text-base text-gray-600">{startIndex + index + 1}</td>
                                                            <td className="px-5 py-4 text-base text-gray-600">{application.teacher.name}</td>
                                                            <td className="px-5 py-4 text-base text-gray-600 uppercase">{application.teacher.uid}</td>
                                                            <td className="px-5 py-4 text-base text-gray-600">{application.teacher.employeeID}</td>
                                                            <td className="px-5 py-4 text-base text-gray-600">{application.teacher.department}</td>
                                                            <td className="px-5 py-4 text-base text-gray-600">{application.teacher.classAssigned}</td>
                                                            <td className="px-5 py-4 text-base text-gray-600">{formatDate(application.startDate)}</td>
                                                            <td className="px-5 py-4 text-base text-gray-600">{formatDate(application.endDate)}</td>
                                                            <td className="max-w-xs px-5 py-4 text-base text-gray-600">{application.reason}</td>
                                                            <td className="px-5 py-4">
                                                                <span className={`rounded-full px-3 py-1 text-sm font-medium ${
                                                                    application.status === "Approved"
                                                                        ? "bg-green-100 text-green-700"
                                                                        : application.status === "Rejected"
                                                                            ? "bg-red-100 text-red-700"
                                                                            : "bg-yellow-100 text-yellow-700"
                                                                }`}>
                                                                    {application.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                {application.status === "Pending" ? (
                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            type="button"
                                                                            disabled={actionLoading === application._id}
                                                                            onClick={() => handleApprove(application._id)}
                                                                            className="cursor-pointer rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                                                                        >
                                                                            {actionLoading === application._id ? "..." : "Approve"}
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            disabled={actionLoading === application._id}
                                                                            onClick={() => handleReject(application._id)}
                                                                            className="cursor-pointer rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                                                                        >
                                                                            {actionLoading === application._id ? "..." : "Reject"}
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-sm text-gray-500">No action needed</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 flex items-center justify-between">
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
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LeaveApplications;