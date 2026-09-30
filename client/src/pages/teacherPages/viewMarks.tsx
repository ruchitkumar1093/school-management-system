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
    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(5);
    const [totalPages, setTotalPages] = useState(1);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [sortBy, setSortBy] = useState("None");
    const [orderBy, setOrderBy] = useState("asc");

    const [examType, setExamType] =
        useState<ExamType>("All");

    const sortOptions = [
        "None",
        "Student Name",
        "Subject Name",
        "Marks Obtained"
    ];

    const fetchMarks = async () => {
        try {
            const marks = await viewMarks(
                examType,
                debouncedSearch,
                sortBy,
                orderBy,
                currentPage,
                limit
            );

            setMarksData(marks.data.marks);
            setTotalPages(marks.data.totalPages);
        }
        catch (error) {
            console.log(error);
            setMarksData([]);
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
            alert(
                error.response?.data?.message ||
                "Failed"
            );
        }
    }

    const startIndex =
        (currentPage - 1) * limit;

    return (
        <div className="flex flex-col min-h-screen font-fredoka">
            <NavBar />
            <div className="flex flex-1 bg-purple-100">
                <SideBar />
                <div>
                    <Breadcrumb />
                    <div className="flex flex-col pt-12 pl-20 mb-10 mr-5">
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h1 className="text-3xl font-medium text-gray-900">
                                    Marks
                                </h1>
                                <p className="mt-1 text-sm text-gray-600">
                                    View and Manage Student Marks
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handleAddMarks}
                                className="rounded-lg bg-purple-300 px-6 py-3 font-medium text-purple-950 shadow-[0_2px_3px] transition-colors hover:bg-violet-300 cursor-pointer"
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
                                marksData={marksData}
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