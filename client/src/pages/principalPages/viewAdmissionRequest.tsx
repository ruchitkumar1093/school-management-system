import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import { useState, useEffect } from "react";
import { getAdmissionById, rejectAdmissionById, approveAdmission } from "../../services/admissionApi";
import { useNavigate, useSearchParams } from "react-router-dom";
import Breadcrumb from "../../components/breadcrumb";
import { useAdmission } from "../../context/admissionContext";
import Modal from "../../components/modal";

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
    const navigate = useNavigate();
    const { refreshPendingRequests } = useAdmission();

    const [modalOpen, setModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [modalMessage, setModalMessage] = useState("");

    useEffect(() => {
        const fetchAdmission = async () => {
            try {
                if (id) {
                    const response = await getAdmissionById(id);
                    setAdmissionInfo(response.data);
                }
            }
            catch (error) {
                console.log(error);
            }
        };

        fetchAdmission();
    }, [id]);

    const rejectAdmission = async () => {
        try {
            if (!id) return;

            await rejectAdmissionById(id);
            await refreshPendingRequests();

            setModalTitle("Success");
            setModalMessage("Admission Rejected");
            setModalOpen(true);
        }
        catch (error: any) {
            console.log(error);

            setModalTitle("Error");
            setModalMessage(
                error.response?.data?.message || "Failed to reject Admission"
            );
            setModalOpen(true);
        }
    };

    const approve = async () => {
        try {
            if (!id) return;

            await approveAdmission(id);
            await refreshPendingRequests();

            setModalTitle("Success");
            setModalMessage("Admission Approved");
            setModalOpen(true);
        }
        catch (error: any) {
            console.log(error);

            setModalTitle("Error");
            setModalMessage(
                error.response?.data?.message || "Failed to Approve Admission"
            );
            setModalOpen(true);
        }
    };

    const handleModalClose = () => {
        setModalOpen(false);

        if (
            modalMessage === "Admission Approved" ||
            modalMessage === "Admission Rejected"
        ) {
            navigate(-1);
        }
    };

    return (
        <div className="flex min-h-screen flex-col font-fredoka">
            <NavBar />

            <div className="flex flex-1 bg-purple-100">
                <SideBar />

                <div className="flex-1">
                    <Breadcrumb />

                    <main className="px-8 py-8 lg:px-12 xl:px-16">
                        <div className="mb-8">
                            <h1 className="text-3xl font-semibold text-purple-950">
                                Admission Request
                            </h1>
                            <p className="mt-1 text-gray-600">
                                Review the student's admission information before making a decision.
                            </p>
                        </div>

                        {admissionInfo && (
                            <>
                                <div className="mb-7 rounded-lg bg-purple-200 p-6 shadow-md">
                                    <div className="flex flex-col gap-8 md:flex-row md:items-center">
                                        <div className="flex flex-col md:min-w-40">
                                            <h2 className="text-2xl font-semibold text-purple-950">
                                                {admissionInfo.studentName}
                                            </h2>

                                            <span className="mt-1 text-sm text-gray-600">
                                                Admission Applicant
                                            </span>
                                        </div>

                                        <div className="hidden h-20 w-px bg-purple-300 md:block" />

                                        <div className="grid flex-1 grid-cols-1 gap-x-12 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">
                                                    Class Applying For
                                                </p>
                                                <p className="mt-1 font-medium text-gray-900">
                                                    {admissionInfo.classApplyingFor}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-sm font-medium text-gray-500">
                                                    Previous Class
                                                </p>
                                                <p className="mt-1 font-medium text-gray-900">
                                                    {admissionInfo.previousClass}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-sm font-medium text-gray-500">
                                                    Academic Year
                                                </p>
                                                <p className="mt-1 font-medium text-gray-900">
                                                    {admissionInfo.academicYear}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-7 xl:grid-cols-2">
                                    <section className="rounded-lg bg-purple-200 p-6 shadow-md">
                                        <div className="mb-6 border-b border-purple-300 pb-4">
                                            <h2 className="text-xl font-semibold text-purple-950">
                                                Personal Information
                                            </h2>
                                        </div>

                                        <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">
                                                    Date of Birth
                                                </p>
                                                <p className="mt-1 font-medium text-gray-900">
                                                    {new Date(admissionInfo.dateOfBirth).toLocaleDateString("en-IN")}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-sm font-medium text-gray-500">
                                                    Gender
                                                </p>
                                                <p className="mt-1 font-medium text-gray-900">
                                                    {admissionInfo.gender}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-sm font-medium text-gray-500">
                                                    Blood Group
                                                </p>
                                                <p className="mt-1 font-medium text-gray-900">
                                                    {admissionInfo.bloodGroup || "Not provided"}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-sm font-medium text-gray-500">
                                                    Academic Year
                                                </p>
                                                <p className="mt-1 font-medium text-gray-900">
                                                    {admissionInfo.academicYear}
                                                </p>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="rounded-lg bg-purple-200 p-6 shadow-md">
                                        <div className="mb-6 border-b border-purple-300 pb-4">
                                            <h2 className="text-xl font-semibold text-purple-950">
                                                Parent Information
                                            </h2>
                                        </div>

                                        <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">
                                                    Father's Name
                                                </p>
                                                <p className="mt-1 font-medium text-gray-900">
                                                    {admissionInfo.fatherName}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-sm font-medium text-gray-500">
                                                    Mother's Name
                                                </p>
                                                <p className="mt-1 font-medium text-gray-900">
                                                    {admissionInfo.motherName}
                                                </p>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="rounded-lg bg-purple-200 p-6 shadow-md">
                                        <div className="mb-6 border-b border-purple-300 pb-4">
                                            <h2 className="text-xl font-semibold text-purple-950">
                                                Contact Information
                                            </h2>
                                        </div>

                                        <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">
                                                    Phone
                                                </p>
                                                <p className="mt-1 font-medium text-gray-900">
                                                    {admissionInfo.phone}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-sm font-medium text-gray-500">
                                                    Email
                                                </p>
                                                <p className="mt-1 break-words font-medium text-gray-900">
                                                    {admissionInfo.email}
                                                </p>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="rounded-lg bg-purple-200 p-6 shadow-md">
                                        <div className="mb-6 border-b border-purple-300 pb-4">
                                            <h2 className="text-xl font-semibold text-purple-950">
                                                Address
                                            </h2>
                                        </div>

                                        <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-3">
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">
                                                    City
                                                </p>
                                                <p className="mt-1 font-medium text-gray-900">
                                                    {admissionInfo.city}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-sm font-medium text-gray-500">
                                                    State
                                                </p>
                                                <p className="mt-1 font-medium text-gray-900">
                                                    {admissionInfo.state}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-sm font-medium text-gray-500">
                                                    PIN Code
                                                </p>
                                                <p className="mt-1 font-medium text-gray-900">
                                                    {admissionInfo.pinCode}
                                                </p>
                                            </div>

                                            <div className="sm:col-span-3">
                                                <p className="text-sm font-medium text-gray-500">
                                                    Address
                                                </p>
                                                <p className="mt-1 font-medium text-gray-900">
                                                    {admissionInfo.address}
                                                </p>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="rounded-lg bg-purple-200 p-6 shadow-md xl:col-span-2">
                                        <div className="mb-6 border-b border-purple-300 pb-4">
                                            <h2 className="text-xl font-semibold text-purple-950">
                                                Identification
                                            </h2>
                                        </div>

                                        <div>
                                            <p className="text-sm font-medium text-gray-500">
                                                Aadhaar Number
                                            </p>
                                            <p className="mt-1 font-medium text-gray-900">
                                                {admissionInfo.aadhaarNumber}
                                            </p>
                                        </div>
                                    </section>
                                </div>

                                <div className="mt-8 flex gap-4 pb-10">
                                    <button
                                        type="button"
                                        onClick={approve}
                                        className="rounded-lg bg-purple-300 px-6 py-3 font-medium text-purple-950 shadow-[0_2px_3px] transition-colors hover:bg-violet-300 cursor-pointer"
                                    >
                                        Approve
                                    </button>

                                    <button
                                        type="button"
                                        onClick={rejectAdmission}
                                        className="rounded-lg bg-gray-200 px-6 py-3 font-medium text-gray-800 shadow-[0_2px_3px] transition-colors hover:bg-red-300 cursor-pointer"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </>
                        )}

                        {!admissionInfo && (
                            <div className="rounded-lg bg-purple-200 p-6 text-center shadow-md">
                                <p className="text-gray-600">
                                    Admission information is not available.
                                </p>
                            </div>
                        )}
                    </main>
                </div>
            </div>

            <Modal
                isOpen={modalOpen}
                title={modalTitle}
                message={modalMessage}
                onClose={handleModalClose}
            />
        </div>
    );
}

export default ViewAdmissionRequest;