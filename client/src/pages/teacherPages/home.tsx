import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import { useState, useEffect } from "react";
import { viewTeacher } from "../../services/teacherApi";
import Breadcrumb from "../../components/breadcrumb";

function TeacherHome() {

    type Teacher = {
        classAssigned: string;
    };

    const [homeInfo, setHomeInfo] = useState<Teacher | null>(null);

    const fetchTeacher = async () => {
        try {
            const response = await viewTeacher();
            setHomeInfo(response.data);
        }
        catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        fetchTeacher();
    }, []);

    const user = JSON.parse(localStorage.getItem("user") || "{}");

    return (
        <div className="flex flex-col min-h-screen font-fredoka">
            <NavBar />
            <div className="flex flex-1 bg-purple-100">
                <SideBar />
                <div>
                    <Breadcrumb />
                    <div className="flex flex-col pt-12 pl-20">
                        <h1 className="text-3xl mb-10">Welcome, {user.name}</h1>
                        <div className="mb-10 flex flex-col gap-3">
                            <div className="bg-purple-200 rounded-lg p-5 flex flex-col gap-3 shadow-md">
                                <h2 className="flex gap-3 text-2xl">
                                    <span>UID:</span>
                                    <span>{user.uid.toUpperCase()}</span>
                                </h2>
                                <h2 className="flex gap-3 text-2xl">
                                    <span>Class Assigned:</span>
                                    <span>{homeInfo?.classAssigned}</span>
                                </h2>
                            </div >
                            <h2 className="flex gap-3 text-2xl bg-purple-200 rounded-lg p-5 shadow-md">
                                <span>Role:</span>
                                <span>{user.role}</span>
                            </h2>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default TeacherHome;