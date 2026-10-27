import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import OrderBy from "../../components/orderBy";
import SearchBar from "../../components/searchBar";
import Pagination from "../../components/pagination";
import Limit from "../../components/limit";
import { viewSubjects } from "../../services/teacherApi";
import TeacherSubjectsTable from "../../components/teacherComponents/subjectsTable";
import { useState, useEffect } from "react";
import Breadcrumb from "../../components/breadcrumb";

type Subject = {
    _id: string;
    name: string;
    subjectCode: string;
    class: string;
};

function TeacherViewSubjects() {
    const [subjectsData, setSubjectsData] = useState<Subject[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [orderBy, setOrderBy] = useState("asc");

    const fetchSubjects = async () => {
        try {
            const response = await viewSubjects(
                debouncedSearch,
                orderBy,
                currentPage,
                limit
            );

            setSubjectsData(response.data.subjects);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            console.error("Failed to fetch assigned subjects:", error);
            setSubjectsData([]);
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
        void fetchSubjects();
    }, [debouncedSearch, orderBy, currentPage, limit]);

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch, orderBy, limit]);

    const startIndex = (currentPage - 1) * limit;

    return (
        <div className="flex min-h-screen flex-col font-fredoka">
            <NavBar />

            <div className="flex flex-1 bg-purple-100">
                <SideBar />

                <div>
                    <Breadcrumb />

                    <div className="mb-10 flex flex-col pl-20 pt-12">
                        <div className="mb-5">
                            <h1 className="text-3xl font-medium text-gray-900">
                                View Subjects
                            </h1>

                            <p className="mt-1 text-sm text-gray-600">
                                View Assigned Subjects
                            </p>
                        </div>

                        <div className="mb-3 flex items-center justify-between">
                            <div className="mb-3 flex gap-8">
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
                            <TeacherSubjectsTable
                                subject={subjectsData}
                                startIndex={startIndex}
                            />
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
        </div>
    );
}

export default TeacherViewSubjects;
