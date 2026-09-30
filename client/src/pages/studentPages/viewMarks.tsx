import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import SortBy from "../../components/sortBy";
import OrderBy from "../../components/orderBy";
import ExamFilter from "../../components/examFilter";
import SearchBar from "../../components/searchBar";
import Pagination from "../../components/pagination";
import Limit from "../../components/limit";
import StudentMarksTable from "../../components/studentComponents/marksTable";
import { useState, useEffect } from "react";
import { viewMarks } from "../../services/studentApi";
import Breadcrumb from "../../components/breadcrumb";

function StudentViewMarks() {
    type MarksData = {
        _id: string;
        exam: string;
        marksObtained: number;
        totalMarks: number;
        subjectId: {
            _id: string;
            name: string;
        };
        teacherId: {
            _id: string;
            userId: {
                _id: string;
                name: string;
            };
        };
    };

    type ExamType = "All" | "class test" | "mid term" | "final";

    const [marksData, setMarksData] = useState<MarksData[]>([]);
    const [totalPages, setTotalPages] = useState(1);

    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(5);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [sortBy, setSortBy] = useState("None");
    const [orderBy, setOrderBy] = useState("asc");

    const [examType, setExamType] = useState<ExamType>("All");

    const sortOptions = [
        "None",
        "Subject Name",
        "Marks Obtained"
    ];

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);

        return () => {
            clearTimeout(timer);
        };
    }, [search]);

    const fetchMarks = async () => {
        try {
            const response = await viewMarks(
                examType,
                debouncedSearch,
                sortBy,
                orderBy,
                currentPage,
                limit
            );

            console.log("Marks response:", response.data);

            setMarksData(response.data.marks);
            setTotalPages(response.data.totalPages);
        }
        catch (error) {
            console.log(error);
            setMarksData([]);
            setTotalPages(1);
        }
    };

    useEffect(() => {
        fetchMarks();
    }, [
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
        examType,
        debouncedSearch,
        sortBy,
        orderBy,
        limit
    ]);

    const startIndex = (currentPage - 1) * limit;

    return (
        <div className="flex flex-col min-h-screen font-fredoka">
            <NavBar />
            <div className="flex flex-1 bg-purple-100">
                <SideBar />
                <div>
                    <Breadcrumb />
                    <div className="flex flex-col pt-12 pl-20 mb-10 mr-5">
                        <div className="mb-5">
                            <h1 className="text-3xl font-medium text-gray-900">
                                Marks
                            </h1>

                            <p className="mt-1 text-sm text-gray-600">
                                View your Marks
                            </p>
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

                                <ExamFilter
                                    examType={examType}
                                    setExamType={setExamType}
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
                            <StudentMarksTable
                                marksData={marksData}
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

export default StudentViewMarks;