import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import SortBy from "../../components/sortBy";
import OrderBy from "../../components/orderBy";
import ClassFilter from "../../components/classFilter";
import SearchBar from "../../components/searchBar";
import Pagination from "../../components/pagination";
import Limit from "../../components/limit";

import { useState, useEffect } from "react";

import {
    viewStudents,
    deleteStudent,
    deleteStudents,
    restoreStudent,
    permanentlyDeleteStudent
} from "../../services/principalApi";

import PrincipalStudentsTable from "../../components/principalComponents/studentsTable";
import { useNavigate } from "react-router-dom";

import Breadcrumb from "../../components/breadcrumb";
import Modal from "../../components/modal";

function PrincipalViewStudents() {
    type Student = {
        _id: string;
        userId: {
            name: string;
            uid: string;
        };
        class: string;
        rollNumber: number;
        isDeleted: boolean;
        deletedAt: string | null;
    };

    const navigate = useNavigate();

    const [studentsData, setStudentsData] = useState<Student[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(5);
    const [totalPages, setTotalPages] = useState(1);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [sortBy, setSortBy] = useState("None");
    const [orderBy, setOrderBy] = useState("asc");
    const [classFilter, setClassFilter] = useState("All");
    const [showDeleted, setShowDeleted] = useState(false);

    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

    const [modalOpen, setModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [modalMessage, setModalMessage] = useState("");
    const [modalConfirm, setModalConfirm] = useState(false);
    const [modalAction, setModalAction] = useState<(() => void) | null>(null);

    const fetchStudents = async () => {
        try {
            const students = await viewStudents(
                classFilter,
                debouncedSearch,
                sortBy,
                orderBy,
                currentPage,
                limit,
                showDeleted
            );

            console.log("Students response:", students.data);

            setStudentsData(students.data.students);
            setTotalPages(students.data.totalPages);
        }
        catch (error) {
            console.log(error);
            setStudentsData([]);
            setTotalPages(1);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);

        return () => {
            clearTimeout(timer);
        };
    }, [search]);

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
        fetchStudents();
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
        setSelectedStudents([]);
    }, [
        debouncedSearch,
        sortBy,
        orderBy,
        classFilter,
        currentPage,
        limit,
        showDeleted
    ]);

    function handleSelectStudent(id: string) {
        setSelectedStudents((prev) =>
            prev.includes(id)
                ? prev.filter((studentId) => studentId !== id)
                : [...prev, id]
        );
    }

    function handleSelectAllStudents() {
        const activeStudentIds = studentsData
            .filter((student) => !student.isDeleted)
            .map((student) => student._id);

        const allSelected =
            activeStudentIds.length > 0 &&
            activeStudentIds.every((id) =>
                selectedStudents.includes(id)
            );

        if (allSelected) {
            setSelectedStudents((prev) =>
                prev.filter((id) => !activeStudentIds.includes(id))
            );
        }
        else {
            setSelectedStudents((prev) => [
                ...new Set([...prev, ...activeStudentIds])
            ]);
        }
    }

    function handleDeleteAll() {
        if (selectedStudents.length === 0) {
            return;
        }

        setModalTitle("Delete Students");
        setModalMessage(
            `Are you sure you want to delete ${selectedStudents.length} selected student${selectedStudents.length > 1 ? "s" : ""}?`
        );
        setModalConfirm(true);
        setModalAction(() => () => confirmDeleteAll());
        setModalOpen(true);
    }

    async function confirmDeleteAll() {
        try {
            await deleteStudents(selectedStudents);

            setSelectedStudents([]);

            if (studentsData.length === selectedStudents.length && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            }
            else {
                await fetchStudents();
            }

            setModalTitle("Success");
            setModalMessage("Selected students deleted successfully.");
            setModalConfirm(false);
            setModalAction(null);
            setModalOpen(true);
        }
        catch (error: any) {
            console.log(error);

            setModalTitle("Error");
            setModalMessage(
                error.response?.data?.message || "Failed to delete students."
            );
            setModalConfirm(false);
            setModalAction(null);
            setModalOpen(true);
        }
    }

    function handleEditStudent(id: string) {
        navigate(`studentForm?mode=edit&id=${id}`);
    }

    async function handleDeleteStudent(id: string) {
        try {
            await deleteStudent(id);

            if (studentsData.length === 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            }
            else {
                await fetchStudents();
            }

            setModalTitle("Success");
            setModalMessage("Student deleted");
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

    function handleRestoreStudent(id: string) {
        setModalTitle("Restore Student");
        setModalMessage(
            "Are you sure you want to restore this student?"
        );
        setModalConfirm(true);
        setModalAction(() => () => confirmRestoreStudent(id));
        setModalOpen(true);
    }

    async function confirmRestoreStudent(id: string) {
        try {
            await restoreStudent(id);

            if (studentsData.length === 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            }
            else {
                await fetchStudents();
            }

            setModalTitle("Success");
            setModalMessage("Student restored successfully.");
            setModalConfirm(false);
            setModalAction(null);
            setModalOpen(true);
        }
        catch (error: any) {
            console.log(error);

            setModalTitle("Error");
            setModalMessage(
                error.response?.data?.message || "Failed to restore student."
            );
            setModalConfirm(false);
            setModalAction(null);
            setModalOpen(true);
        }
    }

    function handlePermanentlyDeleteStudent(id: string) {
        setModalTitle("Permanently Delete Student");
        setModalMessage(
            "Are you sure you want to permanently delete this student? This action cannot be undone."
        );
        setModalConfirm(true);
        setModalAction(() => () => confirmPermanentlyDeleteStudent(id));
        setModalOpen(true);
    }

    async function confirmPermanentlyDeleteStudent(id: string) {
        try {
            await permanentlyDeleteStudent(id);

            if (studentsData.length === 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            }
            else {
                await fetchStudents();
            }

            setModalTitle("Success");
            setModalMessage("Student permanently deleted.");
            setModalConfirm(false);
            setModalAction(null);
            setModalOpen(true);
        }
        catch (error: any) {
            console.log(error);

            setModalTitle("Error");
            setModalMessage(
                error.response?.data?.message ||
                "Failed to permanently delete student."
            );
            setModalConfirm(false);
            setModalAction(null);
            setModalOpen(true);
        }
    }

    function handleStudentProfile(id: string) {
        navigate(`studentProfile?id=${id}`);
    }

    const sortOptions = ["None", "Student Name", "Class", "Roll no"];

    const startIndex = (currentPage - 1) * limit;

    const activeStudents = studentsData.filter(
        (student) => !student.isDeleted
    );

    const allStudentsSelected =
        activeStudents.length > 0 &&
        activeStudents.every((student) =>
            selectedStudents.includes(student._id)
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
                                    Students
                                </h1>

                                <p className="mt-1 text-sm text-gray-600">
                                    View and Manage Students
                                </p>
                            </div>

                            <div className="flex gap-10">
                                {selectedStudents.length > 0 && (
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

                                    <span>Show deleted students</span>
                                </label>
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
                            <PrincipalStudentsTable
                                student={studentsData}
                                handleEditStudent={handleEditStudent}
                                handleDeleteStudent={handleDeleteStudent}
                                handleStudentProfile={handleStudentProfile}
                                handleRestoreStudent={handleRestoreStudent}
                                handlePermanentlyDeleteStudent={handlePermanentlyDeleteStudent}
                                selectedStudents={selectedStudents}
                                handleSelectStudent={handleSelectStudent}
                                handleSelectAllStudents={handleSelectAllStudents}
                                allStudentsSelected={allStudentsSelected}
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
                onConfirm={
                    modalConfirm && modalAction
                        ? modalAction
                        : undefined
                }
                confirmText={
                    modalTitle === "Permanently Delete Student"
                        ? "Delete Permanently"
                        : modalTitle === "Delete Students"
                            ? "Yes"
                            : "Restore"
                }
            />
        </div>
    );
}

export default PrincipalViewStudents;