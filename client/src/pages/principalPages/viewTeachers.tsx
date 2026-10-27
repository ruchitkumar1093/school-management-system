import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import PrincipalTeachersTable from "../../components/principalComponents/teachersTable";
import SortBy from "../../components/sortBy";
import OrderBy from "../../components/orderBy";
import ClassFilter from "../../components/classFilter";
import SearchBar from "../../components/searchBar";
import Pagination from "../../components/pagination";
import Limit from "../../components/limit";

import {
    viewTeachers,
    deleteTeacher,
    deleteTeachers,
    restoreTeacher,
    permanentlyDeleteTeacher
} from "../../services/principalApi";

import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Modal from "../../components/modal";
import Breadcrumb from "../../components/breadcrumb";

type Teacher = {
    _id: string;
    userId: {
        name: string;
        isActive: boolean;
    };
    employeeID: string;
    classes: string[];
    subjects: string[];
    isDeleted: boolean;
    deletedAt: string | null;
    isClassTeacher: boolean;
};

function PrincipalViewTeachers() {
    const navigate = useNavigate();
    const location = useLocation();

    const selectedClassFromNavigation: string | undefined =
        location.state?.selectedClass;

    const [teachersData, setTeachersData] = useState<Teacher[]>([]);
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

    const [classTeacherOnly, setClassTeacherOnly] = useState(false);

    const [showDeleted, setShowDeleted] = useState(false);
    const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);

    const [modalOpen, setModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [modalMessage, setModalMessage] = useState("");
    const [modalConfirm, setModalConfirm] = useState(false);
    const [modalAction, setModalAction] =
        useState<(() => void) | null>(null);

    const fetchTeachers = useCallback(async () => {
        try {
            const response = await viewTeachers(
                classFilter,
                debouncedSearch,
                sortBy,
                orderBy,
                currentPage,
                limit,
                showDeleted,
                classTeacherOnly
            );

            const data = response.data;

            setTeachersData(data.teachers ?? []);
            setTotalPages(data.totalPages ?? 1);

            // The controller will return all available classes.
            if (Array.isArray(data.classes)) {
                setAvailableClasses(data.classes);
            }
        } catch (error) {
            console.error("Failed to fetch teachers:", error);
            setTeachersData([]);
            setTotalPages(1);
        }
    }, [
        classFilter,
        debouncedSearch,
        sortBy,
        orderBy,
        currentPage,
        limit,
        showDeleted,
        classTeacherOnly
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
        debouncedSearch,
        sortBy,
        orderBy,
        classFilter,
        classTeacherOnly,
        limit,
        showDeleted
    ]);

    useEffect(() => {
        void fetchTeachers();
    }, [fetchTeachers]);

    useEffect(() => {
        setSelectedTeachers([]);
    }, [
        debouncedSearch,
        sortBy,
        orderBy,
        classFilter,
        classTeacherOnly,
        currentPage,
        limit,
        showDeleted
    ]);

    function handleSelectTeacher(id: string) {
        setSelectedTeachers(previous =>
            previous.includes(id)
                ? previous.filter(teacherId => teacherId !== id)
                : [...previous, id]
        );
    }

    function handleSelectAllTeachers() {
        const activeTeacherIds = teachersData
            .filter(teacher => !teacher.isDeleted)
            .map(teacher => teacher._id);

        const allSelected =
            activeTeacherIds.length > 0 &&
            activeTeacherIds.every(id =>
                selectedTeachers.includes(id)
            );

        if (allSelected) {
            setSelectedTeachers(previous =>
                previous.filter(id => !activeTeacherIds.includes(id))
            );
        } else {
            setSelectedTeachers(previous => [
                ...new Set([...previous, ...activeTeacherIds])
            ]);
        }
    }

    function handleDeleteAll() {
        if (selectedTeachers.length === 0) {
            return;
        }

        setModalTitle("Delete Teachers");
        setModalMessage(
            `Are you sure you want to delete ${selectedTeachers.length} selected teacher${selectedTeachers.length > 1 ? "s" : ""}?`
        );
        setModalConfirm(true);
        setModalAction(() => () => confirmDeleteAll());
        setModalOpen(true);
    }

    async function confirmDeleteAll() {
        try {
            await deleteTeachers(selectedTeachers);

            setSelectedTeachers([]);

            if (
                teachersData.length === selectedTeachers.length &&
                currentPage > 1
            ) {
                setCurrentPage(previous => previous - 1);
            } else {
                await fetchTeachers();
            }

            setModalTitle("Success");
            setModalMessage("Selected teachers deleted successfully.");
            setModalConfirm(false);
            setModalAction(null);
            setModalOpen(true);
        } catch (error: any) {
            console.error("Failed to delete teachers:", error);

            setModalTitle("Error");
            setModalMessage(
                error.response?.data?.message ||
                "Failed to delete teachers."
            );
            setModalConfirm(false);
            setModalAction(null);
            setModalOpen(true);
        }
    }

    function handleAddTeacher() {
        navigate("teacherForm?mode=add");
    }

    function handleEditTeacher(id: string) {
        navigate(`teacherForm?mode=edit&id=${id}`);
    }

    function handleDeleteTeacher(id: string) {
        setModalTitle("Delete Teacher");
        setModalMessage(
            "Are you sure you want to delete this teacher?"
        );
        setModalConfirm(true);
        setModalAction(() => () => confirmDeleteTeacher(id));
        setModalOpen(true);
    }

    async function confirmDeleteTeacher(id: string) {
        try {
            await deleteTeacher(id);

            setModalOpen(false);
            setModalConfirm(false);
            setModalAction(null);

            if (teachersData.length === 1 && currentPage > 1) {
                setCurrentPage(previous => previous - 1);
            } else {
                await fetchTeachers();
            }
        } catch (error: any) {
            console.error("Failed to delete teacher:", error);

            setModalTitle("Error");
            setModalMessage(
                error.response?.data?.message ||
                "Failed to delete teacher."
            );
            setModalConfirm(false);
            setModalAction(null);
            setModalOpen(true);
        }
    }

    async function handleRestoreTeacher(id: string) {
        try {
            await restoreTeacher(id);

            if (teachersData.length === 1 && currentPage > 1) {
                setCurrentPage(previous => previous - 1);
            } else {
                await fetchTeachers();
            }
        } catch (error: any) {
            console.error("Failed to restore teacher:", error);

            setModalTitle("Error");
            setModalMessage(
                error.response?.data?.message ||
                "Failed to restore teacher."
            );
            setModalConfirm(false);
            setModalAction(null);
            setModalOpen(true);
        }
    }

    function handlePermanentlyDeleteTeacher(id: string) {
        setModalTitle("Permanently Delete Teacher");
        setModalMessage(
            "Are you sure you want to permanently delete this teacher? This action cannot be undone."
        );
        setModalConfirm(true);
        setModalAction(
            () => () => confirmPermanentlyDeleteTeacher(id)
        );
        setModalOpen(true);
    }

    async function confirmPermanentlyDeleteTeacher(id: string) {
        try {
            await permanentlyDeleteTeacher(id);

            if (teachersData.length === 1 && currentPage > 1) {
                setCurrentPage(previous => previous - 1);
            } else {
                await fetchTeachers();
            }

            setModalTitle("Success");
            setModalMessage("Teacher permanently deleted.");
            setModalConfirm(false);
            setModalAction(null);
            setModalOpen(true);
        } catch (error: any) {
            console.error("Failed to permanently delete teacher:", error);

            setModalTitle("Error");
            setModalMessage(
                error.response?.data?.message ||
                "Failed to permanently delete teacher."
            );
            setModalConfirm(false);
            setModalAction(null);
            setModalOpen(true);
        }
    }

    function handleTeacherProfile(id: string) {
        navigate(`teacherProfile?id=${id}`);
    }

    function handleTeacherMarks(id: string) {
        navigate(`../viewMarks?teacher=${id}`, {
            state: {
                selectedClass:
                    classFilter === "All" ? undefined : classFilter
            }
        });
    }

    const startIndex = (currentPage - 1) * limit;
    const sortOptions = ["None", "Teacher Name", "Class Assigned"];

    const activeTeachers = teachersData.filter(
        teacher => !teacher.isDeleted
    );

    const allTeachersSelected =
        activeTeachers.length > 0 &&
        activeTeachers.every(teacher =>
            selectedTeachers.includes(teacher._id)
        );

    return (
        <div className="flex min-h-screen flex-col font-fredoka">
            <NavBar />

            <div className="flex flex-1 bg-purple-100">
                <SideBar />

                <div className="min-w-0 flex-1">
                    <Breadcrumb />

                    <div className="mb-10 mr-10 flex flex-col px-8 pt-12 lg:pl-20">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-medium text-gray-900">
                                    Teachers
                                </h1>

                                <p className="mt-1 text-sm text-gray-600">
                                    View and Manage Teachers
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-4">
                                {selectedTeachers.length > 0 && (
                                    <button
                                        onClick={handleDeleteAll}
                                        type="button"
                                        className="cursor-pointer rounded-lg bg-red-600 px-6 py-3 font-medium text-white shadow-[0_2px_3px] transition-colors hover:bg-red-700"
                                    >
                                        Delete All
                                    </button>
                                )}

                                <label className="flex w-fit cursor-pointer items-center gap-2 rounded-md border border-purple-200 bg-purple-50 px-5 py-3 text-sm font-medium text-purple-900 transition-all">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={showDeleted}
                                            onChange={event => {
                                                setShowDeleted(event.target.checked);
                                                setCurrentPage(1);
                                            }}
                                            className="peer sr-only"
                                        />

                                        <div className="h-4 w-7 rounded-full bg-gray-300 transition-colors peer-checked:bg-purple-700" />

                                        <div className="absolute left-0.5 top-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-3" />
                                    </div>

                                    <span>Show deleted teachers</span>
                                </label>

                                <label className="flex w-fit cursor-pointer items-center gap-2 rounded-md border border-purple-200 bg-purple-50 px-5 py-3 text-sm font-medium text-purple-900 transition-all">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={classTeacherOnly}
                                            onChange={event => {
                                                setClassTeacherOnly(event.target.checked);
                                                setCurrentPage(1);
                                            }}
                                            className="peer sr-only"
                                        />

                                        <div className="h-4 w-7 rounded-full bg-gray-300 transition-colors peer-checked:bg-purple-700" />

                                        <div className="absolute left-0.5 top-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-3" />
                                    </div>

                                    <span>Class Teachers Only</span>
                                </label>

                                <button
                                    onClick={handleAddTeacher}
                                    type="button"
                                    className="cursor-pointer rounded-lg bg-purple-300 px-6 py-3 font-medium text-purple-950 shadow-[0_2px_3px] transition-colors hover:bg-violet-300"
                                >
                                    Add Teacher
                                </button>
                            </div>
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

                        <div className="flex flex-wrap gap-10">
                            <PrincipalTeachersTable
                                teacher={teachersData}
                                handleEditTeacher={handleEditTeacher}
                                handleDeleteTeacher={handleDeleteTeacher}
                                handleTeacherProfile={handleTeacherProfile}
                                handleTeacherMarks={handleTeacherMarks}
                                handleRestoreTeacher={handleRestoreTeacher}
                                handlePermanentlyDeleteTeacher={handlePermanentlyDeleteTeacher}
                                selectedTeachers={selectedTeachers}
                                handleSelectTeacher={handleSelectTeacher}
                                handleSelectAllTeachers={handleSelectAllTeachers}
                                allTeachersSelected={allTeachersSelected}
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
                    modalTitle === "Permanently Delete Teacher"
                        ? "Delete Permanently"
                        : modalTitle === "Delete Teachers"
                            ? "Yes"
                            : modalTitle === "Delete Teacher"
                                ? "Delete"
                                : "Confirm"
                }
            />
        </div>
    );
}

export default PrincipalViewTeachers;