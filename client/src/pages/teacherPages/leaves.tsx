
import { useCallback, useEffect, useState } from "react";
import { FiLock } from "react-icons/fi";

import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import Breadcrumb from "../../components/breadcrumb";
import Pagination from "../../components/pagination";
import Limit from "../../components/limit";

import {
    getLeaveApplications,
    approveLeave,
    rejectLeave,
    getTeacherSubjects
} from "../../services/teacherApi";

type LeaveStatus = "Pending" | "Approved" | "Rejected";

type LeaveApplication = {
    _id: string;
    student: {
        _id: string;
        name: string;
        uid: string;
    };
    startDate: string;
    endDate: string;
    reason: string;
    status: LeaveStatus;
};

type TeacherSubject = {
    _id: string;
    name: string;
    subjectCode: string;
    class: string;
};

function LeaveApplications() {
    const [activeView, setActiveView] = useState<
        "pending" | "applications"
    >("pending");

    const [applications, setApplications] =
        useState<LeaveApplication[]>([]);

    const [teacherSubjects, setTeacherSubjects] =
        useState<TeacherSubject[]>([]);

    const [classFilter, setClassFilter] = useState("");
    const [classesLoading, setClassesLoading] = useState(true);

    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    const [error, setError] = useState("");
    const [fetchingApplications, setFetchingApplications] =
        useState(false);

    const [actionLoading, setActionLoading] =
        useState<string | null>(null);

    const [isClassTeacher, setIsClassTeacher] = useState(false);
    const [loadingTeacherStatus, setLoadingTeacherStatus] =
        useState(true);

    // Derive unique classes from the teacher's subject assignments.
    const assignedClasses = Array.from(
        new Set(teacherSubjects.map(subject => subject.class))
    ).sort((a, b) => {
        const classNumber = (value: string) =>
            Number.parseInt(value, 10);

        return classNumber(a) - classNumber(b);
    });

    // Load the classes this teacher teaches.
    useEffect(() => {
        let cancelled = false;

        async function fetchAssignedClasses() {
            setClassesLoading(true);
            setError("");

            try {
                const response = await getTeacherSubjects();
                const subjects = response.data.subjects as TeacherSubject[];

                if (cancelled) return;

                setTeacherSubjects(subjects);

                const classes = Array.from(
                    new Set(subjects.map(subject => subject.class))
                ).sort(
                    (a, b) =>
                        Number.parseInt(a, 10) -
                        Number.parseInt(b, 10)
                );

                setClassFilter(previous =>
                    classes.includes(previous)
                        ? previous
                        : classes[0] ?? ""
                );
            } catch (error) {
                console.error(
                    "Failed to fetch teacher assignments:",
                    error
                );

                if (!cancelled) {
                    setTeacherSubjects([]);
                    setClassFilter("");
                    setError("Failed to load your assigned classes.");
                }
            } finally {
                if (!cancelled) {
                    setClassesLoading(false);
                }
            }
        }

        void fetchAssignedClasses();

        return () => {
            cancelled = true;
        };
    }, []);

    const fetchApplications = useCallback(async () => {
        if (!classFilter) {
            setApplications([]);
            setTotalPages(1);
            setIsClassTeacher(false);
            setLoadingTeacherStatus(false);
            setFetchingApplications(false);
            return;
        }

        try {
            setFetchingApplications(true);
            setLoadingTeacherStatus(true);
            setError("");

            const status =
                activeView === "pending" ? "Pending" : "All";

            // The API service will accept classFilter as its fourth argument.
            const response = await getLeaveApplications(
                status,
                currentPage,
                limit,
                classFilter
            );

            setApplications(response.data.leaves);
            setTotalPages(response.data.totalPages);
            setIsClassTeacher(
                response.data.isClassTeacher === true
            );
        } catch (error: any) {
            console.error(
                "Failed to fetch leave applications:",
                error
            );

            setApplications([]);
            setTotalPages(1);
            setIsClassTeacher(false);

            setError(
                error.response?.data?.message ||
                "Failed to load leave applications."
            );
        } finally {
            setFetchingApplications(false);
            setLoadingTeacherStatus(false);
        }
    }, [activeView, currentPage, limit, classFilter]);

    useEffect(() => {
        if (classesLoading) return;

        void fetchApplications();
    }, [classesLoading, fetchApplications]);

    function handleClassChange(value: string) {
        setClassFilter(value);
        setCurrentPage(1);
        setError("");
    }

    function handleViewChange(
        view: "pending" | "applications"
    ) {
        setActiveView(view);
        setCurrentPage(1);
        setError("");
    }

    async function handleApprove(id: string) {
        if (
            !isClassTeacher ||
            loadingTeacherStatus ||
            !classFilter
        ) {
            return;
        }

        try {
            setActionLoading(id);
            setError("");

            await approveLeave(id);
            await fetchApplications();
        } catch (error: any) {
            console.error("Failed to approve leave:", error);

            setError(
                error.response?.data?.message ||
                "Failed to approve leave application."
            );
        } finally {
            setActionLoading(null);
        }
    }

    async function handleReject(id: string) {
        if (
            !isClassTeacher ||
            loadingTeacherStatus ||
            !classFilter
        ) {
            return;
        }

        try {
            setActionLoading(id);
            setError("");

            await rejectLeave(id);
            await fetchApplications();
        } catch (error: any) {
            console.error("Failed to reject leave:", error);

            setError(
                error.response?.data?.message ||
                "Failed to reject leave application."
            );
        } finally {
            setActionLoading(null);
        }
    }

    function formatDate(date: string) {
        return new Date(date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
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
                                Review and manage student leave applications
                            </p>
                        </div>

                        <div className="mb-6 flex flex-wrap items-center gap-4">
                            <label
                                htmlFor="leave-class-filter"
                                className="text-sm font-medium text-gray-700"
                            >
                                Select Class
                            </label>

                            <select
                                id="leave-class-filter"
                                value={classFilter}
                                onChange={event =>
                                    handleClassChange(event.target.value)
                                }
                                disabled={
                                    classesLoading ||
                                    assignedClasses.length === 0
                                }
                                className="min-w-40 cursor-pointer rounded-lg border border-purple-300 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {classesLoading ? (
                                    <option value="">
                                        Loading classes...
                                    </option>
                                ) : assignedClasses.length === 0 ? (
                                    <option value="">
                                        No assigned classes
                                    </option>
                                ) : (
                                    assignedClasses.map(className => (
                                        <option
                                            key={className}
                                            value={className}
                                        >
                                            Class {className}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>

                        <div className="mb-7 flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => handleViewChange("pending")}
                                className={`cursor-pointer rounded-lg px-5 py-2.5 text-sm font-medium transition-colors ${activeView === "pending"
                                        ? "bg-purple-800 text-white"
                                        : "bg-purple-200 text-gray-700 hover:bg-purple-300"
                                    }`}
                            >
                                Pending Applications
                            </button>

                            <button
                                type="button"
                                onClick={() => handleViewChange("applications")}
                                className={`cursor-pointer rounded-lg px-5 py-2.5 text-sm font-medium transition-colors ${activeView === "applications"
                                        ? "bg-purple-800 text-white"
                                        : "bg-purple-200 text-gray-700 hover:bg-purple-300"
                                    }`}
                            >
                                All Applications
                            </button>
                        </div>

                        {!classesLoading &&
                            assignedClasses.length > 0 &&
                            !loadingTeacherStatus &&
                            !isClassTeacher && (
                                <div className="mb-5 flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-4 py-3 text-sm text-purple-900">
                                    <FiLock className="h-4 w-4 shrink-0" />
                                    <span>
                                        You can view applications for this class,
                                        but only its class teacher can approve
                                        or reject them.
                                    </span>
                                </div>
                            )}

                        {error && (
                            <p className="mb-5 text-sm text-red-600">
                                {error}
                            </p>
                        )}

                        <div className="w-full">
                            <h2 className="mb-4 text-xl font-medium text-gray-900">
                                {activeView === "pending"
                                    ? "Pending Leave Applications"
                                    : "All Leave Applications"}
                                {classFilter && ` — Class ${classFilter}`}
                            </h2>

                            <div className="overflow-hidden rounded-2xl bg-purple-200 shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="border-b border-white bg-purple-300">
                                                <th className="px-5 py-4 text-left text-base font-medium text-gray-700">
                                                    S.No.
                                                </th>
                                                <th className="px-5 py-4 text-left text-base font-medium text-gray-700">
                                                    Student
                                                </th>
                                                <th className="px-5 py-4 text-left text-base font-medium text-gray-700">
                                                    UID
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
                                            {classesLoading ||
                                                fetchingApplications ? (
                                                <tr>
                                                    <td
                                                        colSpan={8}
                                                        className="px-5 py-10 text-center text-base text-gray-500"
                                                    >
                                                        Loading leave applications...
                                                    </td>
                                                </tr>
                                            ) : !classFilter ? (
                                                <tr>
                                                    <td
                                                        colSpan={8}
                                                        className="px-5 py-10 text-center text-base text-gray-500"
                                                    >
                                                        {error ||
                                                            "No assigned classes found."}
                                                    </td>
                                                </tr>
                                            ) : applications.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={8}
                                                        className="px-5 py-10 text-center text-base text-gray-500"
                                                    >
                                                        {activeView === "pending"
                                                            ? "No pending leave applications found"
                                                            : "No leave applications found"}
                                                    </td>
                                                </tr>
                                            ) : (
                                                applications.map(
                                                    (application, index) => (
                                                        <tr
                                                            key={application._id}
                                                            className="border-b border-white"
                                                        >
                                                            <td className="px-5 py-4 text-base text-gray-600">
                                                                {startIndex +
                                                                    index +
                                                                    1}
                                                            </td>

                                                            <td className="px-5 py-4 text-base text-gray-600">
                                                                {application.student.name}
                                                            </td>

                                                            <td className="px-5 py-4 text-base uppercase text-gray-600">
                                                                {application.student.uid}
                                                            </td>

                                                            <td className="px-5 py-4 text-base text-gray-600">
                                                                {formatDate(
                                                                    application.startDate
                                                                )}
                                                            </td>

                                                            <td className="px-5 py-4 text-base text-gray-600">
                                                                {formatDate(
                                                                    application.endDate
                                                                )}
                                                            </td>

                                                            <td className="max-w-xs px-5 py-4 text-base text-gray-600">
                                                                {application.reason}
                                                            </td>

                                                            <td className="px-5 py-4">
                                                                <span
                                                                    className={`rounded-full px-3 py-1 text-sm font-medium ${application.status ===
                                                                            "Approved"
                                                                            ? "bg-green-100 text-green-700"
                                                                            : application.status ===
                                                                                "Rejected"
                                                                                ? "bg-red-100 text-red-700"
                                                                                : "bg-yellow-100 text-yellow-700"
                                                                        }`}
                                                                >
                                                                    {application.status}
                                                                </span>
                                                            </td>

                                                            <td className="px-5 py-4">
                                                                {application.status !==
                                                                    "Pending" ? (
                                                                    <span className="text-sm text-gray-500">
                                                                        No action needed
                                                                    </span>
                                                                ) : loadingTeacherStatus ? (
                                                                    <span className="text-sm text-gray-500">
                                                                        Checking permissions...
                                                                    </span>
                                                                ) : !isClassTeacher ? (
                                                                    <div className="flex items-center gap-2 text-sm text-purple-800">
                                                                        <FiLock className="h-4 w-4 shrink-0" />
                                                                        <span>
                                                                            Class teacher only
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            type="button"
                                                                            disabled={
                                                                                actionLoading !==
                                                                                null ||
                                                                                loadingTeacherStatus
                                                                            }
                                                                            onClick={() =>
                                                                                handleApprove(
                                                                                    application._id
                                                                                )
                                                                            }
                                                                            className="cursor-pointer rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                                                                        >
                                                                            {actionLoading ===
                                                                                application._id
                                                                                ? "..."
                                                                                : "Approve"}
                                                                        </button>

                                                                        <button
                                                                            type="button"
                                                                            disabled={
                                                                                actionLoading !==
                                                                                null ||
                                                                                loadingTeacherStatus
                                                                            }
                                                                            onClick={() =>
                                                                                handleReject(
                                                                                    application._id
                                                                                )
                                                                            }
                                                                            className="cursor-pointer rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                                                                        >
                                                                            {actionLoading ===
                                                                                application._id
                                                                                ? "..."
                                                                                : "Reject"}
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    )
                                                )
                                            )}
                                        </tbody>
                                    </table>
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
        </div>
    );
}

export default LeaveApplications;
