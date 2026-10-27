import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import SortBy from "../../components/sortBy";
import OrderBy from "../../components/orderBy";
import ExamFilter from "../../components/examFilter";
import ClassFilter from "../../components/classFilter";
import SearchBar from "../../components/searchBar";
import Pagination from "../../components/pagination";
import Limit from "../../components/limit";
import { useState, useEffect, useMemo } from "react";
import TeacherExamTable from "../../components/teacherComponents/examTable";
import {
getExamResults,
getTeacherSubjects,
} from "../../services/teacherApi";
import Breadcrumb from "../../components/breadcrumb";

type SubjectMarks = {
obtained: number;
total: number;
};

type ExamResult = {
studentName: string;
uid: string;
class: string;
subjects: Record<string, SubjectMarks | null>;
total: SubjectMarks | null;
percentage: number | null;
result: string;
};

type TeacherSubject = {
_id: string;
name: string;
class: string;
subjectCode: string;
};

type ExamType =
| "All"
| "class test"
| "mid term"
| "final";

function TeacherViewExams() {
const [examData, setExamData] = useState<ExamResult[]>([]);
const [allSubjects, setAllSubjects] = useState<TeacherSubject[]>([]);

const [search, setSearch] = useState("");
const [debouncedSearch, setDebouncedSearch] = useState("");

const [sortBy, setSortBy] = useState("None");
const [orderBy, setOrderBy] = useState("asc");
const [examType, setExamType] =
    useState<ExamType>("class test");

const [currentPage, setCurrentPage] = useState(1);
const [limit, setLimit] = useState(10);
const [totalPages, setTotalPages] = useState(1);

// Used to determine the teacher's assigned classes.
const [teacherSubjects, setTeacherSubjects] = useState<
    TeacherSubject[]
>([]);

const [classFilter, setClassFilter] = useState("All");
const [subjectsLoading, setSubjectsLoading] = useState(true);
const [resultsLoading, setResultsLoading] = useState(false);

const sortOptions = [
    "None",
    "Student Name",
    "UID",
    "Total Marks",
    "Percentage",
];

// Fetch the teacher's assignments.
useEffect(() => {
    const fetchTeacherSubjects = async () => {
        try {
            setSubjectsLoading(true);

            const response = await getTeacherSubjects();

            const assignedSubjects: TeacherSubject[] =
                response.data.subjects ?? [];

            setTeacherSubjects(assignedSubjects);
        } catch (error) {
            console.error(
                "Failed to load teacher assignments:",
                error
            );

            setTeacherSubjects([]);
            setClassFilter("All");
        } finally {
            setSubjectsLoading(false);
        }
    };

    void fetchTeacherSubjects();
}, []);

// Determine which classes the teacher can access.
const teacherClasses = useMemo(() => {
    return Array.from(
        new Set(
            teacherSubjects.map((subject) => subject.class)
        )
    ).sort((a, b) => {
        return (
            Number.parseInt(a, 10) -
            Number.parseInt(b, 10)
        );
    });
}, [teacherSubjects]);

// Fetch exam results and all subjects in the selected classes.
useEffect(() => {
    if (subjectsLoading) {
        return;
    }

    if (teacherClasses.length === 0) {
        setExamData([]);
        setAllSubjects([]);
        setTotalPages(1);
        setResultsLoading(false);
        return;
    }

    if (
        classFilter !== "All" &&
        !teacherClasses.includes(classFilter)
    ) {
        setExamData([]);
        setAllSubjects([]);
        setTotalPages(1);
        setResultsLoading(false);
        return;
    }

    let cancelled = false;

    const fetchExamResults = async () => {
        try {
            setResultsLoading(true);

            const response = await getExamResults(
                examType,
                debouncedSearch,
                sortBy,
                orderBy,
                currentPage,
                limit,
                classFilter
            );

            if (cancelled) {
                return;
            }

            setExamData(response.data.results ?? []);
            setAllSubjects(response.data.subjects ?? []);
            setTotalPages(response.data.totalPages || 1);
        } catch (error) {
            if (cancelled) {
                return;
            }

            console.error(
                "Failed to load exam results:",
                error
            );

            setExamData([]);
            setAllSubjects([]);
            setTotalPages(1);
        } finally {
            if (!cancelled) {
                setResultsLoading(false);
            }
        }
    };

    void fetchExamResults();

    return () => {
        cancelled = true;
    };
}, [
    subjectsLoading,
    teacherClasses,
    classFilter,
    examType,
    debouncedSearch,
    sortBy,
    orderBy,
    currentPage,
    limit,
]);

// Debounce search input.
useEffect(() => {
    const timer = setTimeout(() => {
        setDebouncedSearch(search);
    }, 500);

    return () => clearTimeout(timer);
}, [search]);

// Reset pagination when filters change.
useEffect(() => {
    setCurrentPage(1);
}, [
    examType,
    debouncedSearch,
    sortBy,
    orderBy,
    limit,
    classFilter,
]);

const startIndex = (currentPage - 1) * limit;

return (
    <div className="flex min-h-screen flex-col font-fredoka">
        <NavBar />

        <div className="flex min-w-0 flex-1 bg-purple-100">
            <SideBar />

            {/* Main content must be allowed to shrink beside the sidebar. */}
            <div className="min-w-0 flex-1">
                <Breadcrumb />

                <div className="mb-10 mr-10 flex min-w-0 flex-col pt-12 pl-20">
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

                    <div className="mb-3 flex min-w-0 flex-wrap items-end justify-between gap-4">
                        <div className="mb-3 flex flex-wrap gap-8">
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
                                showAll={false}
                            />

                            <ClassFilter
                                classFilter={classFilter}
                                setClassFilter={setClassFilter}
                                classes={teacherClasses}
                                disabled={subjectsLoading}
                            />
                        </div>

                        <div className="min-w-0 max-w-full">
                            <SearchBar
                                search={search}
                                setSearch={setSearch}
                            />
                        </div>
                    </div>

                    {subjectsLoading ? (
                        <p className="py-8 text-center text-gray-600">
                            Loading your assigned classes...
                        </p>
                    ) : teacherClasses.length === 0 ? (
                        <p className="py-8 text-center text-gray-600">
                            No classes are assigned to you.
                        </p>
                    ) : resultsLoading && examData.length === 0 ? (
                        <p className="py-8 text-center text-gray-600">
                            Loading exam results...
                        </p>
                    ) : (
                        <>
                            {/* Keep the scrollable width inside the main content. */}
                            <div className="w-full min-w-0">
                                <TeacherExamTable
                                    examData={examData}
                                    startIndex={startIndex}
                                    subjects={allSubjects}
                                />
                            </div>

                            <div className="mt-5 flex items-center justify-between gap-4">
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
    </div>
);

}

export default TeacherViewExams;