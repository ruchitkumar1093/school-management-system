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

    type TeacherInfo = {
        class: string;
        rollNumber: number;
        userId: {
            name: string;
            uid: string;
            role: string;
        };
    };

    const studentPhotos = [
        student1,
        student2,
        student3,
        student4,
        student5
    ];

    const [studentInfo, setStudentInfo] = useState<TeacherInfo | null>(null);

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
                    const student = response.data;
                    setStudentInfo(student);
                }
            }
            catch (error) {
                console.log(error);
            }
        };
        fetchStudent();
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
                            <h1 className="text-3xl mb-10">Student Profile:</h1>
                            <div className="flex p-7 bg-purple-200 rounded-lg mb-7 gap-x-15">
                                <div className="flex flex-col justify-between items-center">
                                    <img
                                        src={studentPhoto}
                                        alt="Student profile"
                                        className="w-28 h-28 rounded-full object-cover shadow-md"
                                    />
                                    <span className="text-lg">{studentInfo?.userId.name}</span>
                                </div>
                                <div className="flex flex-col gap-5">
                                    <h2 className="flex gap-3">
                                        <span>UID:</span>
                                        <span>{studentInfo?.userId.uid.toUpperCase()}</span>
                                    </h2>
                                    <h2 className="flex gap-3">
                                        <span>Role:</span>
                                        <span className="capitalize">{studentInfo?.userId.role}</span>
                                    </h2>
                                    <h2 className="flex gap-3">
                                        <span>Class:</span>
                                        <span>{studentInfo?.class}</span>
                                    </h2>
                                    <h2 className="flex gap-3">
                                        <span>Roll no:</span>
                                        <span>{studentInfo?.rollNumber}</span>
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

export default StudentProfile;