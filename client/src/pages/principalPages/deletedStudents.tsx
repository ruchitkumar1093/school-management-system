import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import Breadcrumb from "../../components/breadcrumb";
import SearchBar from "../../components/searchBar";
import Pagination from "../../components/pagination";
import Limit from "../../components/limit";
import Modal from "../../components/modal";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiRotateCcw } from "react-icons/fi";
import { getDeletedStudents, restoreStudent } from "../../services/principalApi";

type Student = {
    _id: string;
    userId: {
        name: string;
        uid: string;
    };
    class: string;
    rollNumber: number;
    deletedAt: string;
};

function DeletedStudents() {
    const navigate = useNavigate();

    const [studentsData, setStudentsData] = useState<Student[]>([]);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(5);
    const [totalPages, setTotalPages] = useState(1);

    const [restoreId, setRestoreId] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [modalMessage, setModalMessage] = useState("");
    const [modalConfirm, setModalConfirm] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setCurrentPage(1);
        }, 500);

        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        fetchDeletedStudents();
    }, [debouncedSearch, currentPage, limit]);

    async function fetchDeletedStudents() {
        try {
            const response = await getDeletedStudents(
                debouncedSearch,
                currentPage,
                limit
            );

            setStudentsData(response.data.students);
            setTotalPages(response.data.totalPages);
        }
        catch (error) {
            console.log(error);
            setStudentsData([]);
            setTotalPages(1);
        }
    }

    function handleRestoreStudent(id: string) {
        setRestoreId(id);
        setModalTitle("Restore Student");
        setModalMessage("Are you sure you want to restore this student?");
        setModalConfirm(true);
        setModalOpen(true);
    }

    async function confirmRestoreStudent() {
        if (!restoreId) {
            return;
        }

        try {
            await restoreStudent(restoreId);

            setModalOpen(false);
            setRestoreId(null);

            if (studentsData.length === 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            }
            else {
                fetchDeletedStudents();
            }

            setModalTitle("Success");
            setModalMessage("Student restored successfully.");
            setModalConfirm(false);
            setModalOpen(true);
        }
        catch (error) {
            console.log(error);

            setModalOpen(false);
            setModalTitle("Error");
            setModalMessage("Failed to restore student.");
            setModalConfirm(false);
            setModalOpen(true);
        }
    }

    function handleBack() {
        navigate("../viewStudents");
    }

    function handleCloseModal() {
        setModalOpen(false);
        setRestoreId(null);
        setModalConfirm(false);
    }

    const startIndex = (currentPage - 1) * limit;

    return (
        <div className="flex min-h-screen flex-col font-fredoka">
            <NavBar />

            <div className="flex flex-1 bg-purple-100">
                <SideBar />

                <div>
                    <Breadcrumb />

                    <div className="mb-10 flex flex-col pt-12 pl-20 mr-10">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-medium text-gray-900">
                                    Deleted Students
                                </h1>

                                <p className="mt-1 text-sm text-gray-600">
                                    View and Restore Deleted Students
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handleBack}
                                className="cursor-pointer rounded-lg bg-purple-300 px-6 py-3 font-medium text-purple-950 shadow-[0_2px_3px] transition-colors hover:bg-violet-300"
                            >
                                Back to Students
                            </button>
                        </div>

                        <div className="mb-3 flex justify-end">
                            <SearchBar
                                search={search}
                                setSearch={setSearch}
                            />
                        </div>

                        <div className="overflow-x-auto rounded-lg shadow-md">
                            <table className="w-full border-collapse bg-purple-200 text-left text-gray-900">
                                <thead>
                                    <tr className="border-b border-purple-300 bg-purple-300/80">
                                        <th className="border-r border-purple-300 p-3 font-semibold text-purple-950">
                                            S.No.
                                        </th>
                                        <th className="border-r border-purple-300 p-3 font-semibold text-purple-950">
                                            Student Name:
                                        </th>
                                        <th className="border-r border-purple-300 p-3 font-semibold text-purple-950">
                                            UID:
                                        </th>
                                        <th className="border-r border-purple-300 p-3 font-semibold text-purple-950">
                                            Class:
                                        </th>
                                        <th className="border-r border-purple-300 p-3 font-semibold text-purple-950">
                                            Roll No:
                                        </th>
                                        <th className="border-r border-purple-300 p-3 font-semibold text-purple-950">
                                            Deleted At:
                                        </th>
                                        <th className="p-3 font-semibold text-purple-950">
                                            Actions:
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {studentsData.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="p-4 text-center text-gray-500"
                                            >
                                                No deleted students found
                                            </td>
                                        </tr>
                                    ) : (
                                        studentsData.map((student, index) => (
                                            <tr
                                                key={student._id}
                                                className="border-b border-purple-300 last:border-b-0 transition-colors hover:bg-purple-300/40"
                                            >
                                                <td className="border-r border-purple-300 p-3 font-medium">
                                                    {startIndex + index + 1}
                                                </td>

                                                <td className="border-r border-purple-300 p-3 font-medium">
                                                    {student.userId.name}
                                                </td>

                                                <td className="border-r border-purple-300 p-3">
                                                    {student.userId.uid.toUpperCase()}
                                                </td>

                                                <td className="border-r border-purple-300 p-3">
                                                    {student.class}
                                                </td>

                                                <td className="border-r border-purple-300 p-3">
                                                    {student.rollNumber}
                                                </td>

                                                <td className="border-r border-purple-300 p-3">
                                                    {new Date(
                                                        student.deletedAt
                                                    ).toLocaleDateString()}
                                                </td>

                                                <td className="p-3">
                                                    <button
                                                        type="button"
                                                        title="Restore"
                                                        onClick={() =>
                                                            handleRestoreStudent(
                                                                student._id
                                                            )
                                                        }
                                                        className="cursor-pointer p-1.5 text-purple-900 transition-colors hover:text-green-700"
                                                    >
                                                        <FiRotateCcw className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
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

            <Modal
                isOpen={modalOpen}
                title={modalTitle}
                message={modalMessage}
                onClose={handleCloseModal}
                onConfirm={modalConfirm ? confirmRestoreStudent : undefined}
                confirmText="Restore"
            />
        </div>
    );
}

export default DeletedStudents;