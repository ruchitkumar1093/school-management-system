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

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../../components/modal";
import Breadcrumb from "../../components/breadcrumb";

function PrincipalViewTeachers() {
    type Teacher = {
        _id: string;
        userId: {
            name: string;
        };
        employeeID: string;
        department: string;
        classAssigned: string;
        isDeleted: boolean;
        deletedAt: string | null;
    };

    const navigate = useNavigate();

    const [teachersData, setTeachersData] = useState<Teacher[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(5);
    const [totalPages, setTotalPages] = useState(1);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [sortBy, setSortBy] = useState("None");
    const [orderBy, setOrderBy] = useState("asc");
    const [classFilter, setClassFilter] = useState("All");
    const [showDeleted, setShowDeleted] = useState(false);

    const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);

    const [modalOpen, setModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [modalMessage, setModalMessage] = useState("");
    const [modalConfirm, setModalConfirm] = useState(false);
    const [modalAction, setModalAction] = useState<(() => void) | null>(null);

    const fetchTeachers = async () => {
        try {
            const teachers = await viewTeachers(
                classFilter,
                debouncedSearch,
                sortBy,
                orderBy,
                currentPage,
                limit,
                showDeleted
            );

            console.log("Teachers response:", teachers.data);

            setTeachersData(teachers.data.teachers);
            setTotalPages(teachers.data.totalPages);
        }
        catch (error) {
            console.log(error);
            setTeachersData([]);
            setTotalPages(1);
        }
    };

    useEffect(() => {
        fetchTeachers();
    }, [
        debouncedSearch,
        sortBy,
        orderBy,
        classFilter,
        currentPage,
        limit,
        showDeleted
    ]);

    useEffect(() => {
        setCurrentPage(1);
    }, [
        debouncedSearch,
        sortBy,
        orderBy,
        classFilter,
        limit,
        showDeleted
    ]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);

        return () => {
            clearTimeout(timer);
        };
    }, [search]);

    useEffect(() => {
        setSelectedTeachers([]);
    }, [
        debouncedSearch,
        sortBy,
        orderBy,
        classFilter,
        currentPage,
        limit,
        showDeleted
    ]);

    function handleSelectTeacher(id: string) {
        setSelectedTeachers((prev) =>
            prev.includes(id)
                ? prev.filter((teacherId) => teacherId !== id)
                : [...prev, id]
        );
    }

    function handleSelectAllTeachers() {
        const activeTeacherIds = teachersData
            .filter((teacher) => !teacher.isDeleted)
            .map((teacher) => teacher._id);

        const allSelected =
            activeTeacherIds.length > 0 &&
            activeTeacherIds.every((id) =>
                selectedTeachers.includes(id)
            );

        if (allSelected) {
            setSelectedTeachers((prev) =>
                prev.filter((id) => !activeTeacherIds.includes(id))
            );
        }
        else {
            setSelectedTeachers((prev) => [
                ...new Set([...prev, ...activeTeacherIds])
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

            if (teachersData.length === selectedTeachers.length && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            }
            else {
                await fetchTeachers();
            }

            setModalTitle("Success");
            setModalMessage("Selected teachers deleted successfully.");
            setModalConfirm(false);
            setModalAction(null);
            setModalOpen(true);
        }
        catch (error: any) {
            console.log(error);

            setModalTitle("Error");
            setModalMessage(
                error.response?.data?.message || "Failed to delete teachers."
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

    async function handleDeleteTeacher(id: string) {
        try {
            await deleteTeacher(id);

            if (teachersData.length === 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            }
            else {
                await fetchTeachers();
            }

            setModalTitle("Success");
            setModalMessage("Teacher deleted");
            setModalConfirm(false);
            setModalAction(null);
            setModalOpen(true);
        }
        catch (error: any) {
            console.log(error);

            setModalTitle("Error");
            setModalMessage(
                error.response?.data?.message || "Failed"
            );
            setModalConfirm(false);
            setModalAction(null);
            setModalOpen(true);
        }
    }

    function handleRestoreTeacher(id: string) {
        setModalTitle("Restore Teacher");
        setModalMessage(
            "Are you sure you want to restore this teacher?"
        );
        setModalConfirm(true);
        setModalAction(() => () => confirmRestoreTeacher(id));
        setModalOpen(true);
    }

    async function confirmRestoreTeacher(id: string) {
        try {
            await restoreTeacher(id);

            if (teachersData.length === 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            }
            else {
                await fetchTeachers();
            }

            setModalTitle("Success");
            setModalMessage("Teacher restored successfully.");
            setModalConfirm(false);
            setModalAction(null);
            setModalOpen(true);
        }
        catch (error: any) {
            console.log(error);

            setModalTitle("Error");
            setModalMessage(
                error.response?.data?.message || "Failed to restore teacher."
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
        setModalAction(() => () => confirmPermanentlyDeleteTeacher(id));
        setModalOpen(true);
    }

    async function confirmPermanentlyDeleteTeacher(id: string) {
        try {
            await permanentlyDeleteTeacher(id);

            if (teachersData.length === 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            }
            else {
                await fetchTeachers();
            }

            setModalTitle("Success");
            setModalMessage("Teacher permanently deleted.");
            setModalConfirm(false);
            setModalAction(null);
            setModalOpen(true);
        }
        catch (error: any) {
            console.log(error);

            setModalTitle("Error");
            setModalMessage(
                error.response?.data?.message || "Failed to permanently delete teacher."
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
        navigate(`../viewMarks?teacher=${id}`);
    }

    const startIndex = (currentPage - 1) * limit;

    const sortOptions = ["None", "Teacher Name", "Class Assigned"];

    const activeTeachers = teachersData.filter(
        (teacher) => !teacher.isDeleted
    );

    const allTeachersSelected =
        activeTeachers.length > 0 &&
        activeTeachers.every((teacher) =>
            selectedTeachers.includes(teacher._id)
        );

    return (
        <div className="flex flex-col min-h-screen font-fredoka">
            <NavBar />

            <div className="flex flex-1 bg-purple-100">
                <SideBar />

                <div>
                    <Breadcrumb />

                    <div className="flex flex-col pt-12 pl-20 mb-10">

                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h1 className="text-3xl font-medium text-gray-900">
                                    Teachers
                                </h1>

                                <p className="mt-1 text-sm text-gray-600">
                                    View and Manage Teachers
                                </p>
                            </div>

                            <div className="flex gap-10">
                                {selectedTeachers.length > 0 && (
                                    <button
                                        onClick={handleDeleteAll}
                                        type="button"
                                        className="rounded-lg bg-red-600 px-6 py-3 font-medium text-white shadow-[0_2px_3px] transition-colors hover:bg-red-600 cursor-pointer"
                                    >
                                        Delete All
                                    </button>
                                )}

                                <label className="flex w-fit cursor-pointer items-center gap-2 rounded-md border border-purple-200 bg-purple-50 px-5 py-3 text-sm font-medium text-purple-900 transition-all">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={showDeleted}
                                            onChange={(e) => {
                                                setShowDeleted(e.target.checked);
                                                setCurrentPage(1);
                                            }}
                                            className="peer sr-only"
                                        />

                                        <div className="h-4 w-7 rounded-full bg-gray-300 transition-colors peer-checked:bg-purple-700"></div>

                                        <div className="absolute left-0.5 top-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-3"></div>
                                    </div>

                                    <span>Show deleted teachers</span>
                                </label>

                                <button
                                    onClick={handleAddTeacher}
                                    type="button"
                                    className="rounded-lg bg-purple-300 px-6 py-3 font-medium text-purple-950 shadow-[0_2px_3px] transition-colors hover:bg-violet-300 cursor-pointer"
                                >
                                    Add Teacher
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-between items-center mb-3">
                            <div className="flex gap-8 mb-3">
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
                                />
                            </div>

                            <div>
                                <SearchBar
                                    search={search}
                                    setSearch={setSearch}
                                />
                            </div>
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

                        <div className="flex justify-between mt-5 items-center">
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
                onConfirm={modalConfirm && modalAction ? modalAction : undefined}
                confirmText={
                    modalTitle === "Permanently Delete Teacher"
                        ? "Delete Permanently"
                        : modalTitle === "Delete Teachers"
                            ? "Yes"
                            : "Restore"
                }
            />
        </div>
    );
}

export default PrincipalViewTeachers;