import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import OrderBy from "../../components/orderBy";
import SearchBar from "../../components/searchBar";

import Pagination from "../../components/pagination";
import Limit from "../../components/limit";

import StudentSubjectTable from "../../components/studentComponents/subjectTable";
import { viewSubjects } from "../../services/studentApi";
import { useState, useEffect } from "react";
import Breadcrumb from "../../components/breadcrumb";

function StudentViewSubjects() {

    type Subject = {
        _id: string;
        name: string;
        subjectCode: string;
        class: string;
        teacherName: string;
    }

    const [subjects, setSubjects] = useState<Subject[]>([]);

    const fetchSubjects = async () => {
        try {
            const response = await viewSubjects();
            console.log("Subjects response:", response.data);
            setSubjects(response.data);
        }
        catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        fetchSubjects();
    }, []);

    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(5);

    const [search, setSearch] = useState("");

    const [orderBy, setOrderBy] = useState<string>("asc");

    let processedSubjects = [...subjects];

    if (search.trim() !== "") {
        processedSubjects = processedSubjects.filter(
            (subject) =>
                subject.name
                    .toLowerCase()
                    .includes(search.toLowerCase())
        );
    }

    processedSubjects.sort((a, b) =>
        a.name.localeCompare(b.name));

    if (orderBy === "desc") {
        processedSubjects.reverse();
    }

    const totalPages = Math.ceil(processedSubjects.length / limit);

    const startIndex = (currentPage - 1) * limit;
    const endIndex = startIndex + limit;
    const currentSubjects = processedSubjects.slice(startIndex, endIndex);

    return (
        <div className="flex flex-col min-h-screen font-fredoka">
            <NavBar />
            <div className="flex flex-1 bg-purple-100">
                <SideBar />
                <div>
                    <Breadcrumb />
                    <div className="flex flex-col pt-12 pl-20 mb-10">
                        <h1 className="text-3xl mb-4">My Subjects:</h1>
                        <div className="flex justify-between items-center mb-3">
                            <div className="flex gap-8 mb-3">
                                <OrderBy orderBy={orderBy} setOrderBy={setOrderBy} />
                            </div>
                            <div>
                                <SearchBar search={search} setSearch={setSearch} />
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-10">
                            <StudentSubjectTable
                                subject={currentSubjects}
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

export default StudentViewSubjects;