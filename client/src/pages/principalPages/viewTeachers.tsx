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
    }

    const navigate = useNavigate();

    const [teachersData, setTeachersData] = useState<Teacher[]>([]);

    const fetchTeachers = async () => {
        try {
            const teachers = await viewTeachers();
            console.log("Teachers response:", teachers.data);
            setTeachersData(teachers.data);
        }
        catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        fetchTeachers();
    }, []);

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
            alert("Teacher deleted");
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
    const [classFilter, setClassFilter] = useState("All");

    let processedTeachers = [...teachersData];
    if (classFilter !== "All") {
        processedTeachers = processedTeachers.filter((teacher) => teacher.classAssigned === classFilter)
    };

    if (search.trim() !== "") {
        processedTeachers = processedTeachers.filter(
            (teacher) =>
                teacher.userId.name
                    .toLowerCase()
                    .includes(search.toLowerCase())
        );
    }

    if (sortBy === "Teacher Name") {
        processedTeachers.sort((a, b) =>
            a.userId.name.localeCompare(b.userId.name));
    }

    if (sortBy === "Class Assigned") {
        processedTeachers.sort((a, b) => {
            const numA = parseInt(a.classAssigned, 10);
            const numB = parseInt(b.classAssigned, 10);
            return numA - numB;
        });
    }

    if (sortBy !== "None" && orderBy === "desc") {
        processedTeachers.reverse();
    }

    const totalPages = Math.ceil(processedTeachers.length / limit);

    const startIndex = (currentPage - 1) * limit;
    const endIndex = startIndex + limit;
    const currentTeachers = processedTeachers.slice(startIndex, endIndex);

    useEffect(() => {
        setCurrentPage(1);
    }, [sortBy, orderBy, classFilter, limit]);

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
                        <h1 className="text-3xl">All Teachers:</h1>
                        <button onClick={handleAddTeacher} type="button" className="p-2 bg-purple-300 rounded-md
                shadow-[0_2px_1px] hover:bg-violet-300 cursor-pointer">Add Teacher</button>
                    </div>
                    <div className="flex justify-between items-center mb-3">
                        <div className="flex gap-8 mb-3">
                            <SortBy sortOptions={sortOptions} sortBy={sortBy} setSortBy={setSortBy} />
                            <OrderBy orderBy={orderBy} setOrderBy={setOrderBy} disabled={sortBy === "None"} />
                            <ClassFilter classFilter={classFilter} setClassFilter={setClassFilter} />
                        </div>
                        <div>
                            <SearchBar search={search} setSearch={setSearch} />
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-10">
                        <PrincipalTeachersTable
                            teacher={currentTeachers}
                            handleEditTeacher={handleEditTeacher}
                            handleDeleteTeacher={handleDeleteTeacher}
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

export default PrincipalViewTeachers;