import { useEffect, useState } from "react";
import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import Breadcrumb from "../../components/breadcrumb";
import ClassTabs from "../../components/classTabs";
import { getClassOverview } from "../../services/principalApi";

type ClassOverview = {
    class: string;
    classTeacher: {
        name: string;
        employeeID: string;
        uid: string;
    };
    students: number;
    teachers: number;
    subjects: number;
    overallAttendance: number;
};

function PrincipalViewClass() {

    const [selectedClass, setSelectedClass] = useState("1st");

    const [classOverview, setClassOverview] =
        useState<ClassOverview | null>(null);

    const [loading, setLoading] = useState(false);

    useEffect(() => {

        const fetchClassOverview = async () => {

            try {
                setLoading(true);

                const response =
                    await getClassOverview(selectedClass);

                setClassOverview(response.data);
            }
            catch (error) {
                console.error(
                    "Failed to fetch class overview:",
                    error
                );

                setClassOverview(null);
            }
            finally {
                setLoading(false);
            }
        };

        fetchClassOverview();

    }, [selectedClass]);

    return (
        <div className="flex flex-col min-h-screen font-fredoka">

            <NavBar />

            <div className="flex flex-1 bg-purple-100">

                <SideBar />

                <div>

                    <Breadcrumb />

                    <div className="flex flex-1 bg-purple-100 mr-15">

                        <div className="flex flex-col pt-12 pl-20">

                            <h1 className="text-3xl mb-10">
                                Class Overview:
                            </h1>

                            <div className="flex mb-8">

                                <ClassTabs
                                    selectedClass={selectedClass}
                                    onClassChange={setSelectedClass}
                                />

                            </div>

                            <div className="p-4">

                                {loading ? (

                                    <p className="text-gray-600">
                                        Loading class information...
                                    </p>

                                ) : classOverview ? (

                                    <div className="flex flex-col gap-3">

                                        <h2 className="flex gap-3">
                                            <span>
                                                Class Teacher:
                                            </span>

                                            <span>
                                                {classOverview.classTeacher.name}
                                            </span>
                                        </h2>

                                        <h2 className="flex gap-3">
                                            <span>
                                                EmployeeID:
                                            </span>

                                            <span>
                                                {classOverview.classTeacher.employeeID}
                                            </span>
                                        </h2>

                                        <h2 className="flex gap-3">
                                            <span>
                                                Total Students:
                                            </span>

                                            <span>
                                                {classOverview.students}
                                            </span>
                                        </h2>

                                        <h2 className="flex gap-3">
                                            <span>
                                                Total Teachers:
                                            </span>

                                            <span>
                                                {classOverview.teachers}
                                            </span>
                                        </h2>

                                        <h2 className="flex gap-3">
                                            <span>
                                                Total Subjects:
                                            </span>

                                            <span>
                                                {classOverview.subjects}
                                            </span>
                                        </h2>

                                        <h2 className="flex gap-3">
                                            <span>
                                                Overall Attendance:
                                            </span>

                                            <span>
                                                {classOverview.overallAttendance}%
                                            </span>
                                        </h2>

                                    </div>

                                ) : (

                                    <p className="text-red-500">
                                        Failed to load class information.
                                    </p>

                                )}

                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
}

export default PrincipalViewClass;