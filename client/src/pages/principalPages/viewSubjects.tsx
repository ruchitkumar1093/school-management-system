
import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import SortBy from "../../components/sortBy";
import OrderBy from "../../components/orderBy";
import ClassFilter from "../../components/classFilter";
import SearchBar from "../../components/searchBar";
import Pagination from "../../components/pagination";
import Limit from "../../components/limit";

import {
    viewSubjects,
    deleteSubject
} from "../../services/principalApi";

import PrincipalSubjectsTable from "../../components/principalComponents/subjectsTable";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import Breadcrumb from "../../components/breadcrumb";
import Modal from "../../components/modal";

function PrincipalViewSubjects() {
    type Subject = {
        _id: string;
        name: string;
        subjectCode: string;
        class: string;
        teacherName: string;
    };

    const navigate = useNavigate();
    const location = useLocation();

    const selectedClassFromNavigation: string | undefined =
        location.state?.selectedClass;

    const [subjectsData, setSubjectsData] = useState<Subject[]>([]);
    const [availableClasses, setAvailableClasses] = useState<string[]>([]);

    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [sortBy, setSortBy] = useState("None");
    const [orderBy, setOrderBy] = useState("asc");

    const [classFilter, setClassFilter] = useState<string>(
        selectedClassFromNavigation ?? "All"
    );

    const [modalOpen, setModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [modalMessage, setModalMessage] = useState("");
    const [modalConfirm, setModalConfirm] = useState(false);
    const [modalAction, setModalAction] =
        useState<(() => void) | null>(null);

    const fetchSubjects = useCallback(async () => {
        try {
            const response = await viewSubjects(
                classFilter,
                debouncedSearch,
                sortBy,
                orderBy,
                currentPage,
                limit
            );

            const subjects: Subject[] = response.data.subjects ?? [];

            setSubjectsData(subjects);
            setTotalPages(response.data.totalPages ?? 1);

            // Collect classes from the returned subjects.
            // The backend controller will later return all classes separately,
            // so this list can be made independent of search and pagination.
            setAvailableClasses(response.data.classes ?? []);
        } catch (error) {
            console.error("Failed to fetch subjects:", error);
            setSubjectsData([]);
            setTotalPages(1);
        }
    }, [
        classFilter,
        debouncedSearch,
        sortBy,
        orderBy,
        currentPage,
        limit
    ]);

    useEffect(() => {
        if (
            typeof selectedClassFromNavigation === "string" &&
            selectedClassFromNavigation !== classFilter
        ) {
            setClassFilter(selectedClassFromNavigation);
            setCurrentPage(1);
        }
    }, [selectedClassFromNavigation, classFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);

        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        setCurrentPage(1);
    }, [
        classFilter,
        debouncedSearch,
        sortBy,
        orderBy,
        limit
    ]);

    useEffect(() => {
        void fetchSubjects();
    }, [fetchSubjects]);

    const sortOptions = [
        "None",
        "Subject Name",
        "Class"
    ];

    function handleAddSubject() {
        navigate("subjectForm?mode=add");
    }

    function handleEditSubject(id: string) {
        navigate(`subjectForm?mode=edit&id=${id}`);
    }

    function handleDeleteSubject(id: string) {
        setModalTitle("Delete Subject");
        setModalMessage(
            "Are you sure you want to delete this subject?"
        );
        setModalConfirm(true);
        setModalAction(() => () => confirmDeleteSubject(id));
        setModalOpen(true);
    }

    async function confirmDeleteSubject(id: string) {
        try {
            await deleteSubject(id);

            setModalOpen(false);
            setModalConfirm(false);
            setModalAction(null);

            if (subjectsData.length === 1 && currentPage > 1) {
                setCurrentPage(previous => previous - 1);
            } else {
                await fetchSubjects();
            }
        } catch (error: any) {
            console.error("Failed to delete subject:", error);

            setModalTitle("Error");
            setModalMessage(
                error.response?.data?.message ||
                "Failed to delete subject."
            );
            setModalConfirm(false);
            setModalAction(null);
            setModalOpen(true);
        }
    }

    const startIndex = (currentPage - 1) * limit;

    return (
        <div className="flex min-h-screen flex-col font-fredoka">
            <NavBar />

            <div className="flex flex-1 bg-purple-100">
                <SideBar />

                <div className="min-w-0 flex-1">
                    <Breadcrumb />

                    <div className="mb-10 flex flex-col px-8 pt-12 lg:px-20">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-medium text-gray-900">
                                    School Subjects
                                </h1>

                                <p className="mt-1 text-sm text-gray-600">
                                    View and Manage School Subjects
                                </p>
                            </div>

                            <button
                                onClick={handleAddSubject}
                                type="button"
                                className="cursor-pointer rounded-lg bg-purple-300 px-6 py-3 font-medium text-purple-950 shadow-[0_2px_3px] transition-colors hover:bg-violet-300"
                            >
                                Add Subject
                            </button>
                        </div>

                        <div className="mb-3 flex flex-wrap items-end justify-between gap-4">
                            <div className="mb-3 flex flex-wrap gap-6">
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
                                />
                            </div>

                            <SearchBar
                                search={search}
                                setSearch={setSearch}
                            />
                        </div>

                        <div className="w-full">
                            <PrincipalSubjectsTable
                                subject={subjectsData}
                                handleEditSubject={handleEditSubject}
                                handleDeleteSubject={handleDeleteSubject}
                                startIndex={startIndex}
                            />
                        </div>

                        <div className="mt-5 flex items-center justify-between gap-4">
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

            <Modal
                isOpen={modalOpen}
                title={modalTitle}
                message={modalMessage}
                onClose={() => {
                    setModalOpen(false);
                    setModalConfirm(false);
                    setModalAction(null);
                }}
                onConfirm={
                    modalConfirm && modalAction
                        ? modalAction
                        : undefined
                }
                confirmText={
                    modalTitle === "Delete Subject"
                        ? "Delete"
                        : "Confirm"
                }
            />
        </div>
    );
}

export default PrincipalViewSubjects;
