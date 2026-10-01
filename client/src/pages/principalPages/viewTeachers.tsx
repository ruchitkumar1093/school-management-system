import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import PrincipalTeachersTable from "../../components/principalComponents/teachersTable";

import SortBy from "../../components/sortBy";
import OrderBy from "../../components/orderBy";
import ClassFilter from "../../components/classFilter";
import SearchBar from "../../components/searchBar";
import Pagination from "../../components/pagination";
import Limit from "../../components/limit";

import { viewTeachers, deleteTeacher } from "../../services/principalApi";
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

    const [modalOpen, setModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [modalMessage, setModalMessage] = useState("");

    const fetchTeachers = async () => {
        try {
            const teachers = await viewTeachers(
                classFilter,
                debouncedSearch,
                sortBy,
                orderBy,
                currentPage,
                limit
            );

            console.log("Teachers response:", teachers.data);

            setTeachersData(teachers.data.teachers);
            setTotalPages(teachers.data.totalPages);
        }
        catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        fetchTeachers();
    }, [debouncedSearch, sortBy, orderBy, classFilter, currentPage, limit]);

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch, sortBy, orderBy, classFilter, limit]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);

        return () => {
            clearTimeout(timer);
        };
    }, [search]);

    function handleAddTeacher() {
        navigate("teacherForm?mode=add");
    }

    function handleEditTeacher(id: string) {
        navigate(`teacherForm?mode=edit&id=${id}`);
    }

    async function handleDeleteTeacher(id: string) {
        try {
            await deleteTeacher(id);
            await fetchTeachers();
            setModalTitle("Success");
            setModalMessage("Teacher deleted");
            setModalOpen(true);
        }
        catch (error: any) {
            console.log(error);
            setModalTitle("Error");
            setModalMessage(
                error.response?.data?.message || "Failed"
            );
            setModalOpen(true);
        }
    }

    function handleTeacherProfile(id: string) {
        navigate(`teacherProfile?id=${id}`);
    }

    const startIndex = (currentPage - 1) * limit;

    const sortOptions = ["None", "Teacher Name", "Class Assigned"];

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

                            <button
                                onClick={handleAddTeacher}
                                type="button"
                                className="rounded-lg bg-purple-300 px-6 py-3 font-medium text-purple-950 shadow-[0_2px_3px] transition-colors hover:bg-violet-300 cursor-pointer"
                            >
                                Add Teacher
                            </button>
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
                onClose={() => setModalOpen(false)}
            />
        </div>
    );
}

export default PrincipalViewTeachers;