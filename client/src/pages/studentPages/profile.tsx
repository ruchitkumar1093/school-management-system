import NavBar from "../../components/navBar";
import { useState, useEffect } from "react";
import { viewStudent } from "../../services/studentApi";
import Breadcrumb from "../../components/breadcrumb";

function StudentProfile() {

    type profileInfo = {
        name: string;
        uid: string;
        role: string;
        class: string;
        section: string;
        rollNumber: string;
    }

    const [profile, setProfile] = useState<profileInfo | null>(null);

    const fetchProfile = async () => {
        try {
            const response = await viewStudent();
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
                        <h1 className="text-3xl mb-10">Student Profile:</h1>
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
                                <span>{user.role}</span>
                            </h2>
                            <h2 className="flex gap-3">
                                <span>Class:</span>
                                <span>{profile?.class}</span>
                            </h2>
                            <h2 className="flex gap-3">
                                <span>Section:</span>
                                <span>{profile?.section}</span>
                            </h2>
                            <h2 className="flex gap-3">
                                <span>Roll no:</span>
                                <span>{profile?.rollNumber}</span>
                            </h2>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default StudentProfile;