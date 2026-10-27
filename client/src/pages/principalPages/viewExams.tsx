import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import SortBy from "../../components/sortBy";
import OrderBy from "../../components/orderBy";
import ClassFilter from "../../components/classFilter";
import ExamFilter from "../../components/examFilter";
import SearchBar from "../../components/searchBar";
import Pagination from "../../components/pagination";
import Limit from "../../components/limit";

import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";

import PrincipalExamTable from "../../components/principalComponents/examTable";
import { getExamResults } from "../../services/principalApi";
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

type ExamSubject = {
    name: string;
    subjectCode: string;
};

type ExamType = "All" | "class test" | "mid term" | "final";

function PrincipalViewExams() {
    const location = useLocation();

    const selectedClassFromNavigation: string | undefined =
        location.state?.selectedClass;

    const [examData, setExamData] = useState<ExamResult[]>([]);
    const [allSubjects, setAllSubjects] = useState<ExamSubject[]>([]);
    const [availableClasses, setAvailableClasses] = useState<string[]>([]);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [sortBy, setSortBy] = useState("None");
    const [orderBy, setOrderBy] = useState("asc");

    const [classFilter, setClassFilter] = useState<string>(
        selectedClassFromNavigation ?? "1st"
    );

    const [examType, setExamType] = useState<ExamType>("class test");

    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [resultsLoading, setResultsLoading] = useState(false);

    const sortOptions = [
        "None",
        "Student Name",
        "UID",
        "Total Marks",
        "Percentage",
    ];

    const fetchExamResults = useCallback(async () => {
        try {
            setResultsLoading(true);

            const response = await getExamResults(
                classFilter,
                examType,
                debouncedSearch,
                sortBy,
                orderBy,
                currentPage,
                limit
            );

            const data = response.data;

            setExamData(data.results ?? []);
            setAllSubjects(data.subjects ?? []);
            setTotalPages(data.totalPages ?? 1);

            if (Array.isArray(data.classes)) {
                setAvailableClasses(data.classes);
            }
        } catch (error) {
            console.error("Failed to fetch exam results:", error);

            setExamData([]);
            setAllSubjects([]);
            setTotalPages(1);
        } finally {
            setResultsLoading(false);
        }
    }, [
        classFilter,
        examType,
        debouncedSearch,
        sortBy,
        orderBy,
        currentPage,
        limit,
    ]);

    // Apply the class selected on the previous page.
    useEffect(() => {
        if (
            typeof selectedClassFromNavigation === "string" &&
            selectedClassFromNavigation !== classFilter
        ) {
            setClassFilter(selectedClassFromNavigation);
            setCurrentPage(1);
        }
    }, [selectedClassFromNavigation, classFilter]);

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
        classFilter,
        examType,
        debouncedSearch,
        sortBy,
        orderBy,
        limit,
    ]);

    useEffect(() => {
        void fetchExamResults();
    }, [fetchExamResults]);

    const startIndex = (currentPage - 1) * limit;

    return (
        <div className="flex min-h-screen flex-col font-fredoka">
            <NavBar />

            <div className="flex min-w-0 flex-1 bg-purple-100">
                <SideBar />

                {/* Allow the main content to shrink beside the sidebar. */}
                <div className="min-w-0 flex-1">
                    <Breadcrumb />

                    <div className="mb-10 mr-10 flex min-w-0 flex-col px-8 pt-12 lg:pl-20">
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
                            <div className="mb-3 flex flex-wrap gap-6">
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
                                    classes={availableClasses}
                                    showAll={false}
                                />

                                <ExamFilter
                                    examType={examType}
                                    setExamType={setExamType}
                                    showAll={false}
                                />
                            </div>

                            <div className="min-w-0 max-w-full">
                                <SearchBar
                                    search={search}
                                    setSearch={setSearch}
                                />
                            </div>
                        </div>

                        {resultsLoading && examData.length === 0 ? (
                            <p className="py-8 text-center text-gray-600">
                                Loading exam results...
                            </p>
                        ) : (
                            <>
                                {/* The table manages its own horizontal scrolling. */}
                                <div className="w-full min-w-0">
                                    <PrincipalExamTable
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

export default PrincipalViewExams;