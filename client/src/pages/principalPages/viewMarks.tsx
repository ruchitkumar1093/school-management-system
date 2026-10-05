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
import PrincipalMarksTable from "../../components/principalComponents/marksTable";
import TeacherFilter from "../../components/teacherFilter";
import SubjectFilter from "../../components/subjectFilter";
import {
    viewMarks,
    deleteMark,
    getMarkTeachers
} from "../../services/principalApi";
import { useNavigate, useSearchParams } from "react-router-dom";
import Breadcrumb from "../../components/breadcrumb";
import Modal from "../../components/modal";

function PrincipalViewMarks() {

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

    type Teacher = {
        id: string;
        name: string;
    };

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [marksData, setMarksData] = useState<Mark[]>([]);

    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(5);
    const [totalPages, setTotalPages] = useState(1);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [sortBy, setSortBy] = useState("None");
    const [orderBy, setOrderBy] = useState("asc");
    const [classFilter, setClassFilter] = useState("All");
    const [examType, setExamType] = useState<ExamType>("All");
    const [subjectFilter, setSubjectFilter] = useState("All");
    const [teacherFilter, setTeacherFilter] = useState(
        searchParams.get("teacher") || "All"
    );

    const [teachers, setTeachers] = useState<Teacher[]>([]);

    const [modalOpen, setModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [modalMessage, setModalMessage] = useState("");
    const [noTeacherMarks, setNoTeacherMarks] = useState(false);

    const fetchMarks = async () => {
        try {
            const marks = await viewMarks(
                classFilter,
                examType,
                debouncedSearch,
                sortBy,
                orderBy,
                currentPage,
                limit,
                subjectFilter,
                teacherFilter
            );

            console.log("Marks response:", marks.data);

            setMarksData(marks.data.marks);
            setTotalPages(marks.data.totalPages);

            setNoTeacherMarks(
                teacherFilter !== "All" &&
                marks.data.marks.length === 0 &&
                marks.data.totalMarks === 0
            );
        }
        catch (error) {
            console.log(error);
            setMarksData([]);
            setTotalPages(1);
            setNoTeacherMarks(false);
        }
    };

    const fetchTeachers = async () => {
        try {
            const response = await getMarkTeachers();
            const teacherList = response.data.teachers;

            setTeachers(teacherList);
        }
        catch (error) {
            console.log(error);
            setTeachers([]);
        }
    };

    useEffect(() => {
        fetchTeachers();
    }, []);

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
        classFilter,
        examType,
        debouncedSearch,
        sortBy,
        orderBy,
        currentPage,
        limit,
        subjectFilter,
        teacherFilter
    ]);

    useEffect(() => {
        setCurrentPage(1);
    }, [
        classFilter,
        examType,
        debouncedSearch,
        sortBy,
        orderBy,
        limit,
        subjectFilter,
        teacherFilter
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
            setModalTitle("Success");
            setModalMessage("Mark deleted");
            setModalOpen(true);
        }
        catch (error: any) {
            console.log(error);
            setModalTitle("Error");
            setModalMessage(
                error.response?.data?.message || "Failed"
            );
            setModalOpen(true);
        }
    }

    const sortOptions = [
        "None",
        "Student Name",
        "Subject Name",
        "Class",
        "Marks Obtained"
    ];

    const startIndex =
        (currentPage - 1) * limit;

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

                                <ClassFilter
                                    classFilter={classFilter}
                                    setClassFilter={setClassFilter}
                                />

                                <ExamFilter
                                    examType={examType}
                                    setExamType={setExamType}
                                />

                                <SubjectFilter
                                    subjectFilter={subjectFilter}
                                    setSubjectFilter={setSubjectFilter}
                                />

                                <TeacherFilter
                                    teacherFilter={teacherFilter}
                                    setTeacherFilter={setTeacherFilter}
                                    teachers={teachers}
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

                            {noTeacherMarks ? (
                                <div className="w-full rounded-lg bg-purple-200 p-6 text-center shadow-md">
                                    <p className="text-lg font-medium text-purple-950">
                                        No records of exam checked.
                                    </p>
                                </div>
                            ) : (
                                <PrincipalMarksTable
                                    marksData={marksData}
                                    handleEditMarks={handleEditMarks}
                                    handleDeleteMarks={handleDeleteMarks}
                                    startIndex={startIndex}
                                />
                            )}

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

            <Modal
                isOpen={modalOpen}
                title={modalTitle}
                message={modalMessage}
                onClose={() => setModalOpen(false)}
            />

        </div>
    );
}

export default PrincipalViewMarks;