import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import { useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import {
    addMark,
    updateMark,
    getMarkById,
    viewTeacher,
    viewStudents
} from "../../services/teacherApi";
import { useState, useEffect } from "react";
import Breadcrumb from "../../components/breadcrumb";


type Student = {
    _id: string;
    userId: {
        name: string;
        uid: string;
    };
    class: string;
    rollNumber: number;
};


type FormData = {
    studentId: string;
    subjectName: string;
    exam: string;
    marksObtained: string;
    totalMarks: string;
};


function MarksForm() {

    const [searchParams] = useSearchParams();
    const mode = searchParams.get("mode");
    const id = searchParams.get("id");

    const isAdding = mode === "add";

    const navigate = useNavigate();


    const [teacherClass, setTeacherClass] = useState("");

    const [students, setStudents] = useState<Student[]>([]);


    const [formData, setFormData] = useState<FormData>({
        studentId: "",
        subjectName: "Select an option",
        exam: "Select an option",
        marksObtained: "",
        totalMarks: ""
    });


    useEffect(() => {

        const fetchData = async () => {

            try {

                const teacherResponse = await viewTeacher();

                const classAssigned = teacherResponse.data.classAssigned;

                setTeacherClass(classAssigned);


                const studentsResponse = await viewStudents();

                const classStudents = studentsResponse.data.filter(
                    (student: Student) =>
                        student.class === classAssigned
                );

                setStudents(classStudents);

            }
            catch (error) {
                console.log(error);
            }
        };

        fetchData();

    }, []);


    useEffect(() => {

        const fetchMark = async () => {

            try {

                if (!isAdding && id) {

                    const response = await getMarkById(id);
                    const mark = response.data;

                    setFormData({
                        studentId: mark.studentId?._id ?? "",
                        subjectName: mark.subjectId?.name ?? "",
                        exam: mark.exam ?? "",
                        marksObtained: mark.marksObtained ?? "",
                        totalMarks: mark.totalMarks ?? ""
                    });

                }

            }
            catch (error) {
                console.log(error);
            }

        };

        fetchMark();

    }, [id, isAdding]);


    const handleSubmit = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {

        e.preventDefault();

        try {

            if (isAdding) {

                await addMark(formData);

                alert("Marks Added");

            }
            else {

                if (!id) return;

                await updateMark(id, formData);

                alert("Marks Updated");

            }

            navigate(-1);

        }
        catch (error: any) {

            console.log(error);

            alert(
                error.response?.data?.message || "Failed"
            );

        }

    };


    return (

        <div className="flex flex-col min-h-screen font-fredoka">

            <NavBar />

            <div className="flex flex-1 bg-purple-100">

                <SideBar />

                <div>

                    <Breadcrumb />

                    <form
                        onSubmit={handleSubmit}
                        className="flex flex-col gap-7 p-15"
                    >

                        {/* Class */}

                        <div className="flex flex-col gap-2">

                            <label>
                                Class:
                            </label>
                            <input
                                type="text"
                                value={teacherClass}
                                readOnly
                                className="w-sm border-2 border-gray-500 rounded-sm p-2
                                bg-gray-200
                                focus:outline-none"
                            />

                        </div>


                        {/* Student */}

                        <div className="flex flex-col gap-2">

                            <label htmlFor="student">
                                Student:
                            </label>

                            <select
                                required
                                value={formData.studentId}
                                disabled={!teacherClass}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        studentId: e.target.value
                                    })
                                }
                                className="w-sm border-2 border-gray-500 rounded-sm p-2
                                focus:outline-none focus:border-gray-900
                                transition-colors duration-300 ease-in-out
                                disabled:bg-gray-200 disabled:cursor-not-allowed"
                                id="student"
                                name="student"
                            >

                                <option value="" disabled>
                                    Select a student
                                </option>

                                {students.map((student) => (

                                    <option
                                        key={student._id}
                                        value={student._id}
                                    >
                                        {student.userId.name} -{" "}
                                        {student.userId.uid.toUpperCase()}
                                    </option>

                                ))}

                            </select>

                        </div>


                        {/* Subject */}

                        <div className="flex flex-col gap-2">

                            <label htmlFor="subject">
                                Subject:
                            </label>

                            <select
                                required
                                value={formData.subjectName}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        subjectName: e.target.value
                                    })
                                }
                                className="w-sm border-2 border-gray-500 rounded-sm p-2
                                focus:outline-none focus:border-gray-900
                                transition-colors duration-300 ease-in-out"
                                id="subject"
                                name="subject"
                            >

                                <option disabled>
                                    Select an option
                                </option>

                                <option>Science</option>
                                <option>Mathematics</option>
                                <option>English</option>
                                <option>Social Science</option>
                                <option>Hindi</option>

                            </select>

                        </div>


                        {/* Exam Type */}

                        <div className="flex flex-col gap-2">

                            <label htmlFor="type">
                                Exam type:
                            </label>

                            <select
                                required
                                value={formData.exam}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        exam: e.target.value
                                    })
                                }
                                className="w-sm border-2 border-gray-500 rounded-sm p-2
                                focus:outline-none focus:border-gray-900
                                transition-colors duration-300 ease-in-out"
                                id="type"
                                name="exam"
                            >

                                <option disabled>
                                    Select an option
                                </option>

                                <option>class test</option>
                                <option>mid term</option>
                                <option>final</option>

                            </select>

                        </div>


                        {/* Marks Obtained */}

                        <div className="flex flex-col gap-2">

                            <label htmlFor="obt">
                                Marks Obtained:
                            </label>

                            <input
                                required
                                value={formData.marksObtained}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        marksObtained: e.target.value
                                    })
                                }
                                className="w-sm border-2 border-gray-500 rounded-sm p-2
                                focus:outline-none focus:border-gray-900
                                transition-colors duration-300 ease-in-out"
                                type="number"
                                id="obt"
                                placeholder="Enter Marks Obtained"
                                name="obt"
                            />

                        </div>


                        {/* Max Marks */}

                        <div className="flex flex-col gap-2">

                            <label htmlFor="max">
                                Max Marks:
                            </label>

                            <input
                                required
                                value={formData.totalMarks}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        totalMarks: e.target.value
                                    })
                                }
                                className="w-sm border-2 border-gray-500 rounded-sm p-2
                                focus:outline-none focus:border-gray-900
                                transition-colors duration-300 ease-in-out"
                                type="number"
                                id="max"
                                placeholder="Enter Max Marks"
                                name="max"
                            />

                        </div>


                        {/* Buttons */}

                        <div>

                            <div className="flex gap-5">

                                <button
                                    type="submit"
                                    className="p-2 bg-purple-300 rounded-lg
                                    shadow-[0_2px_3px]
                                    hover:bg-violet-300 cursor-pointer"
                                >
                                    {isAdding ? "Add" : "Update"}
                                </button>

                                <button
                                    onClick={() => navigate(-1)}
                                    type="button"
                                    className="p-2 bg-purple-300 rounded-lg
                                    shadow-[0_2px_3px]
                                    hover:bg-violet-300 cursor-pointer"
                                >
                                    Cancel
                                </button>

                            </div>

                        </div>

                    </form>

                </div>

            </div>

        </div>
    );
}

export default MarksForm;