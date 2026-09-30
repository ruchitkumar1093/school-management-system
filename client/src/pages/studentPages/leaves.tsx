import { useEffect, useState } from "react";

import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import Breadcrumb from "../../components/breadcrumb";
import Pagination from "../../components/pagination";
import Limit from "../../components/limit";

import {
    applyLeave,
    getMyLeaves
} from "../../services/studentApi";

type LeaveStatus = "Pending" | "Approved" | "Rejected";

type LeaveApplication = {
    _id: string;
    startDate: string;
    endDate: string;
    reason: string;
    status: LeaveStatus;
};

function LeaveApplications() {
    const today = new Date();

    const todayString =
        today.getFullYear() +
        "-" +
        String(today.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(today.getDate()).padStart(2, "0");

    const [activeView, setActiveView] = useState<
        "apply" | "applications"
    >("apply");

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [reason, setReason] = useState("");

    const [applications, setApplications] = useState<
        LeaveApplication[]
    >([]);

    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(5);
    const [totalPages, setTotalPages] = useState(1);

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetchingApplications, setFetchingApplications] =
        useState(false);

    async function fetchApplications() {
        try {
            setFetchingApplications(true);
            setError("");

            const response = await getMyLeaves(
                currentPage,
                limit
            );

            setApplications(response.data.leaves);
            setTotalPages(response.data.totalPages);
        }
        catch (error) {
            console.error(
                "Failed to fetch leave applications:",
                error
            );

            setError(
                "Failed to load leave applications."
            );
        }
        finally {
            setFetchingApplications(false);
        }
    }

    useEffect(() => {
        fetchApplications();
    }, [currentPage, limit]);

    async function handleSubmit(
        event: React.FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setError("");

        if (!startDate || !endDate || !reason.trim()) {
            setError("Please fill in all fields.");
            return;
        }

        if (endDate < startDate) {
            setError(
                "End date cannot be before the start date."
            );
            return;
        }

        try {
            setLoading(true);

            await applyLeave({
                startDate,
                endDate,
                reason: reason.trim()
            });

            setStartDate("");
            setEndDate("");
            setReason("");

            setCurrentPage(1);
            await fetchApplications();

            setActiveView("applications");
        }
        catch (error) {
            console.error(
                "Failed to apply for leave:",
                error
            );

            setError(
                "Failed to submit leave application."
            );
        }
        finally {
            setLoading(false);
        }
    }

    function formatDate(date: string) {
        return new Date(date).toLocaleDateString(
            "en-IN",
            {
                day: "numeric",
                month: "short",
                year: "numeric"
            }
        );
    }

    const startIndex =
        (currentPage - 1) * limit;

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
                                Apply for leave and track your leave applications
                            </p>
                        </div>

                        <div className="mb-7 flex gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setActiveView("apply");
                                    setError("");
                                }}
                                className={`cursor-pointer rounded-lg px-5 py-2.5 text-sm font-medium transition-colors
                                ${activeView === "apply"
                                        ? "bg-purple-800 text-white"
                                        : "bg-purple-200 text-gray-700 hover:bg-purple-300"
                                    }`}
                            >
                                Apply for Leave
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setActiveView("applications");
                                    setError("");
                                }}
                                className={`cursor-pointer rounded-lg px-5 py-2.5 text-sm font-medium transition-colors
                                ${activeView === "applications"
                                        ? "bg-purple-800 text-white"
                                        : "bg-purple-200 text-gray-700 hover:bg-purple-300"
                                    }`}
                            >
                                My Applications
                            </button>
                        </div>

                        {error && (
                            <p className="mb-5 text-sm text-red-600">
                                {error}
                            </p>
                        )}

                        {activeView === "apply" && (
                            <div className="w-full max-w-4xl rounded-2xl bg-purple-200 p-6 shadow-sm">
                                <h2 className="mb-5 text-xl font-medium text-gray-900">
                                    Apply for Leave
                                </h2>

                                <form
                                    onSubmit={handleSubmit}
                                    className="flex flex-col gap-5"
                                >
                                    <div className="grid grid-cols-2 gap-5">
                                        <div className="flex flex-col gap-2">
                                            <label
                                                htmlFor="startDate"
                                                className="text-sm font-medium text-gray-800"
                                            >
                                                Start Date
                                            </label>

                                            <input
                                                id="startDate"
                                                type="date"
                                                min={todayString}
                                                value={startDate}
                                                onChange={(event) =>
                                                    setStartDate(
                                                        event.target.value
                                                    )
                                                }
                                                className="w-full rounded-lg border-2 border-purple-400 bg-purple-100 px-4 py-3 text-gray-900 outline-none transition-colors focus:border-purple-800 focus:bg-white"
                                            />
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <label
                                                htmlFor="endDate"
                                                className="text-sm font-medium text-gray-800"
                                            >
                                                End Date
                                            </label>

                                            <input
                                                id="endDate"
                                                type="date"
                                                min={todayString}
                                                value={endDate}
                                                onChange={(event) =>
                                                    setEndDate(
                                                        event.target.value
                                                    )
                                                }
                                                className="w-full rounded-lg border-2 border-purple-400 bg-purple-100 px-4 py-3 text-gray-900 outline-none transition-colors focus:border-purple-800 focus:bg-white"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label
                                            htmlFor="reason"
                                            className="text-sm font-medium text-gray-800"
                                        >
                                            Reason
                                        </label>

                                        <textarea
                                            id="reason"
                                            value={reason}
                                            onChange={(event) =>
                                                setReason(
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Enter the reason for your leave"
                                            rows={4}
                                            className="w-full resize-none rounded-lg border-2 border-purple-400 bg-purple-100 px-4 py-3 text-gray-900 outline-none transition-colors focus:border-purple-800 focus:bg-white"
                                        />
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="cursor-pointer rounded-lg bg-purple-800 px-6 py-3 text-sm font-medium text-white shadow-[0_2px_1px_rgba(0,0,0,0.2)] transition-colors hover:bg-purple-900 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {loading
                                                ? "Submitting..."
                                                : "Apply for Leave"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {activeView === "applications" && (
                            <div className="w-full max-w-5xl">
                                <h2 className="mb-4 text-xl font-medium text-gray-900">
                                    My Leave Applications
                                </h2>

                                <div className="overflow-hidden rounded-2xl bg-purple-200 shadow-sm">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="border-b border-white bg-purple-300">
                                                <th className="px-5 py-4 text-left text-base font-medium text-gray-700">
                                                    S.No.
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
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {fetchingApplications ? (
                                                <tr>
                                                    <td
                                                        colSpan={5}
                                                        className="px-5 py-10 text-center text-base text-gray-500"
                                                    >
                                                        Loading leave applications...
                                                    </td>
                                                </tr>
                                            ) : applications.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={5}
                                                        className="px-5 py-10 text-center text-base text-gray-500"
                                                    >
                                                        No leave applications found
                                                    </td>
                                                </tr>
                                            ) : (
                                                applications.map(
                                                    (
                                                        application,
                                                        index
                                                    ) => (
                                                        <tr
                                                            key={application._id}
                                                            className="border-b border-white"
                                                        >
                                                            <td className="px-5 py-4 text-base text-gray-600">
                                                                {startIndex + index + 1}
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
                                                                    className={`rounded-full px-3 py-1 text-sm font-medium
                                                                    ${application.status ===
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
                                                        </tr>
                                                    )
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-5 flex items-center justify-between">
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
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LeaveApplications;