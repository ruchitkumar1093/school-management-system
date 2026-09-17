import NavBar from "../../components/navBar";
import { useState, useEffect } from "react";
import { viewTeacher } from "../../services/teacherApi";
import Breadcrumb from "../../components/breadcrumb";

function TeacherProfile() {

    type Teacher = {
        employeeID: string;
        department: string;
        classAssigned: string;
    };

    const [profile, setProfile] = useState<Teacher | null>(null);

    const fetchProfile = async () => {
        try {
            const response = await viewTeacher();
            setProfile(response.data);
        }
        catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        fetchProfile();
    }, []);

    const user = JSON.parse(localStorage.getItem("user") || "{}");

    return (
        <div className="flex flex-col min-h-screen font-fredoka">
            <NavBar />
            <div className="flex flex-1 bg-purple-100">
                <div>
                    <Breadcrumb />
                    <div className="flex flex-col pt-12 pl-20">
                        <h1 className="text-3xl mb-10">Teacher Profile:</h1>
                        <div className="p-7 bg-purple-200 rounded-lg mb-10 flex flex-col gap-2">
                            <h2 className="flex gap-3">
                                <span>Name:</span>
                                <span>{user.name}</span>
                            </h2>
                            <h2 className="flex gap-3">
                                <span>UID:</span>
                                <span>{user.uid.toUpperCase()}</span>
                            </h2>
                            <h2 className="flex gap-3">
                                <span>Role:</span>
                                <span className="capitalize">{user.role}</span>
                            </h2>
                            <h2 className="flex gap-3">
                                <span>Employee ID:</span>
                                <span>{profile?.employeeID.toUpperCase()}</span>
                            </h2>
                            <h2 className="flex gap-3">
                                <span>Department:</span>
                                <span>{profile?.department}</span>
                            </h2>
                            <h2 className="flex gap-3">
                                <span>Class Assigned:</span>
                                <span>{profile?.classAssigned}</span>
                            </h2>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default TeacherProfile;