import { useCallback, useEffect, useState } from "react";
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
    rejectTeacherLeave,
} from "../../services/principalApi";

type LeaveStatus = "Pending" | "Approved" | "Rejected";
type LeaveType = "student" | "teacher";
type ActiveView = "pending" | "applications";

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
        classes: string[];
    };
    startDate: string;
    endDate: string;
    reason: string;
    status: LeaveStatus;
};

type LeaveResponse<T> = {
    leaves: T[];
    totalPages: number;
    totalLeaves?: number;
    classes?: string[];
};

function LeaveApplications() {
    const [leaveType, setLeaveType] = useState<LeaveType>("student");
    const [activeView, setActiveView] = useState<ActiveView>("pending");

    const [classFilter, setClassFilter] = useState("All");
    const [availableClasses, setAvailableClasses] = useState<string[]>([]);

    const [studentApplications, setStudentApplications] = useState<
        StudentLeaveApplication[]
    >([]);
    const [teacherApplications, setTeacherApplications] = useState<
        TeacherLeaveApplication[]
    >([]);

    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    const fetchApplications = useCallback(async () => {
        try {
            setLoading(true);
            setErrorMessage("");

            const status = activeView === "pending" ? "Pending" : "All";

            if (leaveType === "student") {
                const response = await getLeaveApplications(
                    status,
                    classFilter,
                    currentPage,
                    limit
                );

                const data: LeaveResponse<StudentLeaveApplication> =
                    response?.data ?? response;

                setStudentApplications(data.leaves ?? []);
                setTotalPages(Math.max(data.totalPages ?? 1, 1));

                if (data.classes) {
                    setAvailableClasses(data.classes);
                }
            } else {
                const response = await getTeacherLeaveApplications(
                    status,
                    classFilter,
                    currentPage,
                    limit
                );

                const data: LeaveResponse<TeacherLeaveApplication> =
                    response?.data ?? response;

                setTeacherApplications(data.leaves ?? []);
                setTotalPages(Math.max(data.totalPages ?? 1, 1));

                if (data.classes) {
                    setAvailableClasses(data.classes);
                }
            }
        } catch (error) {
            console.error("Failed to fetch leave applications:", error);
            setErrorMessage("Unable to load leave applications. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [leaveType, activeView, classFilter, currentPage, limit]);

    useEffect(() => {
        void fetchApplications();
    }, [fetchApplications]);

    // Reset pagination when the selected view or filters change.
    useEffect(() => {
        setCurrentPage(1);
    }, [leaveType, activeView, classFilter, limit]);

    function formatDate(date: string) {
        if (!date) return "—";

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return "—";
        }

        return parsedDate.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    }

    async function handleAction(id: string, action: "approve" | "reject") {
        try {
            setActionLoading(id);
            setErrorMessage("");

            if (leaveType === "student") {
                if (action === "approve") {
                    await approveLeave(id);
                } else {
                    await rejectLeave(id);
                }
            } else {
                if (action === "approve") {
                    await approveTeacherLeave(id);
                } else {
                    await rejectTeacherLeave(id);
                }
            }

            await fetchApplications();
        } catch (error) {
            console.error(`Failed to ${action} leave application:`, error);
            setErrorMessage(
                `Unable to ${action} the leave application. Please try again.`
            );
        } finally {
            setActionLoading(null);
        }
    }

    const startIndex = (currentPage - 1) * limit;

    function renderStatus(status: LeaveStatus) {
        const styles =
            status === "Approved"
                ? "bg-green-100 text-green-700"
                : status === "Rejected"
                  ? "bg-red-100 text-red-700"
                  : "bg-yellow-100 text-yellow-700";

        return (
            <span
                className={`rounded-full px-3 py-1 text-sm font-medium ${styles}`}
            >
                {status}
            </span>
        );
    }

    function renderActions(id: string, status: LeaveStatus) {
        if (status !== "Pending") {
            return <span className="text-sm text-gray-500">No action needed</span>;
        }

        const isBusy = actionLoading === id;

        return (
            <div className="flex gap-2">
                <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => void handleAction(id, "approve")}
                    className="cursor-pointer rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isBusy ? "..." : "Approve"}
                </button>

                <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => void handleAction(id, "reject")}
                    className="cursor-pointer rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isBusy ? "..." : "Reject"}
                </button>
            </div>
        );
    }

    const heading =
        leaveType === "student"
            ? activeView === "pending"
                ? "Pending Student Leave Applications"
                : "All Student Leave Applications"
            : activeView === "pending"
              ? "Pending Teacher Leave Applications"
              : "All Teacher Leave Applications";

    return (
        <div className="flex min-h-screen flex-col font-fredoka">
            <NavBar />

            <div className="flex flex-1 bg-purple-100">
                <SideBar />

                <div className="flex min-w-0 flex-1 flex-col">
                    <Breadcrumb />

                    <div className="flex flex-1 flex-col px-6 pb-12 pt-10 md:px-10 xl:px-16">
                        <div className="mb-7">
                            <h1 className="text-3xl font-medium text-gray-900">
                                Leave Applications
                            </h1>
                            <p className="mt-1 text-sm text-gray-600">
                                Review and manage student and teacher leave applications
                            </p>
                        </div>

                        {/* Student / teacher tabs */}
                        <div className="mb-7 flex items-center gap-6 border-b border-purple-300">
                            {(["student", "teacher"] as LeaveType[]).map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setLeaveType(type)}
                                    className={`cursor-pointer border-b-2 px-1 pb-2 text-sm font-medium transition-colors ${
                                        leaveType === type
                                            ? "border-purple-800 text-purple-800"
                                            : "border-transparent text-gray-600 hover:text-purple-800"
                                    }`}
                                >
                                    {type === "student" ? "Student Leaves" : "Teacher Leaves"}
                                </button>
                            ))}
                        </div>

                        {/* Pending / all applications and class filter */}
                        <div className="mb-7 flex flex-wrap items-end gap-4 md:gap-6">
                            <div className="w-fit rounded-xl bg-purple-200 p-1.5 shadow-sm">
                                <div className="flex flex-wrap gap-1.5">
                                    {(
                                        [
                                            ["pending", "Pending Applications"],
                                            ["applications", "All Applications"],
                                        ] as [ActiveView, string][]
                                    ).map(([view, label]) => (
                                        <button
                                            key={view}
                                            type="button"
                                            onClick={() => setActiveView(view)}
                                            className={`cursor-pointer rounded-lg px-4 py-3 text-sm font-medium transition-all md:px-7 md:text-base ${
                                                activeView === view
                                                    ? "bg-purple-800 text-white shadow-md"
                                                    : "text-gray-700 hover:bg-purple-300"
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <ClassFilter
                                classFilter={classFilter}
                                setClassFilter={setClassFilter}
                                classes={availableClasses}
                                showAll
                            />
                        </div>

                        <div className="w-full">
                            <h2 className="mb-4 text-xl font-medium text-gray-900">
                                {heading}
                            </h2>

                            {errorMessage && (
                                <div
                                    role="alert"
                                    className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                                >
                                    <span>{errorMessage}</span>
                                    <button
                                        type="button"
                                        onClick={() => void fetchApplications()}
                                        className="font-medium underline"
                                    >
                                        Retry
                                    </button>
                                </div>
                            )}

                            <div className="overflow-hidden rounded-2xl bg-purple-200 shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="border-b border-white bg-purple-300">
                                                <th className="px-5 py-4 text-left text-base font-medium text-gray-700">
                                                    S.No.
                                                </th>
                                                <th className="px-5 py-4 text-left text-base font-medium text-gray-700">
                                                    {leaveType === "student" ? "Student" : "Teacher"}
                                                </th>
                                                <th className="px-5 py-4 text-left text-base font-medium text-gray-700">
                                                    UID
                                                </th>

                                                {leaveType === "teacher" && (
                                                    <th className="px-5 py-4 text-left text-base font-medium text-gray-700">
                                                        Employee ID
                                                    </th>
                                                )}

                                                <th className="px-5 py-4 text-left text-base font-medium text-gray-700">
                                                    {leaveType === "student" ? "Class" : "Assigned Classes"}
                                                </th>
                                                <th className="px-5 py-4 text-left text-base font-medium text-gray-700">
                                                    Start Date
                                                </th>
                                                <th className="px-5 py-4 text-left text-base font-medium text-gray-700">
                                                    End Date
                                                </th>
                                                <th className="px-5 py-4 text-left text-base font-medium text-gray-700">
                                                    Reason
                                                </th>
                                                <th className="px-5 py-4 text-left text-base font-medium text-gray-700">
                                                    Status
                                                </th>
                                                <th className="px-5 py-4 text-left text-base font-medium text-gray-700">
                                                    Action
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {loading ? (
                                                <tr>
                                                    <td
                                                        colSpan={leaveType === "student" ? 9 : 10}
                                                        className="px-5 py-10 text-center text-base text-gray-500"
                                                    >
                                                        Loading leave applications...
                                                    </td>
                                                </tr>
                                            ) : leaveType === "student" &&
                                              studentApplications.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={9}
                                                        className="px-5 py-10 text-center text-base text-gray-500"
                                                    >
                                                        {activeView === "pending"
                                                            ? "No pending student leave applications found"
                                                            : "No student leave applications found"}
                                                    </td>
                                                </tr>
                                            ) : leaveType === "teacher" &&
                                              teacherApplications.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={10}
                                                        className="px-5 py-10 text-center text-base text-gray-500"
                                                    >
                                                        {activeView === "pending"
                                                            ? "No pending teacher leave applications found"
                                                            : "No teacher leave applications found"}
                                                    </td>
                                                </tr>
                                            ) : leaveType === "student" ? (
                                                studentApplications.map((application, index) => (
                                                    <tr
                                                        key={application._id}
                                                        className="border-b border-white"
                                                    >
                                                        <td className="px-5 py-4 text-base text-gray-600">
                                                            {startIndex + index + 1}
                                                        </td>
                                                        <td className="px-5 py-4 text-base text-gray-600">
                                                            {application.student?.name ?? "—"}
                                                        </td>
                                                        <td className="px-5 py-4 text-base uppercase text-gray-600">
                                                            {application.student?.uid ?? "—"}
                                                        </td>
                                                        <td className="px-5 py-4 text-base text-gray-600">
                                                            {application.student?.class ?? "—"}
                                                        </td>
                                                        <td className="px-5 py-4 text-base text-gray-600">
                                                            {formatDate(application.startDate)}
                                                        </td>
                                                        <td className="px-5 py-4 text-base text-gray-600">
                                                            {formatDate(application.endDate)}
                                                        </td>
                                                        <td className="max-w-xs whitespace-pre-wrap break-words px-5 py-4 text-base text-gray-600">
                                                            {application.reason || "—"}
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            {renderStatus(application.status)}
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            {renderActions(application._id, application.status)}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                teacherApplications.map((application, index) => (
                                                    <tr
                                                        key={application._id}
                                                        className="border-b border-white"
                                                    >
                                                        <td className="px-5 py-4 text-base text-gray-600">
                                                            {startIndex + index + 1}
                                                        </td>
                                                        <td className="px-5 py-4 text-base text-gray-600">
                                                            {application.teacher?.name ?? "—"}
                                                        </td>
                                                        <td className="px-5 py-4 text-base uppercase text-gray-600">
                                                            {application.teacher?.uid ?? "—"}
                                                        </td>
                                                        <td className="px-5 py-4 text-base text-gray-600">
                                                            {application.teacher?.employeeID ?? "—"}
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <div className="flex max-w-xs flex-wrap gap-1.5">
                                                                {application.teacher?.classes?.length ? (
                                                                    application.teacher.classes.map((className) => (
                                                                        <span
                                                                            key={className}
                                                                            className="rounded-md bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800"
                                                                        >
                                                                            {className}
                                                                        </span>
                                                                    ))
                                                                ) : (
                                                                    <span className="text-sm text-gray-500">
                                                                        No assigned classes
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-4 text-base text-gray-600">
                                                            {formatDate(application.startDate)}
                                                        </td>
                                                        <td className="px-5 py-4 text-base text-gray-600">
                                                            {formatDate(application.endDate)}
                                                        </td>
                                                        <td className="max-w-xs whitespace-pre-wrap break-words px-5 py-4 text-base text-gray-600">
                                                            {application.reason || "—"}
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            {renderStatus(application.status)}
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            {renderActions(application._id, application.status)}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                setCurrentPage={setCurrentPage}
                            />

                            <Limit setLimit={setLimit} limit={limit} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LeaveApplications;