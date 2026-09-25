import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import { useState, useEffect } from "react";
import { viewTotal } from "../../services/principalApi";
import Breadcrumb from "../../components/breadcrumb";

function PrincipalHome() {

    type HomeInfo = {
        totalStudents: number;
        totalTeachers: number;
        totalSubjects: number;
        totalClasses: number;
    }

    const [homeInfo, setHomeInfo] = useState<HomeInfo | null>(null);

    const fetchHome = async () => {
        try {
            const response = await viewTotal();
            setHomeInfo(response.data);
        }
        catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        fetchHome();
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
                        <div className="mb-10 flex gap-10">
                            <div className="flex flex-col gap-5">
                                <h2 className="flex gap-3 text-2xl bg-purple-200 p-5 rounded-lg shadow-md">
                                    <span>Total Students:</span>
                                    <span>{homeInfo?.totalStudents}</span>
                                </h2>
                                <h2 className="flex gap-3 text-2xl bg-purple-200 p-5 rounded-lg shadow-md">
                                    <span>Total Teachers:</span>
                                    <span>{homeInfo?.totalTeachers}</span>
                                </h2>
                            </div>

                            <div className="flex flex-col gap-5">
                                <h2 className="flex gap-3 text-2xl bg-purple-200 p-5 rounded-lg shadow-md">
                                    <span>Total Subjects:</span>
                                    <span>{homeInfo?.totalSubjects}</span>
                                </h2>
                                <h2 className="flex gap-3 text-2xl bg-purple-200 p-5 rounded-lg shadow-md">
                                    <span>Enrolled Classes:</span>
                                    <span>{homeInfo?.totalClasses}</span>
                                </h2>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PrincipalHome;