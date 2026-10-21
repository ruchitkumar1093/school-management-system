import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import SortBy from "../../components/sortBy";
import OrderBy from "../../components/orderBy";
import ExamFilter from "../../components/examFilter";
import SubjectFilter from "../../components/subjectFilter";
import SearchBar from "../../components/searchBar";
import Pagination from "../../components/pagination";
import Limit from "../../components/limit";
import { useState, useEffect, useCallback } from "react";
import TeacherMarksTable from "../../components/teacherComponents/marksTable";
import {
    viewMarks,
    deleteMark,
    getTeacherSubjects,
} from "../../services/teacherApi";
import { useNavigate } from "react-router-dom";
import Breadcrumb from "../../components/breadcrumb";
import Modal from "../../components/modal";

function TeacherViewMarks() {
    type ExamType = "All" | "class test" | "mid term" | "final";

    type Mark = {
        _id: string;
        studentId: {
            _id: string;
            class: string;
            userId: {
                name: string;
                uid: string;
            } | null;
        } | null;
        subjectId: {
            name: string;
        } | null;
        exam: string;
        marksObtained: number;
        totalMarks: number;
    };

    type TeacherSubject = {
        _id: string;
        name: string;
        class: string;
        subjectCode: string;
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
    const [examType, setExamType] = useState<ExamType>("All");

    const [teacherSubjects, setTeacherSubjects] = useState<
        TeacherSubject[]
    >([]);
    const [subjectFilter, setSubjectFilter] = useState("All");
    const [subjectsLoading, setSubjectsLoading] = useState(true);

    const [modalOpen, setModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [modalMessage, setModalMessage] = useState("");
    const [modalConfirm, setModalConfirm] = useState(false);
    const [modalAction, setModalAction] =
        useState<(() => void) | null>(null);

    const sortOptions = [
        "None",
        "Student Name",
        "Subject Name",
        "Marks Obtained",
    ];

    // Fetch only the subjects permitted for the logged-in teacher.
    useEffect(() => {
        const fetchTeacherSubjects = async () => {
            try {
                setSubjectsLoading(true);

                const response = await getTeacherSubjects();
                const subjects: TeacherSubject[] =
                    response.data.subjects;

                setTeacherSubjects(subjects);

            } catch (error) {
                console.log(error);
                setTeacherSubjects([]);
                setSubjectFilter("");
            } finally {
                setSubjectsLoading(false);
            }
        };

        fetchTeacherSubjects();
    }, []);

    const fetchMarks = useCallback(async () => {
        if (subjectsLoading) {
            return;
        }

        if (teacherSubjects.length === 0) {
            setMarksData([]);
            setTotalPages(1);
            return;
        }

        if (
            subjectFilter !== "All" &&
            !teacherSubjects.some(
                (subject) => subject.name === subjectFilter
            )
        ) {
            setMarksData([]);
            setTotalPages(1);
            return;
        }

        try {
            const selectedSubject =
                subjectFilter === "All" ? "All" : subjectFilter;

            const response = await viewMarks(
                examType,
                debouncedSearch,
                sortBy,
                orderBy,
                currentPage,
                limit,
                selectedSubject
            );

            setMarksData(response.data.marks);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            console.log(error);
            setMarksData([]);
            setTotalPages(1);
        }
    }, [
        subjectsLoading,
        teacherSubjects,
        subjectFilter,
        examType,
        debouncedSearch,
        sortBy,
        orderBy,
        currentPage,
        limit,
    ]);

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
    }, [fetchMarks]);

    useEffect(() => {
        setCurrentPage(1);
    }, [
        examType,
        debouncedSearch,
        sortBy,
        orderBy,
        limit,
        subjectFilter,
    ]);

    function handleAddMarks() {
        navigate("marksForm?mode=add");
    }

    function handleEditMarks(id: string) {
        navigate(`marksForm?mode=edit&id=${id}`);
    }

    function handleDeleteMarks(id: string) {
        setModalTitle("Delete Mark");
        setModalMessage("Are you sure you want to delete this mark?");
        setModalConfirm(true);
        setModalAction(() => () => confirmDeleteMarks(id));
        setModalOpen(true);
    }

    async function confirmDeleteMarks(id: string) {
        try {
            await deleteMark(id);

            setModalOpen(false);
            setModalConfirm(false);
            setModalAction(null);

            if (marksData.length === 1 && currentPage > 1) {
                setCurrentPage((prev) => prev - 1);
            } else {
                await fetchMarks();
            }
        } catch (error: any) {
            console.log(error);

            setModalTitle("Error");
            setModalMessage(
                error.response?.data?.message || "Failed to delete mark."
            );
            setModalConfirm(false);
            setModalAction(null);
            setModalOpen(true);
        }
    }

    const startIndex = (currentPage - 1) * limit;

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

                                <SubjectFilter
                                    subjectFilter={subjectFilter}
                                    setSubjectFilter={setSubjectFilter}
                                    subjects={teacherSubjects.map(
                                        (subject) => subject.name
                                    )}
                                    disabled={subjectsLoading}
                                />
                            </div>

                            <div>
                                <SearchBar
                                    search={search}
                                    setSearch={setSearch}
                                />
                            </div>
                        </div>

                        {subjectsLoading ? (
                            <p className="py-8 text-center text-gray-600">
                                Loading your assigned subjects...
                            </p>
                        ) : teacherSubjects.length === 0 ? (
                            <p className="py-8 text-center text-gray-600">
                                No subjects are assigned to you.
                            </p>
                        ) : (
                            <>
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
                            </>
                        )}
                    </div>
                </div>
            </div>

            <Modal
                isOpen={modalOpen}
                title={modalTitle}
                message={modalMessage}
                onClose={() => {
                    setModalOpen(false);
                    setModalConfirm(false);
                    setModalAction(null);
                }}
                onConfirm={
                    modalConfirm && modalAction
                        ? modalAction
                        : undefined
                }
                confirmText={
                    modalTitle === "Delete Mark" ? "Delete" : "Confirm"
                }
            />
        </div>
    );
}

export default TeacherViewMarks;