import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Breadcrumb from "../../components/breadcrumb";
import { getTeacherById } from "../../services/principalApi";

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
        userId: {
            name: string;
            uid: string;
            role: string;
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
                    const teacher = response.data;
                    setTeacherInfo(teacher);
                }
            }
            catch (error) {
                console.log(error);
            }
        };
        fetchTeacher();
    }, [id]);

    return (
        <div className="flex flex-col min-h-screen font-fredoka">
            <NavBar />
            <div className="flex flex-1 bg-purple-100">
                <SideBar />
                <div>
                    <Breadcrumb />
                    <div className="flex flex-1 bg-purple-100">
                        <div className="flex flex-col pt-12 pl-20">
                            <h1 className="text-3xl mb-10">Teacher Profile:</h1>
                            <div className="flex shadow-md p-7 bg-purple-200 rounded-lg mb-7 gap-x-15">
                                <div className="flex flex-col justify-between items-center">
                                    <img
                                        src={teacherPhoto}
                                        alt="Teacher profile"
                                        className="w-32 h-32 rounded-full object-cover shadow-md"
                                    />
                                    <span className="text-lg">{teacherInfo?.userId.name}</span>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <h2 className="flex gap-3">
                                        <span>UID:</span>
                                        <span>{teacherInfo?.userId.uid.toUpperCase()}</span>
                                    </h2>
                                    <h2 className="flex gap-3">
                                        <span>Role:</span>
                                        <span className="capitalize">{teacherInfo?.userId.role}</span>
                                    </h2>
                                    <h2 className="flex gap-3">
                                        <span>employeeID:</span>
                                        <span>{teacherInfo?.employeeID.toUpperCase()}</span>
                                    </h2>
                                    <h2 className="flex gap-3">
                                        <span>Department:</span>
                                        <span>{teacherInfo?.department}</span>
                                    </h2>
                                    <h2 className="flex gap-3">
                                        <span>Class Assigned:</span>
                                        <span>{teacherInfo?.classAssigned}</span>
                                    </h2>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default TeacherProfile;