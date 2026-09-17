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

    const fetchStudents = async () => {
        try {
            const students = await viewStudents();
            console.log("Students response:", students.data);
            setStudentsData(students.data);
        }
        catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        fetchStudents();
    }, []);

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

    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(5);

    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("None");
    const [orderBy, setOrderBy] = useState("asc");

    let processedStudents = [...studentsData];

    if (search.trim() !== "") {
        processedStudents = processedStudents.filter(
            (student) =>
                student.userId.name
                    .toLowerCase()
                    .includes(search.toLowerCase())
        );
    }

    if (sortBy === "Student Name") {
        processedStudents.sort((a, b) =>
            a.userId.name.localeCompare(b.userId.name));
    }

    if (sortBy === "Class") {
        processedStudents.sort((a, b) => {
            const numA = parseInt(a.class, 10);
            const numB = parseInt(b.class, 10);
            return numA - numB;
        });
    }

    if (sortBy === "Roll no") {
        processedStudents.sort((a, b) =>
            a.rollNumber - b.rollNumber);
    }

    if (sortBy !== "None" && orderBy === "desc") {
        processedStudents.reverse();
    }

    const totalPages = Math.ceil(processedStudents.length / limit);

    const startIndex = (currentPage - 1) * limit;
    const endIndex = startIndex + limit;
    const currentStudents = processedStudents.slice(startIndex, endIndex);

    useEffect(() => {
        setCurrentPage(1);
    }, [sortBy, orderBy, limit]);

        function handleStudentProfile(id: string) {
            navigate(`studentProfile?id=${id}`);
    }

    const sortOptions = ["None", "Student Name", "Class", "Roll no"];

    return (
        <div className="flex flex-col min-h-screen font-fredoka">
            <NavBar />
            <div className="flex flex-1 bg-purple-100">
                <SideBar />
                <div>
                    <Breadcrumb />
                    <div className="flex flex-col pt-12 pl-20 mb-10">
                        <div className="flex justify-between items-center mb-4">
                            <h1 className="text-3xl">My Students:</h1>
                            {/* <button onClick={handleAddStudent} type="button" className="p-2 bg-purple-300 rounded-md
                shadow-[0_2px_1px] hover:bg-violet-300 cursor-pointer">Add Student</button> */}
                        </div>
                        <div className="flex justify-between items-center mb-3">
                            <div className="flex gap-8 mb-3">
                                <SortBy sortOptions={sortOptions} sortBy={sortBy} setSortBy={setSortBy} />
                                <OrderBy orderBy={orderBy} setOrderBy={setOrderBy} disabled={sortBy === "None"} />
                            </div>
                            <div>
                                <SearchBar search={search} setSearch={setSearch} />
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-10">
                            <TeacherStudentsTable
                                student={currentStudents}
                                handleEditStudent={handleEditStudent}
                                handleDeleteStudent={handleDeleteStudent}
                                handleStudentProfile={handleStudentProfile}
                                startIndex={startIndex} />
                        </div>
                        <div className="flex justify-between mt-5 items-center">
                            <div className="mt-1">
                                <Pagination currentPage={currentPage}
                                    totalPages={totalPages}
                                    setCurrentPage={setCurrentPage}
                                />
                            </div>
                            <Limit setLimit={setLimit} limit={limit} />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default TeacherViewStudents;