import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Breadcrumb from "../../components/breadcrumb";
import Modal from "../../components/modal";
import {
    getTeacherById,
    deactivateTeacher,
    activateTeacher
} from "../../services/principalApi";

import teacher1 from "../../assets/profiles/profile1.png";
import teacher2 from "../../assets/profiles/profile2.png";
import teacher3 from "../../assets/profiles/profile3.png";
import teacher4 from "../../assets/profiles/profile4.png";
import teacher5 from "../../assets/profiles/profile5.png";

function TeacherProfile() {
    type TeacherInfo = {
        _id: string;
        employeeID: string;
        department: string;
        classAssigned: string;
        userId: {
            name: string;
            uid: string;
            role: string;
            isActive?: boolean;
        };
    };

    const teacherPhotos = [
        teacher1,
        teacher2,
        teacher3,
        teacher4,
        teacher5
    ];

    const [teacherInfo, setTeacherInfo] = useState<TeacherInfo | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [modalMessage, setModalMessage] = useState("");
    const [confirmAction, setConfirmAction] = useState<(() => void) | undefined>();

    const [searchParams] = useSearchParams();
    const id = searchParams.get("id");

    const employeeNumber = teacherInfo
        ? parseInt(teacherInfo.employeeID.replace("EMP", ""))
        : 0;

    const photoIndex = employeeNumber
        ? (employeeNumber - 1) % teacherPhotos.length
        : 0;

    const teacherPhoto = teacherPhotos[photoIndex];

    useEffect(() => {
        const fetchTeacher = async () => {
            try {
                if (id) {
                    const response = await getTeacherById(id);
                    setTeacherInfo(response.data);
                }
            }
            catch (error) {
                console.log(error);
            }
        };

        fetchTeacher();
    }, [id]);

    const isAccountActive = teacherInfo?.userId.isActive !== false;

    const handleAccountAction = () => {
        if (!teacherInfo) {
            return;
        }

        setModalTitle(
            isAccountActive
                ? "Deactivate Account"
                : "Activate Account"
        );

        setModalMessage(
            isAccountActive
                ? "Are you sure you want to deactivate this teacher's account?"
                : "Are you sure you want to activate this teacher's account?"
        );

        setConfirmAction(() => async () => {
            try {
                if (isAccountActive) {
                    await deactivateTeacher(teacherInfo._id);
                }
                else {
                    await activateTeacher(teacherInfo._id);
                }

                const response = await getTeacherById(teacherInfo._id);
                setTeacherInfo(response.data);
                setConfirmAction(undefined);
                setModalTitle("Success");
                setModalMessage(
                    isAccountActive
                        ? "Teacher account deactivated successfully."
                        : "Teacher account activated successfully."
                );
            }
            catch (error: any) {
                setConfirmAction(undefined);
                setModalTitle("Error");
                setModalMessage(
                    error.response?.data?.message ||
                    "Failed to update teacher account."
                );
            }
        });

        setModalOpen(true);
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
                                Teacher Profile
                            </h1>
                            <p className="mt-1 text-gray-600">
                                View teacher account and professional information.
                            </p>
                        </div>

                        <div className="rounded-lg bg-purple-200 p-6 shadow-md">
                            <div className="flex flex-col gap-8 md:flex-row md:items-center">
                                <div className="flex flex-col items-center md:min-w-40">
                                    <img
                                        src={teacherPhoto}
                                        alt="Teacher profile"
                                        className="h-32 w-32 rounded-full object-cover shadow-md"
                                    />

                                    <h2 className="mt-4 text-xl font-semibold text-purple-950">
                                        {teacherInfo?.userId.name}
                                    </h2>

                                    <span className="mt-1 text-sm text-gray-600">
                                        Teacher
                                    </span>
                                </div>

                                <div className="hidden h-32 w-px bg-purple-300 md:block" />

                                <div className="grid flex-1 grid-cols-1 gap-x-12 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">
                                            UID
                                        </p>
                                        <p className="mt-1 font-medium text-gray-900">
                                            {teacherInfo?.userId.uid.toUpperCase()}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-gray-500">
                                            Employee ID
                                        </p>
                                        <p className="mt-1 font-medium text-gray-900">
                                            {teacherInfo?.employeeID.toUpperCase()}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-gray-500">
                                            Role
                                        </p>
                                        <p className="mt-1 font-medium capitalize text-gray-900">
                                            {teacherInfo?.userId.role}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-gray-500">
                                            Department
                                        </p>
                                        <p className="mt-1 font-medium text-gray-900">
                                            {teacherInfo?.department}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-gray-500">
                                            Class Assigned
                                        </p>
                                        <p className="mt-1 font-medium text-gray-900">
                                            {teacherInfo?.classAssigned}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-gray-500">
                                            Account Status
                                        </p>
                                        <p className={`mt-1 font-medium ${isAccountActive ? "text-green-700" : "text-red-700"}`}>
                                            {isAccountActive ? "Active" : "Deactivated"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-7 grid grid-cols-1 gap-7 lg:grid-cols-2">
                            <section className="rounded-lg bg-purple-200 p-6 shadow-md">
                                <div className="mb-6 border-b border-purple-300 pb-4">
                                    <h2 className="text-xl font-semibold text-purple-950">
                                        Account Information
                                    </h2>
                                </div>

                                <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">
                                            Name
                                        </p>
                                        <p className="mt-1 font-medium text-gray-900">
                                            {teacherInfo?.userId.name}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-gray-500">
                                            UID
                                        </p>
                                        <p className="mt-1 font-medium text-gray-900">
                                            {teacherInfo?.userId.uid.toUpperCase()}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-gray-500">
                                            Role
                                        </p>
                                        <p className="mt-1 font-medium capitalize text-gray-900">
                                            {teacherInfo?.userId.role}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-gray-500">
                                            Account Status
                                        </p>
                                        <p className={`mt-1 font-medium ${isAccountActive ? "text-green-700" : "text-red-700"}`}>
                                            {isAccountActive ? "Active" : "Deactivated"}
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <section className="rounded-lg bg-purple-200 p-6 shadow-md">
                                <div className="mb-6 border-b border-purple-300 pb-4">
                                    <h2 className="text-xl font-semibold text-purple-950">
                                        Professional Information
                                    </h2>
                                </div>

                                <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">
                                            Employee ID
                                        </p>
                                        <p className="mt-1 font-medium text-gray-900">
                                            {teacherInfo?.employeeID.toUpperCase()}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-gray-500">
                                            Department
                                        </p>
                                        <p className="mt-1 font-medium text-gray-900">
                                            {teacherInfo?.department}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-gray-500">
                                            Class Assigned
                                        </p>
                                        <p className="mt-1 font-medium text-gray-900">
                                            {teacherInfo?.classAssigned}
                                        </p>
                                    </div>
                                </div>
                            </section>
                        </div>

                        <div className="mt-7 rounded-lg bg-purple-200 p-6 shadow-md">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold text-purple-950">
                                        Account Management
                                    </h2>
                                    <p className="mt-1 text-gray-600">
                                        {isAccountActive
                                            ? "Deactivate this account to prevent the teacher from logging in."
                                            : "Activate this account to allow the teacher to log in again."}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleAccountAction}
                                    className={`cursor-pointer rounded-lg px-5 py-2.5 font-medium text-white transition-colors ${
                                        isAccountActive
                                            ? "bg-red-600 hover:bg-red-700"
                                            : "bg-green-600 hover:bg-green-700"
                                    }`}
                                >
                                    {isAccountActive
                                        ? "Deactivate Account"
                                        : "Activate Account"}
                                </button>
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            <Modal
                isOpen={modalOpen}
                title={modalTitle}
                message={modalMessage}
                onClose={() => {
                    setModalOpen(false);
                    setConfirmAction(undefined);
                }}
                onConfirm={
                    confirmAction
                        ? async () => {
                            setModalOpen(false);
                            await confirmAction();
                            setModalOpen(true);
                        }
                        : undefined
                }
                confirmText={isAccountActive ? "Deactivate" : "Activate"}
            />
        </div>
    );
}

export default TeacherProfile;