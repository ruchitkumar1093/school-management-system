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

function TeacherViewSubjects() {

    type Subject = {
        _id: string;
        name: string;
        subjectCode: string;
        class: string;
    };

    const [subjectsData, setSubjectsData] =
        useState<Subject[]>([]);

    const [currentPage, setCurrentPage] =
        useState(1);

    const [limit, setLimit] =
        useState(5);

    const [totalPages, setTotalPages] =
        useState(1);

    const [search, setSearch] =
        useState("");

    const [debouncedSearch, setDebouncedSearch] =
        useState("");

    const [orderBy, setOrderBy] =
        useState("asc");

    const fetchSubjects = async () => {
        try {
            const subjects =
                await viewSubjects(
                    debouncedSearch,
                    orderBy,
                    currentPage,
                    limit
                );

            setSubjectsData(
                subjects.data.subjects
            );

            setTotalPages(
                subjects.data.totalPages
            );
        }
        catch (error) {
            console.log(error);

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
        fetchSubjects();
    }, [
        debouncedSearch,
        orderBy,
        currentPage,
        limit
    ]);

    useEffect(() => {
        setCurrentPage(1);
    }, [
        debouncedSearch,
        orderBy,
        limit
    ]);

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

                        <div className="mb-5">

                            <h1 className="text-3xl font-medium text-gray-900">
                                View Subjects
                            </h1>

                            <p className="mt-1 text-sm text-gray-600">
                                View Assigned Subjects
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

                            <TeacherSubjectsTable
                                subject={subjectsData}
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

export default TeacherViewSubjects;