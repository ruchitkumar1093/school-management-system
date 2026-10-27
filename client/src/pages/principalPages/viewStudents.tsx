import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import SortBy from "../../components/sortBy";
import OrderBy from "../../components/orderBy";
import ClassFilter from "../../components/classFilter";
import SearchBar from "../../components/searchBar";
import Pagination from "../../components/pagination";
import Limit from "../../components/limit";

import { useState, useEffect, useCallback } from "react";

import {
viewStudents,
deleteStudent,
deleteStudents,
restoreStudent,
permanentlyDeleteStudent
} from "../../services/principalApi";

import PrincipalStudentsTable from "../../components/principalComponents/studentsTable";
import { useLocation, useNavigate } from "react-router-dom";

import Breadcrumb from "../../components/breadcrumb";
import Modal from "../../components/modal";

type Student = {
_id: string;
userId: {
name: string;
uid: string;
isActive: boolean;
};
class: string;
rollNumber: number;
isDeleted: boolean;
deletedAt: string | null;
};

function PrincipalViewStudents() {
const navigate = useNavigate();
const location = useLocation();

const selectedClassFromNavigation: string | undefined =
    location.state?.selectedClass;

const [studentsData, setStudentsData] = useState<Student[]>([]);
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

const [showDeleted, setShowDeleted] = useState(false);
const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

const [modalOpen, setModalOpen] = useState(false);
const [modalTitle, setModalTitle] = useState("");
const [modalMessage, setModalMessage] = useState("");
const [modalConfirm, setModalConfirm] = useState(false);
const [modalAction, setModalAction] =
    useState<(() => void) | null>(null);

const fetchStudents = useCallback(async () => {
    try {
        const response = await viewStudents(
            classFilter,
            debouncedSearch,
            sortBy,
            orderBy,
            currentPage,
            limit,
            showDeleted
        );

        const data = response.data;

        setStudentsData(data.students ?? []);
        setTotalPages(data.totalPages ?? 1);

        // The updated controller will return the available classes.
        if (Array.isArray(data.classes)) {
            setAvailableClasses(data.classes);
        }
    } catch (error) {
        console.error("Failed to fetch students:", error);
        setStudentsData([]);
        setTotalPages(1);
    }
}, [
    classFilter,
    debouncedSearch,
    sortBy,
    orderBy,
    currentPage,
    limit,
    showDeleted
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
    limit,
    showDeleted
]);

useEffect(() => {
    void fetchStudents();
}, [fetchStudents]);

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
    setSelectedStudents(previous =>
        previous.includes(id)
            ? previous.filter(studentId => studentId !== id)
            : [...previous, id]
    );
}

function handleSelectAllStudents() {
    const activeStudentIds = studentsData
        .filter(student => !student.isDeleted)
        .map(student => student._id);

    const allSelected =
        activeStudentIds.length > 0 &&
        activeStudentIds.every(id =>
            selectedStudents.includes(id)
        );

    if (allSelected) {
        setSelectedStudents(previous =>
            previous.filter(id => !activeStudentIds.includes(id))
        );
    } else {
        setSelectedStudents(previous => [
            ...new Set([...previous, ...activeStudentIds])
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

        if (
            studentsData.length === selectedStudents.length &&
            currentPage > 1
        ) {
            setCurrentPage(previous => previous - 1);
        } else {
            await fetchStudents();
        }

        setModalTitle("Success");
        setModalMessage("Selected students deleted successfully.");
        setModalConfirm(false);
        setModalAction(null);
        setModalOpen(true);
    } catch (error: any) {
        console.error("Failed to delete students:", error);

        setModalTitle("Error");
        setModalMessage(
            error.response?.data?.message ||
            "Failed to delete students."
        );
        setModalConfirm(false);
        setModalAction(null);
        setModalOpen(true);
    }
}

function handleEditStudent(id: string) {
    navigate(`studentForm?mode=edit&id=${id}`);
}

function handleDeleteStudent(id: string) {
    setModalTitle("Delete Student");
    setModalMessage(
        "Are you sure you want to delete this student?"
    );
    setModalConfirm(true);
    setModalAction(() => () => confirmDeleteStudent(id));
    setModalOpen(true);
}

async function confirmDeleteStudent(id: string) {
    try {
        await deleteStudent(id);

        setModalOpen(false);
        setModalConfirm(false);
        setModalAction(null);

        if (studentsData.length === 1 && currentPage > 1) {
            setCurrentPage(previous => previous - 1);
        } else {
            await fetchStudents();
        }
    } catch (error: any) {
        console.error("Failed to delete student:", error);

        setModalTitle("Error");
        setModalMessage(
            error.response?.data?.message ||
            "Failed to delete student."
        );
        setModalConfirm(false);
        setModalAction(null);
        setModalOpen(true);
    }
}

async function handleRestoreStudent(id: string) {
    try {
        await restoreStudent(id);

        if (studentsData.length === 1 && currentPage > 1) {
            setCurrentPage(previous => previous - 1);
        } else {
            await fetchStudents();
        }
    } catch (error: any) {
        console.error("Failed to restore student:", error);

        setModalTitle("Error");
        setModalMessage(
            error.response?.data?.message ||
            "Failed to restore student."
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
    setModalAction(
        () => () => confirmPermanentlyDeleteStudent(id)
    );
    setModalOpen(true);
}

async function confirmPermanentlyDeleteStudent(id: string) {
    try {
        await permanentlyDeleteStudent(id);

        if (studentsData.length === 1 && currentPage > 1) {
            setCurrentPage(previous => previous - 1);
        } else {
            await fetchStudents();
        }

        setModalTitle("Success");
        setModalMessage("Student permanently deleted.");
        setModalConfirm(false);
        setModalAction(null);
        setModalOpen(true);
    } catch (error: any) {
        console.error("Failed to permanently delete student:", error);

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

const sortOptions = [
    "None",
    "Student Name",
    "Class",
    "Roll no"
];

const startIndex = (currentPage - 1) * limit;

const activeStudents = studentsData.filter(
    student => !student.isDeleted
);

const allStudentsSelected =
    activeStudents.length > 0 &&
    activeStudents.every(student =>
        selectedStudents.includes(student._id)
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
                                Students
                            </h1>

                            <p className="mt-1 text-sm text-gray-600">
                                View and Manage Students
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            {selectedStudents.length > 0 && (
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

                                <span>Show deleted students</span>
                            </label>
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

                    <div className="w-full">
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
                modalTitle === "Permanently Delete Student"
                    ? "Delete Permanently"
                    : modalTitle === "Delete Students"
                        ? "Yes"
                        : modalTitle === "Delete Student"
                            ? "Delete"
                            : "Confirm"
            }
        />
    </div>
);

}

export default PrincipalViewStudents;