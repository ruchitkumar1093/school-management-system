import { useEffect, useState } from "react";

import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import Breadcrumb from "../../components/breadcrumb";
import ClassFilter from "../../components/classFilter";

import {
    getLeaveApplications,
    approveLeave,
    rejectLeave
} from "../../services/principalApi";


type LeaveStatus = "Pending" | "Approved" | "Rejected";


type LeaveApplication = {
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


function LeaveApplications() {

    const [activeView, setActiveView] = useState<
        "pending" | "applications"
    >("pending");


    const [classFilter, setClassFilter] =
        useState("All");


    const [applications, setApplications] = useState<
        LeaveApplication[]
    >([]);


    const [actionLoading, setActionLoading] =
        useState<string | null>(null);


    const [loading, setLoading] =
        useState(true);


    async function fetchApplications() {

        try {

            setLoading(true);

            const response = await getLeaveApplications();

            setApplications(response.data);

        } catch (error) {

            console.error(
                "Failed to fetch leave applications:",
                error
            );

        } finally {

            setLoading(false);

        }
    }


    useEffect(() => {

        fetchApplications();

    }, []);


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


    async function handleApprove(id: string) {

        try {

            setActionLoading(id);

            await approveLeave(id);

            await fetchApplications();

        } catch (error) {

            console.error(
                "Failed to approve leave application:",
                error
            );

        } finally {

            setActionLoading(null);

        }
    }


    async function handleReject(id: string) {

        try {

            setActionLoading(id);

            await rejectLeave(id);

            await fetchApplications();

        } catch (error) {

            console.error(
                "Failed to reject leave application:",
                error
            );

        } finally {

            setActionLoading(null);

        }
    }


    const filteredApplications =
        classFilter === "All"
            ? applications
            : applications.filter(
                (application) =>
                    application.student.class ===
                    classFilter
            );


    const pendingApplications =
        filteredApplications.filter(
            (application) =>
                application.status === "Pending"
        );


    const displayedApplications =
        activeView === "pending"
            ? pendingApplications
            : filteredApplications;


    return (
        <div className="flex min-h-screen flex-col font-fredoka">

            <NavBar />


            <div className="flex flex-1 bg-purple-100">

                <SideBar />


                <div className="flex min-w-0 flex-1 flex-col">

                    <Breadcrumb />


                    <div className="flex flex-1 flex-col px-16 pt-10 pb-12">

                        {/* Header */}

                        <div className="mb-7">

                            <h1 className="text-3xl font-medium text-gray-900">
                                Leave Applications
                            </h1>

                            <p className="mt-1 text-sm text-gray-600">
                                Review and manage student leave applications
                            </p>

                        </div>


                        {/* View Buttons + Class Filter */}

                        <div className="mb-7 flex items-end gap-2">

                            <button
                                type="button"
                                onClick={() =>
                                    setActiveView("pending")
                                }
                                className={`cursor-pointer rounded-lg px-5 py-2.5 text-sm font-medium
                                transition-colors
                                ${
                                    activeView === "pending"
                                        ? "bg-purple-800 text-white"
                                        : "bg-purple-200 text-gray-700 hover:bg-purple-300"
                                }`}
                            >
                                Pending Applications
                            </button>


                            <button
                                type="button"
                                onClick={() =>
                                    setActiveView("applications")
                                }
                                className={`cursor-pointer rounded-lg px-5 py-2.5 text-sm font-medium
                                transition-colors
                                ${
                                    activeView === "applications"
                                        ? "bg-purple-800 text-white"
                                        : "bg-purple-200 text-gray-700 hover:bg-purple-300"
                                }`}
                            >
                                All Applications
                            </button>


                            <ClassFilter
                                classFilter={classFilter}
                                setClassFilter={setClassFilter}
                            />

                        </div>


                        {/* Applications */}

                        <div className="w-full">

                            <h2 className="mb-4 text-xl font-medium text-gray-900">

                                {activeView === "pending"
                                    ? "Pending Leave Applications"
                                    : "All Leave Applications"}

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
                                                    Class
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
                                                        colSpan={9}
                                                        className="px-5 py-10 text-center text-base text-gray-500"
                                                    >
                                                        Loading leave applications...
                                                    </td>

                                                </tr>

                                            ) : displayedApplications.length === 0 ? (

                                                <tr>

                                                    <td
                                                        colSpan={9}
                                                        className="px-5 py-10 text-center text-base text-gray-500"
                                                    >
                                                        {activeView === "pending"
                                                            ? "No pending leave applications found"
                                                            : "No leave applications found"}
                                                    </td>

                                                </tr>

                                            ) : (

                                                displayedApplications.map(
                                                    (
                                                        application,
                                                        index
                                                    ) => (

                                                        <tr
                                                            key={
                                                                application._id
                                                            }
                                                            className="border-b border-white"
                                                        >

                                                            {/* S.No. */}

                                                            <td className="px-5 py-4 text-base text-gray-600">
                                                                {index + 1}
                                                            </td>


                                                            {/* Student */}

                                                            <td className="px-5 py-4 text-base text-gray-600">
                                                                {
                                                                    application
                                                                        .student
                                                                        .name
                                                                }
                                                            </td>


                                                            {/* UID */}

                                                            <td className="px-5 py-4 text-base text-gray-600">
                                                                {
                                                                    application
                                                                        .student
                                                                        .uid
                                                                }
                                                            </td>


                                                            {/* Class */}

                                                            <td className="px-5 py-4 text-base text-gray-600">
                                                                {
                                                                    application
                                                                        .student
                                                                        .class
                                                                }
                                                            </td>


                                                            {/* Start Date */}

                                                            <td className="px-5 py-4 text-base text-gray-600">
                                                                {formatDate(
                                                                    application.startDate
                                                                )}
                                                            </td>


                                                            {/* End Date */}

                                                            <td className="px-5 py-4 text-base text-gray-600">
                                                                {formatDate(
                                                                    application.endDate
                                                                )}
                                                            </td>


                                                            {/* Reason */}

                                                            <td className="max-w-xs px-5 py-4 text-base text-gray-600">
                                                                {
                                                                    application.reason
                                                                }
                                                            </td>


                                                            {/* Status */}

                                                            <td className="px-5 py-4">

                                                                <span
                                                                    className={`rounded-full px-3 py-1 text-sm font-medium
                                                                    ${
                                                                        application.status ===
                                                                        "Approved"
                                                                            ? "bg-green-100 text-green-700"
                                                                            : application.status ===
                                                                              "Rejected"
                                                                            ? "bg-red-100 text-red-700"
                                                                            : "bg-yellow-100 text-yellow-700"
                                                                    }`}
                                                                >
                                                                    {
                                                                        application.status
                                                                    }
                                                                </span>

                                                            </td>


                                                            {/* Action */}

                                                            <td className="px-5 py-4">

                                                                {application.status ===
                                                                "Pending" ? (

                                                                    <div className="flex gap-2">

                                                                        <button
                                                                            type="button"
                                                                            disabled={
                                                                                actionLoading ===
                                                                                application._id
                                                                            }
                                                                            onClick={() =>
                                                                                handleApprove(
                                                                                    application._id
                                                                                )
                                                                            }
                                                                            className="cursor-pointer rounded-lg bg-green-700
                                                                            px-4 py-2 text-sm font-medium text-white
                                                                            transition-colors hover:bg-green-800
                                                                            disabled:cursor-not-allowed disabled:opacity-60"
                                                                        >

                                                                            {actionLoading ===
                                                                            application._id
                                                                                ? "..."
                                                                                : "Approve"}

                                                                        </button>


                                                                        <button
                                                                            type="button"
                                                                            disabled={
                                                                                actionLoading ===
                                                                                application._id
                                                                            }
                                                                            onClick={() =>
                                                                                handleReject(
                                                                                    application._id
                                                                                )
                                                                            }
                                                                            className="cursor-pointer rounded-lg bg-red-700
                                                                            px-4 py-2 text-sm font-medium text-white
                                                                            transition-colors hover:bg-red-800
                                                                            disabled:cursor-not-allowed disabled:opacity-60"
                                                                        >

                                                                            {actionLoading ===
                                                                            application._id
                                                                                ? "..."
                                                                                : "Reject"}

                                                                        </button>

                                                                    </div>

                                                                ) : (

                                                                    <span className="text-sm text-gray-500">
                                                                        No action needed
                                                                    </span>

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

                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
}

export default LeaveApplications;