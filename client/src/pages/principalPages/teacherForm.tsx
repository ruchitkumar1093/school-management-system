import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import { useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { addTeacher, updateTeacher, getTeacherById } from "../../services/principalApi";
import { useState, useEffect } from "react";
import Breadcrumb from "../../components/breadcrumb";

function TeacherForm() {

    type FormData = {
        name: string;
        uid: string;
        password: string;
        employeeID: string;
        department: string;
        classAssigned: string;
    };


    const [searchParams] = useSearchParams();
    const mode = searchParams.get("mode");
    const id = searchParams.get("id");

    const isAdding = mode === "add";

    const [formData, setFormData] = useState<FormData>({
        name: "",
        uid: "",
        password: "",
        employeeID: "",
        department: "Select an option",
        classAssigned: "Select an option"
    });

    useEffect(() => {
        const fetchTeacher = async () => {
            try {
                if (!isAdding && id) {
                    const response = await getTeacherById(id);
                    const teacher = response.data;

                    setFormData({
                        name: teacher.userId.name,
                        uid: teacher.userId.uid,
                        password: "",
                        employeeID: teacher.employeeID,
                        department: teacher.department,
                        classAssigned: teacher.classAssigned
                    });
                }
            }
            catch (error) {
                console.log(error);
            }
        };
        fetchTeacher();
    }, [id, isAdding]);

    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            if (isAdding) {
                await addTeacher(formData);
                alert("Teacher Added");
            }
            else if (id) {
                await updateTeacher(id, formData);
                alert("Teacher Updated");
            }
            navigate(-1);

        }
        catch (error: any) {
            console.log(error);
            alert(error.response?.data?.message || "Failed");
        }
    }

    return (
        <div className="flex flex-col min-h-screen font-fredoka">
            <NavBar />
            <div className="flex flex-1 bg-purple-100">
                <SideBar />
                <div>
                    <Breadcrumb />
                    <form onSubmit={handleSubmit} className="flex flex-col gap-7 p-15">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="name">Teacher Name:</label>
                            <input required value={formData.name} onChange={(e) => setFormData({
                                ...formData,
                                name: e.target.value
                            })} className="w-sm border-2 border-gray-500 rounded-sm p-2
                    focus:outline-none focus:border-gray-900 transition-colors duration-300 ease-in-out"
                                type="text" id="name" placeholder="Enter Teacher" name="name" />
                        </div>

                        {!isAdding && <div className="flex flex-col gap-2">
                            <label htmlFor="uid">UID:</label>
                            <input required value={formData.uid} onChange={(e) => setFormData({
                                ...formData,
                                uid: e.target.value
                            })} className="w-sm border-2 border-gray-500 rounded-sm p-2
                    focus:outline-none focus:border-gray-900 transition-colors duration-300 ease-in-out"
                                type="text" id="uid" placeholder="Enter UID" name="uid" />
                        </div>}

                        <div className="flex flex-col gap-2">
                            <label htmlFor="password">Password:</label>
                            <input value={formData.password} onChange={(e) => setFormData({
                                ...formData,
                                password: e.target.value
                            })} className="w-sm border-2 border-gray-500 rounded-sm p-2
                    focus:outline-none focus:border-gray-900 transition-colors duration-300 ease-in-out"
                                type="password" id="password" placeholder="Enter Password" name="password" />
                        </div>

                        {!isAdding && <div className="flex flex-col gap-2">
                            <label htmlFor="eId">Employee ID:</label>
                            <input required value={formData.employeeID} onChange={(e) => setFormData({
                                ...formData,
                                employeeID: e.target.value
                            })} className="w-sm border-2 border-gray-500 rounded-sm p-2
                    focus:outline-none focus:border-gray-900 transition-colors duration-300 ease-in-out"
                                type="text" id="eId" placeholder="Enter Employee ID" name="EmployeeID" />
                        </div>}

                        <div className="flex flex-col gap-2">
                            <label htmlFor="department">Department:</label>
                            <select required value={formData.department} onChange={(e) => setFormData({
                                ...formData,
                                department: e.target.value
                            })} className="w-sm border-2 border-gray-500 rounded-sm p-2
                    focus:outline-none focus:border-gray-900 transition-colors duration-300 ease-in-out"
                                id="department" name="Department">
                                <option disabled >Select an option</option>
                                <option >Science</option>
                                <option >Mathematics</option>
                                <option >English</option>
                                <option >Social Science</option>
                                <option >Hindi</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label htmlFor="class">Class Assigned:</label>
                            <select required value={formData.classAssigned} onChange={(e) => setFormData({
                                ...formData,
                                classAssigned: e.target.value
                            })} className="w-sm border-2 border-gray-500 rounded-sm p-2
                    focus:outline-none focus:border-gray-900 transition-colors duration-300 ease-in-out"
                                id="class" name="class">
                                <option disabled >Select an option</option>
                                <option >1st</option>
                                <option >2nd</option>
                                <option >3rd</option>
                                <option >4th</option>
                                <option >5th</option>
                                <option >6th</option>
                                <option >7th</option>
                                <option >8th</option>
                                <option >9th</option>
                                <option >10th</option>
                                <option >11th</option>
                                <option >12th</option>
                            </select>
                        </div>

                        <div className="flex gap-5">
                            <button type="submit" className="p-2 bg-purple-300 rounded-lg
                shadow-[0_2px_3px] hover:bg-violet-300 cursor-pointer">{isAdding ? "Add" : "Update"}</button>
                            <button onClick={() => navigate(-1)} type="button" className="p-2 bg-purple-300 rounded-lg
                shadow-[0_2px_3px] hover:bg-violet-300 cursor-pointer">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default TeacherForm;