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

    const [examData, setExamData] = useState<ExamResult[]>([]);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [sortBy, setSortBy] = useState("None");
    const [orderBy, setOrderBy] = useState("asc");

    const [classFilter, setClassFilter] = useState("1st");
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
        }
        catch (error) {
            console.log(error);
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
        fetchExamResults();
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
        <div className="flex flex-col min-h-screen font-fredoka">
            <NavBar />

            <div className="flex flex-1 bg-purple-100">
                <SideBar />

                <div>
                    <Breadcrumb />

                    <div className="flex flex-col pt-12 pl-20 mb-10 mr-10">

                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h1 className="text-3xl font-medium text-gray-900">
                                    Exams
                                </h1>

                                <p className="mt-1 text-sm text-gray-600">
                                    View and Manage Class Exams
                                </p>
                            </div>
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

export default PrincipalViewExams;