import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import SortBy from "../../components/sortBy";
import OrderBy from "../../components/orderBy";
import ClassFilter from "../../components/classFilter";
import SearchBar from "../../components/searchBar";
import Status from "../../components/status";
import Pagination from "../../components/pagination";
import Limit from "../../components/limit";

import { useState, useEffect, useCallback } from "react";
import {
    getAdmission,
    deleteRejectAdmissions
} from "../../services/admissionApi";

import AdmissionTable from "../../components/principalComponents/admissionTable";
import { useNavigate } from "react-router-dom";
import Breadcrumb from "../../components/breadcrumb";
import Modal from "../../components/modal";

type Admission = {
    _id: string;
    studentName: string;
    classApplyingFor: string;
    status: "pending" | "approved" | "rejected";
};

type StatusType = "pending" | "approved" | "rejected";

type AdmissionResponse = {
    admissions: Admission[];
    totalPages: number;
    totalAdmissions: number;
    classes?: string[];
};

function AdmissionRequest() {
    const navigate = useNavigate();

    const [admissionData, setAdmissionData] = useState<Admission[]>([]);
    const [availableClasses, setAvailableClasses] = useState<string[]>([]);

    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [sortBy, setSortBy] = useState("None");
    const [orderBy, setOrderBy] = useState("asc");
    const [classFilter, setClassFilter] = useState("All");
    const [status, setStatus] = useState<StatusType>("pending");

    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const [modalOpen, setModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [modalMessage, setModalMessage] = useState("");
    const [modalConfirm, setModalConfirm] =
        useState<(() => void) | undefined>();

    const fetchAdmissions = useCallback(async () => {
        setLoading(true);
        setErrorMessage("");

        try {
            const response = await getAdmission(
                status,
                classFilter,
                debouncedSearch,
                sortBy,
                orderBy,
                currentPage,
                limit
            );

            const data: AdmissionResponse = response?.data ?? response;

            if (!data || !Array.isArray(data.admissions)) {
                throw new Error(
                    "The admissions API returned an unexpected response."
                );
            }

            setAdmissionData(data.admissions);
            setTotalPages(Math.max(1, data.totalPages ?? 1));

            if (Array.isArray(data.classes)) {
                setAvailableClasses(data.classes);
            }
        } catch (error) {
            const apiError = error as {
                response?: { data?: { message?: string } };
                message?: string;
            };

            console.error("Failed to fetch admissions:", error);
            setAdmissionData([]);
            setTotalPages(1);
            setErrorMessage(
                apiError.response?.data?.message ??
                apiError.message ??
                "Failed to fetch admission requests."
            );
        } finally {
            setLoading(false);
        }
    }, [
        status,
        classFilter,
        debouncedSearch,
        sortBy,
        orderBy,
        currentPage,
        limit
    ]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);

        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        setCurrentPage(1);
    }, [
        status,
        classFilter,
        debouncedSearch,
        sortBy,
        orderBy,
        limit
    ]);

    useEffect(() => {
        void fetchAdmissions();
    }, [fetchAdmissions]);

    function handleViewAdmission(id: string) {
        navigate(`viewRequest?id=${id}`);
    }

    function deleteAdmissions() {
        setModalTitle("Confirm Action");
        setModalMessage(
            "Are you sure you want to delete all rejected admissions?"
        );

        setModalConfirm(() => async () => {
            try {
                await deleteRejectAdmissions();

                setModalOpen(false);
                setModalConfirm(undefined);

                setModalTitle("Success");
                setModalMessage("Deleted successfully.");
                setModalOpen(true);

                await fetchAdmissions();
            } catch (error) {
                const apiError = error as {
                    response?: { data?: { message?: string } };
                };

                setModalConfirm(undefined);
                setModalTitle("Error");
                setModalMessage(
                    apiError.response?.data?.message ??
                    "Failed to delete rejected admissions."
                );
                setModalOpen(true);
            }
        });

        setModalOpen(true);
    }

    const sortOptions = ["None", "Student Name", "Class"];
    const startIndex = (currentPage - 1) * limit;

    return (
        <div className="flex min-h-screen flex-col font-fredoka">
            <NavBar />

            <div className="flex flex-1 bg-purple-100">
                <SideBar />

                <div className="min-w-0">
                    <Breadcrumb />

                    <div className="mb-10 flex flex-col px-8 pt-12 lg:pl-20">
                        <div className="mb-8">
                            <h1 className="text-3xl font-medium text-gray-900">
                                Admission Requests
                            </h1>

                            <p className="mt-1 text-sm text-gray-600">
                                View and Manage Admission Requests
                            </p>
                        </div>

                        <div className="mb-3 flex flex-col gap-4">
                            <div className="flex flex-wrap items-end justify-between gap-4">
                                <div className="flex flex-wrap items-end gap-6">
                                    <SortBy
                                        sortOptions={sortOptions}
                                        sortBy={sortBy}
                                        setSortBy={setSortBy}
                                    />

                                    <OrderBy
                                        orderBy={orderBy}
                                        setOrderBy={setOrderBy}
                                        disabled={sortBy === "None"}
                                    />

                                    <ClassFilter
                                        classFilter={classFilter}
                                        setClassFilter={setClassFilter}
                                        classes={availableClasses}
                                        showAll
                                    />
                                </div>

                                <SearchBar
                                    search={search}
                                    setSearch={setSearch}
                                />
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <Status
                                    status={status}
                                    setStatus={setStatus}
                                />

                                {status === "rejected" && (
                                    <button
                                        type="button"
                                        onClick={deleteAdmissions}
                                        className="mt-2 cursor-pointer self-start rounded-md bg-purple-300 p-2 shadow-[0_2px_1px] hover:bg-red-300"
                                    >
                                        Delete Rejected
                                    </button>
                                )}
                            </div>
                        </div>

                        {loading ? (
                            <div className="py-10 text-center text-gray-600">
                                Loading admission requests...
                            </div>
                        ) : errorMessage ? (
                            <div className="rounded-lg border border-red-200 bg-white p-6 text-center text-red-700">
                                {errorMessage}
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-10">
                                <AdmissionTable
                                    admission={admissionData}
                                    startIndex={startIndex}
                                    handleViewAdmission={handleViewAdmission}
                                />
                            </div>
                        )}

                        <div className="mt-5 flex items-center justify-between gap-4">
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
                </div>
            </div>

            <Modal
                isOpen={modalOpen}
                title={modalTitle}
                message={modalMessage}
                onClose={() => {
                    setModalOpen(false);
                    setModalConfirm(undefined);
                }}
                onConfirm={modalConfirm}
            />
        </div>
    );
}

export default AdmissionRequest;