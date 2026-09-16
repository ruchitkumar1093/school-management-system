import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import SortBy from "../../components/sortBy";
import OrderBy from "../../components/orderBy";
import ClassFilter from "../../components/classFilter";
import SearchBar from "../../components/searchBar";
import Status from "../../components/status";

import Pagination from "../../components/pagination";
import Limit from "../../components/limit";

import { useState, useEffect } from "react";
import { getAdmission, deleteRejectAdmissions } from "../../services/admissionApi";

import AdmissionTable from "../../components/principalComponents/admissionTable";
import { useNavigate } from "react-router-dom";
import Breadcrumb from "../../components/breadcrumb";

type Admission = {
    _id: string;
    studentName: string;
    classApplyingFor: string;
    status: "pending" | "approved" | "rejected";
};

type StatusType = "pending" | "approved" | "rejected";

function AdmissionRequest() {


    const navigate = useNavigate();

    const [admissionData, setAdmissionData] = useState<Admission[]>([]);

    const fetchAdmissions = async () => {
        try {
            const admission = await getAdmission();
            console.log("Admission response:", admission.data);
            setAdmissionData(admission.data);
        }
        catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        fetchAdmissions();
    }, []);

    function handleViewAdmission(id: string) {
        navigate(`viewRequest?id=${id}`);
    }

    const deleteAdmissions = async () => {
        try {
            if (window.confirm("Are you sure you want to delete?")) {
                const deleteAdmission = await deleteRejectAdmissions();
                console.log("Delete  response:", deleteAdmission.data);
                alert("Deleted Successfully");

                fetchAdmissions();
            }
        }
        catch (error: any) {
            console.log(error);
            alert(error.response?.data?.message || "Failed");
        }
    }

    const sortOptions = ["None", "Student Name", "Class"];

    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(5);

    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("None");
    const [orderBy, setOrderBy] = useState("asc");
    const [classFilter, setClassFilter] = useState("All");
    const [status, setStatus] = useState<StatusType>("pending");

    let processedAdmission = [...admissionData];
    if (classFilter !== "All") {
        processedAdmission = processedAdmission.filter((admission) => admission.classApplyingFor === classFilter)
    };

    if (status) {
        processedAdmission = processedAdmission.filter((admission) => admission.status === status)
    };

    if (search.trim() !== "") {
        processedAdmission = processedAdmission.filter(
            (admission) =>
                admission.studentName
                    .toLowerCase()
                    .includes(search.toLowerCase())
        );
    }

    if (sortBy === "Student Name") {
        processedAdmission.sort((a, b) =>
            a.studentName.localeCompare(b.studentName));
    }

    if (sortBy === "Class") {
        processedAdmission.sort((a, b) => {
            const numA = parseInt(a.classApplyingFor, 10);
            const numB = parseInt(b.classApplyingFor, 10);
            return numA - numB;
        });
    }

    if (sortBy !== "None" && orderBy === "desc") {
        processedAdmission.reverse();
    }

    const totalPages = Math.ceil(processedAdmission.length / limit);

    const startIndex = (currentPage - 1) * limit;
    const endIndex = startIndex + limit;
    const currentRequests = processedAdmission.slice(startIndex, endIndex);

    useEffect(() => {
        setCurrentPage(1);
    }, [sortBy, orderBy, classFilter, limit]);

    return (
        <div className="flex flex-col min-h-screen font-fredoka">
            <NavBar />
            <div className="flex flex-1 bg-purple-100">
                <SideBar />
                <div>
                    <Breadcrumb />
                    <div className="flex flex-col pt-12 pl-20 mb-10">
                        <div className="flex justify-between items-center mb-4">
                            <h1 className="text-3xl">Admission Requests:</h1>
                        </div>
                        <div className="flex justify-between items-center mb-3">
                            <div className="w-full">
                                <div className="flex gap-8 mb-3 justify-between">
                                    <div className="flex gap-8 mb-3">
                                        <SortBy sortOptions={sortOptions} sortBy={sortBy} setSortBy={setSortBy} />
                                        <OrderBy orderBy={orderBy} setOrderBy={setOrderBy} disabled={sortBy === "None"} />
                                        <ClassFilter classFilter={classFilter} setClassFilter={setClassFilter} />
                                    </div>

                                    <div className="mt-2">
                                        <SearchBar search={search} setSearch={setSearch} />
                                    </div>
                                </div>
                                <div className="flex gap-8 mb-3 justify-between">
                                    <Status status={status} setStatus={setStatus} />
                                    {status === "rejected" && <button onClick={deleteAdmissions} className="p-2 bg-purple-300 rounded-md
                shadow-[0_2px_1px] hover:bg-red-300 self-start cursor-pointer mt-2">Delete Rejected</button>}
                                </div>
                            </div>

                        </div>
                        <div className="flex flex-wrap gap-10">
                            <AdmissionTable
                                admission={currentRequests}
                                startIndex={startIndex}
                                handleViewAdmission={handleViewAdmission} />
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

export default AdmissionRequest;