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
    const [sortBy, setSortBy] = useState("None");
    const [orderBy, setOrderBy] = useState("asc");

    const [classFilter, setClassFilter] = useState("1st");
    const [examType, setExamType] = useState<ExamType>("class test");

    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(5);


    const fetchExamResults = async () => {
        try {
            const response = await getExamResults(
                classFilter,
                examType
            );
            console.log("Exam results:", response.data);
            setExamData(response.data);
        }
        catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        fetchExamResults();
    }, [classFilter, examType]);


    const sortOptions = [
        "None",
        "Student Name",
        "UID",
        "Total Marks",
        "Percentage"
    ];


    let processedExamData = [...examData];

    if (search.trim() !== "") {
        processedExamData = processedExamData.filter(
            (student) =>
                student.studentName
                    .toLowerCase()
                    .includes(search.toLowerCase())
        );
    }

    if (sortBy === "Student Name") {
        processedExamData.sort((a, b) =>
            a.studentName.localeCompare(b.studentName)
        );
    }

    if (sortBy === "UID") {
        processedExamData.sort((a, b) =>
            a.uid.localeCompare(b.uid)
        );
    }

    if (sortBy === "Total Marks") {
        processedExamData.sort((a, b) => {
            const totalA = a.total?.obtained ?? 0;
            const totalB = b.total?.obtained ?? 0;
            return totalA - totalB;
        });
    }

    if (sortBy === "Percentage") {
        processedExamData.sort((a, b) => {
            const percentageA = a.percentage ?? -1;
            const percentageB = b.percentage ?? -1;
            return percentageA - percentageB;
        });
    }

    if (sortBy !== "None" && orderBy === "desc") {
        processedExamData.reverse();
    }

    const totalPages = Math.ceil(
        processedExamData.length / limit
    );

    const startIndex = (currentPage - 1) * limit;
    const endIndex = startIndex + limit;
    const currentExamData = processedExamData.slice(
        startIndex,
        endIndex
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [sortBy, orderBy, classFilter, examType, search, limit]);

    return (
        <div className="flex flex-col min-h-screen font-fredoka">
            <NavBar />
            <div className="flex flex-1 bg-purple-100">
                <SideBar />
                <div>
                    <Breadcrumb />
                    <div className="flex flex-col pt-12 pl-20 mb-10 mr-10">
                        <div className="flex justify-between items-center mb-4">
                            <h1 className="text-3xl">
                                Exam Results:
                            </h1>
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
                                examData={currentExamData}
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