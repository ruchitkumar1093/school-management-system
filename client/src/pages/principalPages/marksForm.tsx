import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import { useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import {
    addMark,
    updateMark,
    getMarkById,
    viewStudents,
    viewTeachers
} from "../../services/principalApi";
import { useState, useEffect } from "react";
import Breadcrumb from "../../components/breadcrumb";


type FormData = {
    class: string;
    studentId: string;
    teacherId: string;
    subjectName: string;
    exam: string;
    marksObtained: string;
    totalMarks: string;
};


type Student = {
    _id: string;
    userId: {
        name: string;
        uid: string;
    };
    class: string;
    rollNumber: number;
};


type Teacher = {
    _id: string;
    userId: {
        name: string;
        uid: string;
    };
    employeeID: string;
    department: string;
    classAssigned: string;
};


function MarksForm() {

    const [searchParams] = useSearchParams();
    const mode = searchParams.get("mode");
    const id = searchParams.get("id");

    const isAdding = mode === "add";

    const navigate = useNavigate();

    const [formData, setFormData] = useState<FormData>({
        class: "Select an option",
        studentId: "",
        teacherId: "",
        subjectName: "Select an option",
        exam: "Select an option",
        marksObtained: "",
        totalMarks: ""
    });

    const [students, setStudents] = useState<Student[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);


    useEffect(() => {

        const fetchData = async () => {

            try {

                const [studentsResponse, teachersResponse] = await Promise.all([
                    viewStudents(),
                    viewTeachers()
                ]);

                setStudents(studentsResponse.data);
                setTeachers(teachersResponse.data);

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
                    console.log("Mark being edited:", mark);

                    setFormData({
                        class: mark.studentId?.class ?? "",
                        studentId: mark.studentId?._id ?? "",
                        teacherId: mark.teacherId?._id ?? "",
                        subjectName: mark.subjectId?.name ?? "",
                        exam: mark.exam ?? "",
                        marksObtained: mark.marksObtained?.toString() ?? "",
                        totalMarks: mark.totalMarks?.toString() ?? ""
                    });
                }

            }
            catch (error) {
                console.log(error);
            }
        };

        fetchMark();

    }, [id, isAdding]);


    const filteredStudents = students.filter(
        (student) => student.class === formData.class
    );


    const filteredTeachers = teachers.filter(
        (teacher) => teacher.classAssigned === formData.class
    );


    const handleClassChange = (value: string) => {

        setFormData({
            ...formData,
            class: value,
            studentId: "",
            teacherId: ""
        });

    };


    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {

        e.preventDefault();

        try {

            if (isAdding) {

                await addMark(formData);

                alert("Marks Added");

            }
            else if (id) {

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

                            <label htmlFor="class">
                                Class:
                            </label>

                            <select
                                required
                                value={formData.class}
                                onChange={(e) =>
                                    handleClassChange(e.target.value)
                                }
                                className="w-sm border-2 border-gray-500 rounded-sm p-2
                                focus:outline-none focus:border-gray-900
                                transition-colors duration-300 ease-in-out"
                                id="class"
                                name="class"
                            >

                                <option disabled>
                                    Select an option
                                </option>

                                <option>1st</option>
                                <option>2nd</option>
                                <option>3rd</option>
                                <option>4th</option>
                                <option>5th</option>
                                <option>6th</option>
                                <option>7th</option>
                                <option>8th</option>
                                <option>9th</option>
                                <option>10th</option>
                                <option>11th</option>
                                <option>12th</option>

                            </select>

                        </div>


                        {/* Student */}

                        <div className="flex flex-col gap-2">

                            <label htmlFor="student">
                                Student:
                            </label>

                            <select
                                required
                                disabled={formData.class === "Select an option"}
                                value={formData.studentId}
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

                                {filteredStudents.map((student) => (

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


                        {/* Teacher */}

                        <div className="flex flex-col gap-2">

                            <label htmlFor="teacher">
                                Teacher:
                            </label>

                            <select
                                required
                                disabled={formData.class === "Select an option"}
                                value={formData.teacherId}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        teacherId: e.target.value
                                    })
                                }
                                className="w-sm border-2 border-gray-500 rounded-sm p-2
                                focus:outline-none focus:border-gray-900
                                transition-colors duration-300 ease-in-out
                                disabled:bg-gray-200 disabled:cursor-not-allowed"
                                id="teacher"
                                name="teacher"
                            >

                                <option value="" disabled>
                                    Select a teacher
                                </option>

                                {filteredTeachers.map((teacher) => (

                                    <option
                                        key={teacher._id}
                                        value={teacher._id}
                                    >
                                        {teacher.userId.name} -{" "}
                                        {teacher.employeeID.toUpperCase()}
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


                        {/* Exam */}

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