import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import { useState, useEffect } from "react";
import { getAdmissionById, rejectAdmissionById, approveAdmission } from "../../services/admissionApi";
import { useNavigate } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import Breadcrumb from "../../components/breadcrumb";
import { useAdmission } from "../../context/admissionContext";

type AdmissionInfo = {
    _id: string;
    studentName: string;
    dateOfBirth: string;
    gender: string;
    classApplyingFor: string;
    previousClass: string;
    fatherName: string;
    motherName: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    state: string;
    pinCode: string;
    bloodGroup: string;
    aadhaarNumber: string;
    academicYear: string;
};

function ViewAdmissionRequest() {

    const [admissionInfo, setAdmissionInfo] = useState<AdmissionInfo | null>(null);
    const [searchParams] = useSearchParams();
    const id = searchParams.get("id");
    if (!id) return null;
    const navigate = useNavigate();
    const { refreshPendingRequests } = useAdmission();

    useEffect(() => {
        const fetchAdmission = async () => {
            try {
                const response = await getAdmissionById(id);
                setAdmissionInfo(response.data);
            }
            catch (error) {
                console.log(error);
            }
        };
        fetchAdmission();
    }, [id]);

    const rejectAdmission = async () => {
        try {
            await rejectAdmissionById(id);
            await refreshPendingRequests();
            alert("Admission Rejected");
            navigate(-1);
        }
        catch (error: any) {
            console.log(error);
            alert(error.response?.data?.message || "Failed to reject Admission");
        }
    };

    const approve = async () => {
        try {
            await approveAdmission(id);
            await refreshPendingRequests();
            alert("Admission Approved");
            navigate(-1);
        }
        catch (error: any) {
            console.log(error);
            alert(error.response?.data?.message || "Failed to Approve Admission");
        }
    };

    return (
        <div className="flex flex-col min-h-screen font-fredoka">
            <NavBar />
            <div className="flex flex-1 bg-purple-100">
                <SideBar />
                <div>
                    <Breadcrumb />
                    <div className="flex flex-1 bg-purple-100">
                        <div className="flex flex-col pt-12 pl-20">
                            <h1 className="text-3xl mb-10">View Request:</h1>
                            <div className="p-7 bg-purple-200 rounded-lg mb-7 grid grid-cols-2 gap-x-15 gap-y-4">
                                <h2 className="flex gap-3">
                                    <span>Name:</span>
                                    <span>{admissionInfo?.studentName}</span>
                                </h2>
                                <h2 className="flex gap-3">
                                    <span>DOB:</span>
                                    <span>{admissionInfo?.dateOfBirth
                                        ? new Date(admissionInfo.dateOfBirth).toLocaleDateString("en-IN")
                                        : ""}</span>
                                </h2>
                                <h2 className="flex gap-3">
                                    <span>Gender:</span>
                                    <span>{admissionInfo?.gender}</span>
                                </h2>
                                <h2 className="flex gap-3">
                                    <span>Class Applying For:</span>
                                    <span>{admissionInfo?.classApplyingFor}</span>
                                </h2>
                                <h2 className="flex gap-3">
                                    <span>Previous Class:</span>
                                    <span>{admissionInfo?.previousClass}</span>
                                </h2>
                                <h2 className="flex gap-3">
                                    <span>Father Name:</span>
                                    <span>{admissionInfo?.fatherName}</span>
                                </h2>
                                <h2 className="flex gap-3">
                                    <span>Mother Name:</span>
                                    <span>{admissionInfo?.motherName}</span>
                                </h2>
                                <h2 className="flex gap-3">
                                    <span>Phone:</span>
                                    <span>{admissionInfo?.phone}</span>
                                </h2>
                                <h2 className="flex gap-3">
                                    <span>Email:</span>
                                    <span>{admissionInfo?.email}</span>
                                </h2>
                                <h2 className="flex gap-3">
                                    <span>Address:</span>
                                    <span>{admissionInfo?.address}</span>
                                </h2>
                                <h2 className="flex gap-3">
                                    <span>City:</span>
                                    <span>{admissionInfo?.city}</span>
                                </h2>
                                <h2 className="flex gap-3">
                                    <span>State:</span>
                                    <span>{admissionInfo?.state}</span>
                                </h2>
                                <h2 className="flex gap-3">
                                    <span>Pin Code:</span>
                                    <span>{admissionInfo?.pinCode}</span>
                                </h2>
                                <h2 className="flex gap-3">
                                    <span>Blood Group:</span>
                                    <span>{admissionInfo?.bloodGroup}</span>
                                </h2>
                                <h2 className="flex gap-3">
                                    <span>Aadhar Number:</span>
                                    <span>{admissionInfo?.aadhaarNumber}</span>
                                </h2>
                                <h2 className="flex gap-3">
                                    <span>Academic Year:</span>
                                    <span>{admissionInfo?.academicYear}</span>
                                </h2>
                            </div>
                            <div className="flex gap-5 pb-15">
                                <button
                                    type="submit" onClick={approve}
                                    className="p-3 px-6 bg-purple-300 rounded-lg
                            shadow-[0_2px_3px] hover:bg-violet-300
                            cursor-pointer"
                                >Approve</button>

                                <button
                                    type="button" onClick={rejectAdmission}
                                    className="p-3 px-6 bg-gray-200 rounded-lg
                            shadow-[0_2px_3px] hover:bg-red-300
                            cursor-pointer"
                                >Reject</button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default ViewAdmissionRequest;