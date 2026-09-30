import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import SortBy from "../../components/sortBy";
import OrderBy from "../../components/orderBy";
import ClassFilter from "../../components/classFilter";
import SearchBar from "../../components/searchBar";
import Pagination from "../../components/pagination";
import Limit from "../../components/limit";
import { viewSubjects, deleteSubject } from "../../services/principalApi";
import PrincipalSubjectsTable from "../../components/principalComponents/subjectsTable";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Breadcrumb from "../../components/breadcrumb";

function PrincipalViewSubjects() {

    type Subject = {
        _id: string;
        name: string;
        subjectCode: string;
        class: string;
        teacherName: string;
    }

    const navigate = useNavigate();

    const [subjectsData, setSubjectsData] = useState<Subject[]>([]);

    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(5);
    const [totalPages, setTotalPages] = useState(1);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [sortBy, setSortBy] = useState("None");
    const [orderBy, setOrderBy] = useState("asc");
    const [classFilter, setClassFilter] = useState("All");

    const fetchSubjects = async () => {
        try {
            const subjects = await viewSubjects(
                classFilter,
                debouncedSearch,
                sortBy,
                orderBy,
                currentPage,
                limit
            );

            console.log("Subjects response:", subjects.data);

            setSubjectsData(subjects.data.subjects);
            setTotalPages(subjects.data.totalPages);
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
        fetchSubjects();
    }, [
        classFilter,
        debouncedSearch,
        sortBy,
        orderBy,
        currentPage,
        limit
    ]);

    useEffect(() => {
        setCurrentPage(1);
    }, [
        classFilter,
        debouncedSearch,
        sortBy,
        orderBy,
        limit
    ]);

    const sortOptions = ["None", "Subject Name", "Class"];

    function handleAddSubject() {
        navigate("subjectForm?mode=add");
    }

    function handleEditSubject(id: string) {
        navigate(`subjectForm?mode=edit&id=${id}`);
    }

    async function handleDeleteSubject(id: string) {
        try {
            await deleteSubject(id);
            await fetchSubjects();
            alert("Subject deleted");
        }
        catch (error: any) {
            console.log(error);
            alert(error.response?.data?.message || "Failed");
        }
    }

    const startIndex = (currentPage - 1) * limit;

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
                                    School Subjects
                                </h1>

                                <p className="mt-1 text-sm text-gray-600">
                                    View and Manage School Subjects
                                </p>
                            </div>

                            <button
                                onClick={handleAddSubject}
                                type="button"
                                className="rounded-lg bg-purple-300 px-6 py-3 font-medium text-purple-950 shadow-[0_2px_3px] transition-colors hover:bg-violet-300 cursor-pointer"
                            >
                                Add Subject
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
                            <PrincipalSubjectsTable
                                subject={subjectsData}
                                handleEditSubject={handleEditSubject}
                                handleDeleteSubject={handleDeleteSubject}
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

export default PrincipalViewSubjects;