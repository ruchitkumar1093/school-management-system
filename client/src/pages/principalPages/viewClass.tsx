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
        <div className="flex min-h-screen flex-col font-fredoka">

            <NavBar />

            <div className="flex flex-1 bg-purple-100">

                <SideBar />

                <div className="flex min-w-0 flex-1 flex-col">

                    <Breadcrumb />

                    <div className="flex flex-1 flex-col px-16 pt-10 pb-12">

                        {/* Header */}
                        <div className="mb-7">
                            <h1 className="text-3xl font-medium text-gray-900">
                                Class Overview
                            </h1>

                            <p className="mt-1 text-sm text-gray-600">
                                View information and statistics for each class
                            </p>
                        </div>

                        {/* Class Tabs */}
                        <div className="mb-7">
                            <ClassTabs
                                selectedClass={selectedClass}
                                onClassChange={setSelectedClass}
                            />
                        </div>

                        {loading ? (

                            <p className="text-gray-600">
                                Loading class information...
                            </p>

                        ) : classOverview ? (

                            <div className="max-w-4xl rounded-xl bg-purple-200 px-6 py-5">

                                {/* Class Teacher */}
                                <div className="border-b border-white pb-5">

                                    <h2 className="mb-4 text-base font-medium text-purple-900">
                                        Class Teacher
                                    </h2>

                                    <div className="grid grid-cols-4 gap-8">

                                        {/* Column 1 */}
                                        <div>
                                            <p className="text-sm text-gray-600">
                                                Name
                                            </p>

                                            <p className="mt-1 text-base font-medium text-gray-900">
                                                {classOverview.classTeacher.name}
                                            </p>
                                        </div>

                                        {/* Column 2 */}
                                        <div>
                                            <p className="text-sm text-gray-600">
                                                Employee ID
                                            </p>

                                            <p className="mt-1 text-base font-medium text-gray-900">
                                                {classOverview.classTeacher.employeeID}
                                            </p>
                                        </div>

                                    </div>

                                </div>

                                {/* Class Information */}
                                <div className="grid grid-cols-4 gap-8 pt-5">

                                    {/* Column 1 */}
                                    <div>
                                        <p className="text-sm text-gray-600">
                                            Total Students
                                        </p>

                                        <p className="mt-1 text-lg font-medium text-gray-900">
                                            {classOverview.students}
                                        </p>
                                    </div>

                                    {/* Column 2 */}
                                    <div>
                                        <p className="text-sm text-gray-600">
                                            Total Teachers
                                        </p>

                                        <p className="mt-1 text-lg font-medium text-gray-900">
                                            {classOverview.teachers}
                                        </p>
                                    </div>

                                    {/* Column 3 */}
                                    <div>
                                        <p className="text-sm text-gray-600">
                                            Total Subjects
                                        </p>

                                        <p className="mt-1 text-lg font-medium text-gray-900">
                                            {classOverview.subjects}
                                        </p>
                                    </div>

                                    {/* Column 4 */}
                                    <div>
                                        <p className="text-sm text-gray-600">
                                            Overall Attendance
                                        </p>

                                        <p className="mt-1 text-lg font-medium text-gray-900">
                                            {classOverview.overallAttendance}%
                                        </p>
                                    </div>

                                </div>

                            </div>

                        ) : (

                            <p className="text-red-600">
                                Failed to load class information.
                            </p>

                        )}

                    </div>

                </div>

            </div>

        </div>
    );
}

export default PrincipalViewClass;