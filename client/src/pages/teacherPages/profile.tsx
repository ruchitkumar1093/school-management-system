import NavBar from "../../components/navBar";
import { useState, useEffect } from "react";
import { viewTeacher } from "../../services/teacherApi";
import Breadcrumb from "../../components/breadcrumb";

import teacher1 from "../../assets/profiles/profile1.png";
import teacher2 from "../../assets/profiles/profile2.png";
import teacher3 from "../../assets/profiles/profile3.png";
import teacher4 from "../../assets/profiles/profile4.png";
import teacher5 from "../../assets/profiles/profile5.png";

function TeacherProfile() {
    type TeacherInfo = {
        employeeID: string;
        department: string;
        classAssigned: string;
    };

    const teacherPhotos = [
        teacher1,
        teacher2,
        teacher3,
        teacher4,
        teacher5
    ];

    const [profile, setProfile] = useState<TeacherInfo | null>(null);

    const fetchProfile = async () => {
        try {
            const response = await viewTeacher();
            setProfile(response.data);
        }
        catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const employeeNumber = profile
        ? parseInt(profile.employeeID.replace("EMP", ""))
        : 0;

    const photoIndex = employeeNumber
        ? (employeeNumber - 1) % teacherPhotos.length
        : 0;

    const teacherPhoto = teacherPhotos[photoIndex];

    return (
        <div className="flex min-h-screen flex-col font-fredoka">
            <NavBar />

            <div className="flex flex-1 bg-purple-100">
                <div className="flex-1">
                    <Breadcrumb />

                    <main className="px-8 py-8 lg:px-12 xl:px-16">
                        <div className="mb-8">
                            <h1 className="text-3xl font-semibold text-purple-950">
                                Teacher Profile
                            </h1>
                            <p className="mt-1 text-gray-600">
                                View your account and professional information.
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
                                        {user.name}
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
                                            {user.uid?.toUpperCase()}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-gray-500">
                                            Employee ID
                                        </p>
                                        <p className="mt-1 font-medium text-gray-900">
                                            {profile?.employeeID.toUpperCase()}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-gray-500">
                                            Role
                                        </p>
                                        <p className="mt-1 font-medium capitalize text-gray-900">
                                            {user.role}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-gray-500">
                                            Department
                                        </p>
                                        <p className="mt-1 font-medium text-gray-900">
                                            {profile?.department}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-gray-500">
                                            Class Assigned
                                        </p>
                                        <p className="mt-1 font-medium text-gray-900">
                                            {profile?.classAssigned}
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
                                            {user.name}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-gray-500">
                                            UID
                                        </p>
                                        <p className="mt-1 font-medium text-gray-900">
                                            {user.uid?.toUpperCase()}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-gray-500">
                                            Role
                                        </p>
                                        <p className="mt-1 font-medium capitalize text-gray-900">
                                            {user.role}
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
                                            {profile?.employeeID.toUpperCase()}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-gray-500">
                                            Department
                                        </p>
                                        <p className="mt-1 font-medium text-gray-900">
                                            {profile?.department}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-gray-500">
                                            Class Assigned
                                        </p>
                                        <p className="mt-1 font-medium text-gray-900">
                                            {profile?.classAssigned}
                                        </p>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}

export default TeacherProfile;