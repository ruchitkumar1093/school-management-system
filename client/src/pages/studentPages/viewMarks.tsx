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

    type marksData = {
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

    const [marksData, setMarksData] = useState<marksData[]>([]);

    const sortOptions = ["None", "Subject Name", "Marks Obtained"];

    const fetchMarks = async () => {
        try {
            const marks = await viewMarks();
            console.log("Marks response:", marks.data);
            setMarksData(marks.data);
        }
        catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        fetchMarks();
    }, []);

    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(5);

    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("None");
    const [orderBy, setOrderBy] = useState("asc");

    type ExamType = "All" | "class test" | "mid term" | "final";
    const [examType, setExamType] = useState<ExamType>("All");

    let processedMarks = [...marksData];

    if (examType !== "All") {
        processedMarks = processedMarks.filter((mark) => mark.exam === examType)
    };

    if (search.trim() !== "") {
        processedMarks = processedMarks.filter(
            (mark) =>
                mark.subjectId.name
                    .toLowerCase()
                    .includes(search.toLowerCase())
        );
    }

    if (sortBy === "Subject Name") {
        processedMarks.sort((a, b) =>
            a.subjectId.name.localeCompare(b.subjectId.name));
    }


    if (sortBy === "Marks Obtained") {
        processedMarks.sort((a, b) =>
            a.marksObtained - b.marksObtained);
    }

    if (sortBy !== "None" && orderBy === "desc") {
        processedMarks.reverse();
    }

    const totalPages = Math.ceil(processedMarks.length / limit);

    const startIndex = (currentPage - 1) * limit;
    const endIndex = startIndex + limit;
    const currentMarks = processedMarks.slice(startIndex, endIndex);

    useEffect(() => {
        setCurrentPage(1);
    }, [sortBy, orderBy, limit]);

    return (
        <div className="flex flex-col min-h-screen font-fredoka">
            <NavBar />
            <div className="flex flex-1 bg-purple-100">
                <SideBar />
                <div>
                    <Breadcrumb />
                    <div className="flex flex-col pt-12 pl-20 mb-10 mr-5">
                        <h1 className="text-3xl mb-4">My Marks:</h1>
                        <div className="flex justify-between items-center mb-3">
                            <div className="flex gap-8 mb-3">
                                <SortBy sortOptions={sortOptions} sortBy={sortBy} setSortBy={setSortBy} />
                                <OrderBy orderBy={orderBy} setOrderBy={setOrderBy} disabled={sortBy === "None"} />
                                <ExamFilter examType={examType} setExamType={setExamType} />
                            </div>
                            <div>
                                <SearchBar search={search} setSearch={setSearch} />
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-10">
                            <StudentMarksTable
                                marksData={currentMarks}
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

export default StudentViewMarks;