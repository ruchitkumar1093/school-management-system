import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import SortBy from "../../components/sortBy";
import OrderBy from "../../components/orderBy";
import ExamFilter from "../../components/examFilter";
import SearchBar from "../../components/searchBar";

import Pagination from "../../components/pagination";
import Limit from "../../components/limit";

import { useState, useEffect } from "react";
import TeacherMarksTable from "../../components/teacherComponents/marksTable";
import { viewMarks, deleteMark } from "../../services/teacherApi";
import { useNavigate } from "react-router-dom";
import Breadcrumb from "../../components/breadcrumb";

function TeacherViewMarks() {

    type ExamType = "All" | "class test" | "mid term" | "final";

    type Mark = {
        _id: string;

        studentId: {
            class: string;
            userId: {
                name: string;
                uid: string;
            };
        } | null;

        teacherId: {
            userId: {
                name: string;
            };
        } | null;

        subjectId: {
            name: string;
        } | null;

        exam: string;
        marksObtained: number;
        totalMarks: number;
    };


    const navigate = useNavigate();

    const [marksData, setMarksData] = useState<Mark[]>([]);

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

    function handleAddMarks() {
        navigate("marksForm?mode=add");
    }

    function handleEditMarks(id: string) {
        navigate(`marksForm?mode=edit&id=${id}`);
    }

    async function handleDeleteMarks(id: string) {
        try {
            await deleteMark(id);
            await fetchMarks();
            alert("Mark deleted");
        }
        catch (error: any) {
            console.log(error);
            alert(error.response?.data?.message || "Failed");
        }
    }

    const sortOptions = ["None", "Student Name", "Subject Name", "Marks Obtained"];

    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(5);

    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("None");
    const [orderBy, setOrderBy] = useState("asc");

    const [examType, setExamType] = useState<ExamType>("All");

    let processedMarks = [...marksData];

    if (examType !== "All") {
        processedMarks = processedMarks.filter(
            (mark) => mark.exam === examType
        )
    };

    if (search.trim() !== "") {
        processedMarks = processedMarks.filter(
            (mark) =>
                mark.studentId?.userId?.name
                    ?.toLowerCase()
                    .includes(search.toLowerCase())
        );
    }

    if (sortBy === "Student Name") {
        processedMarks.sort((a, b) =>
            a.studentId?.userId?.name?.localeCompare(
                b.studentId?.userId?.name ?? ""
            ) ?? 0
        );
    }

    if (sortBy === "Subject Name") {
        processedMarks.sort((a, b) =>
            a.subjectId?.name?.localeCompare(
                b.subjectId?.name ?? ""
            ) ?? 0
        );
    }


    if (sortBy === "Marks Obtained") {
        processedMarks.sort((a, b) =>
            a.marksObtained - b.marksObtained
        );
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
                        <div className="flex justify-between items-center mb-10">
                            <h1 className="text-3xl">Student Marks:</h1>

                            <button
                                type="button"
                                onClick={handleAddMarks}
                                className="p-2 bg-purple-300 rounded-md
                                shadow-[0_2px_1px] hover:bg-violet-300 cursor-pointer"
                            >
                                Add Marks
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
                            <TeacherMarksTable
                                marksData={currentMarks}
                                handleEditMarks={handleEditMarks}
                                handleDeleteMarks={handleDeleteMarks}
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

export default TeacherViewMarks;