import { useEffect, useState } from "react";
import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import Breadcrumb from "../../components/breadcrumb";
import ClassTabs from "../../components/classTabs";
import Modal from "../../components/modal";
import { getClassOverview, viewTeachers, assignClassTeacher } from "../../services/principalApi";

type ClassOverview = {
    class: string;
    classTeacher: {
        name: string;
        employeeID: string;
        uid: string;
    } | null;
    students: number;
    teachers: number;
    subjects: number;
    overallAttendance: number;
};

type Teacher = {
    _id: string;
    classAssigned: string;
    employeeID: string;
    userId: {
        name: string;
        uid: string;
    };
};

function PrincipalViewClass() {
    const [selectedClass, setSelectedClass] = useState("1st");
    const [classOverview, setClassOverview] =
        useState<ClassOverview | null>(null);
    const [loading, setLoading] = useState(false);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [selectedTeacher, setSelectedTeacher] = useState("");
    const [teacherLoading, setTeacherLoading] = useState(false);
    const [showTeacherForm, setShowTeacherForm] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [modalMessage, setModalMessage] = useState("");

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

    useEffect(() => {
        fetchClassOverview();
    }, [selectedClass]);

    const handleTeacherForm = async () => {
        if (showTeacherForm) {
            setShowTeacherForm(false);
            setSelectedTeacher("");
            return;
        }

        try {
            setTeacherLoading(true);

            const response = await viewTeachers(
                selectedClass,
                "",
                "Teacher Name",
                "asc",
                1,
                1000
            );

            setTeachers(response.data.teachers);
            setShowTeacherForm(true);
        }
        catch (error) {
            console.error(
                "Failed to fetch teachers:",
                error
            );

            setModalTitle("Error");
            setModalMessage("Failed to load teachers");
            setModalOpen(true);
        }
        finally {
            setTeacherLoading(false);
        }
    };

    const handleAssignTeacher = async () => {
        if (!selectedTeacher) {
            setModalTitle("Error");
            setModalMessage("Please select a teacher");
            setModalOpen(true);
            return;
        }

        try {
            setTeacherLoading(true);

            await assignClassTeacher(
                selectedClass,
                selectedTeacher
            );

            setShowTeacherForm(false);
            setSelectedTeacher("");

            await fetchClassOverview();

            setModalTitle("Success");
            setModalMessage(
                "Class teacher assigned successfully"
            );
            setModalOpen(true);
        }
        catch (error: any) {
            console.error(error);

            setModalTitle("Error");
            setModalMessage(
                error.response?.data?.message ||
                "Failed to assign class teacher"
            );
            setModalOpen(true);
        }
        finally {
            setTeacherLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col font-fredoka">

            <NavBar />

            <div className="flex flex-1 bg-purple-100">

                <SideBar />

                <div className="flex min-w-0 flex-1 flex-col">

                    <Breadcrumb />

                    <div className="flex flex-1 flex-col px-16 pt-10 pb-12">

                        <div className="mb-7">
                            <h1 className="text-3xl font-medium text-gray-900">
                                Class Overview
                            </h1>

                            <p className="mt-1 text-sm text-gray-600">
                                View information and statistics for each class
                            </p>
                        </div>

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

                            <div className="w-full rounded-xl bg-purple-200 px-6 py-5">

                                <div className="border-b border-white pb-5">

                                    <div className="flex items-center justify-between">

                                        <h2 className="text-base font-medium text-purple-900">
                                            Class Teacher
                                        </h2>

                                        <button
                                            type="button"
                                            onClick={handleTeacherForm}
                                            disabled={teacherLoading}
                                            className="cursor-pointer rounded-lg bg-purple-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-900 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {teacherLoading
                                                ? "Loading..."
                                                : classOverview.classTeacher
                                                    ? "Change Class Teacher"
                                                    : "Assign Class Teacher"}
                                        </button>

                                    </div>

                                    {classOverview.classTeacher ? (

                                        <div className="mt-4 grid grid-cols-4 gap-8">

                                            <div>
                                                <p className="text-sm text-gray-600">
                                                    Name
                                                </p>

                                                <p className="mt-1 text-base font-medium text-gray-900">
                                                    {classOverview.classTeacher.name}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-sm text-gray-600">
                                                    Employee ID
                                                </p>

                                                <p className="mt-1 text-base font-medium text-gray-900">
                                                    {classOverview.classTeacher.employeeID}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-sm text-gray-600">
                                                    UID
                                                </p>

                                                <p className="mt-1 text-base font-medium text-gray-900">
                                                    {classOverview.classTeacher.uid}
                                                </p>
                                            </div>

                                        </div>

                                    ) : (

                                        <p className="mt-4 text-sm text-gray-600">
                                            No class teacher assigned.
                                        </p>

                                    )}

                                    {showTeacherForm && (

                                        <div className="mt-5 rounded-lg bg-purple-100 p-4">

                                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                                Select Class Teacher
                                            </label>

                                            <div className="flex items-center gap-3">

                                                <select
                                                    value={selectedTeacher}
                                                    onChange={(event) =>
                                                        setSelectedTeacher(
                                                            event.target.value
                                                        )
                                                    }
                                                    className="w-full rounded-lg border border-purple-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-purple-600"
                                                >
                                                    <option value="">
                                                        Select a teacher
                                                    </option>

                                                    {teachers.map((teacher) => (
                                                        <option
                                                            key={teacher._id}
                                                            value={teacher._id}
                                                        >
                                                            {teacher.userId.name} - {teacher.employeeID}
                                                        </option>
                                                    ))}
                                                </select>

                                                <button
                                                    type="button"
                                                    onClick={handleAssignTeacher}
                                                    disabled={teacherLoading}
                                                    className="cursor-pointer whitespace-nowrap rounded-lg bg-purple-800 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-purple-900 disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    {teacherLoading
                                                        ? "Saving..."
                                                        : "Save"}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowTeacherForm(false);
                                                        setSelectedTeacher("");
                                                    }}
                                                    className="cursor-pointer whitespace-nowrap rounded-lg bg-gray-200 px-5 py-2.5 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-300"
                                                >
                                                    Cancel
                                                </button>

                                            </div>

                                            {teachers.length === 0 && (
                                                <p className="mt-3 text-sm text-gray-600">
                                                    No teachers are assigned to this class.
                                                </p>
                                            )}

                                        </div>

                                    )}

                                </div>

                                <div className="grid grid-cols-4 gap-8 pt-5">

                                    <div>
                                        <p className="text-sm text-gray-600">
                                            Total Students
                                        </p>

                                        <p className="mt-1 text-lg font-medium text-gray-900">
                                            {classOverview.students}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-gray-600">
                                            Total Teachers
                                        </p>

                                        <p className="mt-1 text-lg font-medium text-gray-900">
                                            {classOverview.teachers}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-gray-600">
                                            Total Subjects
                                        </p>

                                        <p className="mt-1 text-lg font-medium text-gray-900">
                                            {classOverview.subjects}
                                        </p>
                                    </div>

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

            <Modal
                isOpen={modalOpen}
                title={modalTitle}
                message={modalMessage}
                onClose={() => setModalOpen(false)}
            />

        </div>
    );
}

export default PrincipalViewClass;