import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import SortBy from "../../components/sortBy";
import OrderBy from "../../components/orderBy";
import SearchBar from "../../components/searchBar";
import Pagination from "../../components/pagination";
import Limit from "../../components/limit";
import TeacherStudentsTable from "../../components/teacherComponents/studentsTable";
import { viewStudents, deleteStudent } from "../../services/teacherApi";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Breadcrumb from "../../components/breadcrumb";

function TeacherViewStudents() {

    type Student = {
        _id: string;
        userId: {
            name: string;
            uid: string;
        };
        class: string;
        rollNumber: number;
    }

    const navigate = useNavigate();

    const [studentsData, setStudentsData] = useState<Student[]>([]);

    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(5);
    const [totalPages, setTotalPages] = useState(1);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [sortBy, setSortBy] = useState("None");
    const [orderBy, setOrderBy] = useState("asc");

    const fetchStudents = async () => {
        try {
            const students = await viewStudents(
                debouncedSearch,
                sortBy,
                orderBy,
                currentPage,
                limit
            );

            console.log("Students response:", students.data);

            setStudentsData(students.data.students);
            setTotalPages(students.data.totalPages);
        }
        catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);

        return () => {
            clearTimeout(timer);
        };
    }, [search]);

    useEffect(() => {
        fetchStudents();
    }, [
        debouncedSearch,
        sortBy,
        orderBy,
        currentPage,
        limit
    ]);

    useEffect(() => {
        setCurrentPage(1);
    }, [
        debouncedSearch,
        sortBy,
        orderBy,
        limit
    ]);

    // function handleAddStudent() {
    //     navigate("studentForm?mode=add");
    // }

    function handleEditStudent(id: string) {
        navigate(`studentForm?mode=edit&id=${id}`);
    }

    async function handleDeleteStudent(id: string) {
        try {
            await deleteStudent(id);
            await fetchStudents();
            alert("Student deleted");
        }
        catch (error: any) {
            console.log(error);
            alert(error.response?.data?.message || "Failed");
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

    const startIndex =
        (currentPage - 1) * limit;

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
                                    My Students
                                </h1>

                                <p className="mt-1 text-sm text-gray-600">
                                    View and Manage Students
                                </p>

                            </div>

                            {/* <button onClick={handleAddStudent} type="button" className="p-2 bg-purple-300 rounded-md shadow-[0_2px_1px] hover:bg-violet-300 cursor-pointer">
                                Add Student
                            </button> */}

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

                            </div>

                            <div>

                                <SearchBar
                                    search={search}
                                    setSearch={setSearch}
                                />

                            </div>

                        </div>

                        <div className="flex flex-wrap gap-10">

                            <TeacherStudentsTable
                                student={studentsData}
                                handleEditStudent={handleEditStudent}
                                handleDeleteStudent={handleDeleteStudent}
                                handleStudentProfile={handleStudentProfile}
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

        </div>
    );
}

export default TeacherViewStudents;