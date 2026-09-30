import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Breadcrumb from "../../components/breadcrumb";
import { getStudentById } from "../../services/principalApi";

import student1 from "../../assets/profiles/profile1.png";
import student2 from "../../assets/profiles/profile2.png";
import student3 from "../../assets/profiles/profile3.png";
import student4 from "../../assets/profiles/profile4.png";
import student5 from "../../assets/profiles/profile5.png";

function StudentProfile() {
    type StudentInfo = {
        class: string;
        rollNumber: number;
        userId: {
            name: string;
            uid: string;
            role: string;
        };
        admissionRequest: {
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
            bloodGroup?: string;
            aadhaarNumber: string;
            academicYear: string;
        } | null;
    };

    const studentPhotos = [
        student1,
        student2,
        student3,
        student4,
        student5
    ];

    const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);

    const [searchParams] = useSearchParams();
    const id = searchParams.get("id");

    const uidNumber = studentInfo
        ? parseInt(studentInfo.userId.uid.replace("stu", ""))
        : 0;

    const photoIndex = uidNumber
        ? (uidNumber - 1) % studentPhotos.length
        : 0;

    const studentPhoto = studentPhotos[photoIndex];

    useEffect(() => {
        const fetchStudent = async () => {
            try {
                if (id) {
                    const response = await getStudentById(id);
                    setStudentInfo(response.data);
                }
            }
            catch (error) {
                console.log(error);
            }
        };

        fetchStudent();
    }, [id]);

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });
    };

    const admission = studentInfo?.admissionRequest;

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
                                Student Profile
                            </h1>
                            <p className="mt-1 text-gray-600">
                                View student personal, academic, parent and contact information.
                            </p>
                        </div>

                        <div className="mb-8 rounded-lg bg-purple-200 p-6 shadow-md">
                            <div className="flex flex-col gap-8 md:flex-row md:items-center">
                                <div className="flex flex-col items-center md:min-w-40">
                                    <img
                                        src={studentPhoto}
                                        alt="Student profile"
                                        className="h-32 w-32 rounded-full object-cover shadow-md"
                                    />

                                    <h2 className="mt-4 text-xl font-semibold text-purple-950">
                                        {studentInfo?.userId.name}
                                    </h2>

                                    <span className="mt-1 text-sm text-gray-600">
                                        Student
                                    </span>
                                </div>

                                <div className="hidden h-32 w-px bg-purple-300 md:block" />

                                <div className="grid flex-1 grid-cols-1 gap-x-12 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">
                                            UID
                                        </p>
                                        <p className="mt-1 font-medium text-gray-900">
                                            {studentInfo?.userId.uid.toUpperCase()}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-gray-500">
                                            Class
                                        </p>
                                        <p className="mt-1 font-medium text-gray-900">
                                            {studentInfo?.class}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-gray-500">
                                            Roll Number
                                        </p>
                                        <p className="mt-1 font-medium text-gray-900">
                                            {studentInfo?.rollNumber}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-gray-500">
                                            Role
                                        </p>
                                        <p className="mt-1 font-medium capitalize text-gray-900">
                                            {studentInfo?.userId.role}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-gray-500">
                                            Academic Year
                                        </p>
                                        <p className="mt-1 font-medium text-gray-900">
                                            {admission?.academicYear ?? "Not available"}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-gray-500">
                                            Class Applied For
                                        </p>
                                        <p className="mt-1 font-medium text-gray-900">
                                            {admission?.classApplyingFor ?? "Not available"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {admission && (
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
                                                {formatDate(admission.dateOfBirth)}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-sm font-medium text-gray-500">
                                                Gender
                                            </p>
                                            <p className="mt-1 font-medium text-gray-900">
                                                {admission.gender}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-sm font-medium text-gray-500">
                                                Previous Class
                                            </p>
                                            <p className="mt-1 font-medium text-gray-900">
                                                {admission.previousClass}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-sm font-medium text-gray-500">
                                                Class Applied For
                                            </p>
                                            <p className="mt-1 font-medium text-gray-900">
                                                {admission.classApplyingFor}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-sm font-medium text-gray-500">
                                                Blood Group
                                            </p>
                                            <p className="mt-1 font-medium text-gray-900">
                                                {admission.bloodGroup ?? "Not provided"}
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
                                                {admission.fatherName}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-sm font-medium text-gray-500">
                                                Mother's Name
                                            </p>
                                            <p className="mt-1 font-medium text-gray-900">
                                                {admission.motherName}
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
                                                {admission.phone}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-sm font-medium text-gray-500">
                                                Email
                                            </p>
                                            <p className="mt-1 break-words font-medium text-gray-900">
                                                {admission.email}
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
                                                {admission.city}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-sm font-medium text-gray-500">
                                                State
                                            </p>
                                            <p className="mt-1 font-medium text-gray-900">
                                                {admission.state}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-sm font-medium text-gray-500">
                                                PIN Code
                                            </p>
                                            <p className="mt-1 font-medium text-gray-900">
                                                {admission.pinCode}
                                            </p>
                                        </div>

                                        <div className="sm:col-span-3">
                                            <p className="text-sm font-medium text-gray-500">
                                                Address
                                            </p>
                                            <p className="mt-1 font-medium text-gray-900">
                                                {admission.address}
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
                                            {admission.aadhaarNumber}
                                        </p>
                                    </div>
                                </section>
                            </div>
                        )}

                        {!admission && (
                            <div className="rounded-lg bg-purple-200 p-6 text-center shadow-md">
                                <p className="text-gray-600">
                                    Admission information is not available for this student.
                                </p>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}

export default StudentProfile;