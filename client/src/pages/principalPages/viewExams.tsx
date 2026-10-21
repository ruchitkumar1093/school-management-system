
import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import SortBy from "../../components/sortBy";
import OrderBy from "../../components/orderBy";
import ClassFilter from "../../components/classFilter";
import ExamFilter from "../../components/examFilter";
import SearchBar from "../../components/searchBar";
import Pagination from "../../components/pagination";
import Limit from "../../components/limit";

import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

import PrincipalExamTable from "../../components/principalComponents/examTable";
import { getExamResults } from "../../services/principalApi";
import Breadcrumb from "../../components/breadcrumb";

function PrincipalViewExams() {
    type ExamResult = {
        studentName: string;
        uid: string;
        class: string;

        science: {
            obtained: number;
            total: number;
        } | null;

        mathematics: {
            obtained: number;
            total: number;
        } | null;

        english: {
            obtained: number;
            total: number;
        } | null;

        socialScience: {
            obtained: number;
            total: number;
        } | null;

        hindi: {
            obtained: number;
            total: number;
        } | null;

        total: {
            obtained: number;
            total: number;
        } | null;

        percentage: number | null;

        result: string;
    };

    type ExamType = "All" | "class test" | "mid term" | "final";

    const location = useLocation();

    // Receive the selected class from Class Overview.
    const selectedClassFromNavigation: string | undefined =
        location.state?.selectedClass;

    const [examData, setExamData] = useState<ExamResult[]>([]);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [sortBy, setSortBy] = useState("None");
    const [orderBy, setOrderBy] = useState("asc");

    // Preserve the original default when opened directly.
    const [classFilter, setClassFilter] = useState<string>(
        selectedClassFromNavigation ?? "1st"
    );

    const [examType, setExamType] = useState<ExamType>("class test");

    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(5);
    const [totalPages, setTotalPages] = useState(1);

    const fetchExamResults = async () => {
        try {
            const response = await getExamResults(
                classFilter,
                examType,
                debouncedSearch,
                sortBy,
                orderBy,
                currentPage,
                limit
            );

            console.log("Exam results:", response.data);

            setExamData(response.data.results);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            console.log(error);
            setExamData([]);
            setTotalPages(1);
        }
    };

    // Update the selected class if navigation state changes
    // while this page remains mounted.
    useEffect(() => {
        if (
            typeof selectedClassFromNavigation === "string" &&
            selectedClassFromNavigation !== classFilter
        ) {
            setClassFilter(selectedClassFromNavigation);
            setCurrentPage(1);
        }
    }, [selectedClassFromNavigation]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);

        return () => {
            clearTimeout(timer);
        };
    }, [search]);

    useEffect(() => {
        void fetchExamResults();
    }, [
        classFilter,
        examType,
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
        examType,
        debouncedSearch,
        sortBy,
        orderBy,
        limit
    ]);

    const sortOptions = [
        "None",
        "Student Name",
        "UID",
        "Total Marks",
        "Percentage"
    ];

    const startIndex = (currentPage - 1) * limit;

    return (
        <div className="flex min-h-screen flex-col font-fredoka">
            <NavBar />

            <div className="flex flex-1 bg-purple-100">
                <SideBar />

                <div>
                    <Breadcrumb />

                    <div className="mb-10 mr-10 flex flex-col pl-20 pt-12">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-medium text-gray-900">
                                    Exams
                                </h1>

                                <p className="mt-1 text-sm text-gray-600">
                                    View and Manage Class Exams
                                </p>
                            </div>
                        </div>

                        <div className="mb-3 flex items-center justify-between">
                            <div className="mb-3 flex gap-8">
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
                                    showAll={false}
                                />

                                <ExamFilter
                                    examType={examType}
                                    setExamType={setExamType}
                                    showAll={false}
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
                            <PrincipalExamTable
                                examData={examData}
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

export default PrincipalViewExams;
