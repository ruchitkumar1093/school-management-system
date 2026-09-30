import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import OrderBy from "../../components/orderBy";
import SearchBar from "../../components/searchBar";
import Pagination from "../../components/pagination";
import Limit from "../../components/limit";
import StudentSubjectTable from "../../components/studentComponents/subjectTable";
import { viewSubjects } from "../../services/studentApi";
import { useState, useEffect } from "react";
import Breadcrumb from "../../components/breadcrumb";

function StudentViewSubjects() {
    type Subject = {
        _id: string;
        name: string;
        subjectCode: string;
        class: string;
        teacherName: string;
    };

    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [totalPages, setTotalPages] = useState(1);

    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(5);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [orderBy, setOrderBy] = useState("asc");

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);

        return () => clearTimeout(timer);
    }, [search]);

    const fetchSubjects = async () => {
        try {
            const response = await viewSubjects(
                debouncedSearch,
                orderBy,
                currentPage,
                limit
            );

            console.log("Subjects response:", response.data);

            setSubjects(response.data.subjects);
            setTotalPages(response.data.totalPages);
        }
        catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        fetchSubjects();
    }, [debouncedSearch, orderBy, currentPage, limit]);

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch, orderBy, limit]);

    const startIndex = (currentPage - 1) * limit;

    return (
        <div className="flex flex-col min-h-screen font-fredoka">
            <NavBar />
            <div className="flex flex-1 bg-purple-100">
                <SideBar />
                <div>
                    <Breadcrumb />
                    <div className="flex flex-col pt-12 pl-20 mb-10">
                        <div className="mb-5">
                            <h1 className="text-3xl font-medium text-gray-900">
                                Subjects
                            </h1>
                            <p className="mt-1 text-sm text-gray-600">
                                View your Subjects
                            </p>
                        </div>

                        <div className="flex justify-between items-center mb-3">
                            <div className="flex gap-8 mb-3">
                                <OrderBy
                                    orderBy={orderBy}
                                    setOrderBy={setOrderBy}
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
                            <StudentSubjectTable
                                subject={subjects}
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

export default StudentViewSubjects;