import logo from "../assets/logo.png";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createAdmission } from "../services/admissionApi";

function AdmissionForm() {

    type FormData = {
        studentName: string;
        dateOfBirth: string;
        gender: string;
        classApplyingFor: string;
        previousClass: string;

        fatherName: string;
        motherName: string;
        phone: string;
        email: string;

        address: string;
        city: string;
        state: string;
        pinCode: string;

        bloodGroup: string;
        aadhaarNumber: string;

        academicYear: string;
    };

    const navigate = useNavigate();

    const [formData, setFormData] = useState<FormData>({
        studentName: "",
        dateOfBirth: "",
        gender: "Select an option",
        classApplyingFor: "Select an option",
        previousClass: "",

        fatherName: "",
        motherName: "",
        phone: "",
        email: "",

        address: "",
        city: "",
        state: "",
        pinCode: "",

        bloodGroup: "Select an option",
        aadhaarNumber: "",

        academicYear: "2026-27"
    });

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            await createAdmission(formData);
            alert("Applied Successfully ✅");
            navigate(-1);
        }
        catch (error: any) {
            console.log(error);
            alert(error.response?.data?.message || "Failed to reject Admission");
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <div className="flex flex-col min-h-screen font-fredoka bg-purple-100">

            <nav className="z-10 flex justify-between p-4 font-fredoka bg-purple-300 shadow-sm">
                <div className="flex items-center">
                    <img src={logo} alt="school logo" className="h-10" />
                    <h1 className="text-3xl">GPS</h1>
                </div>

                <button className="bg-purple-900 text-white rounded-md p-3 hover:bg-purple-950"
                    type="button" onClick={() => navigate("/login")}>Login</button>

            </nav>

            <div className="flex justify-center py-12 px-5">
                <form onSubmit={handleSubmit}
                    className="w-full max-w-4xl bg-white rounded-xl shadow-lg p-10 flex flex-col gap-10">

                    <div className="text-center">
                        <h1 className="text-4xl mb-2">Student Admission Form
                        </h1>

                        <p className="text-gray-600">
                            Please provide the required information to apply for admission.
                        </p>
                    </div>

                    <div className="flex flex-col gap-6">

                        <h2 className="text-2xl border-b-2 border-purple-200 pb-2">Student Details
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            <div className="flex flex-col gap-2">
                                <label htmlFor="studentName">Student Name:</label>

                                <input
                                    required
                                    value={formData.studentName}
                                    onChange={handleChange}
                                    className="border-2 border-gray-500 rounded-sm p-2
                                    focus:outline-none focus:border-gray-900
                                    transition-colors duration-300 ease-in-out"
                                    type="text"
                                    id="studentName"
                                    name="studentName"
                                    placeholder="Enter Student Name"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label htmlFor="dateOfBirth">Date of Birth:</label>

                                <input
                                    required
                                    value={formData.dateOfBirth}
                                    onChange={handleChange}
                                    className="border-2 border-gray-500 rounded-sm p-2
                                    focus:outline-none focus:border-gray-900
                                    transition-colors duration-300 ease-in-out"
                                    type="date"
                                    id="dateOfBirth"
                                    name="dateOfBirth"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label htmlFor="gender">Gender:</label>

                                <select
                                    required
                                    value={formData.gender}
                                    onChange={handleChange}
                                    className="border-2 border-gray-500 rounded-sm p-2
                                    focus:outline-none focus:border-gray-900
                                    transition-colors duration-300 ease-in-out"
                                    id="gender"
                                    name="gender"
                                >
                                    <option value="Select an option" disabled>
                                        Select an option
                                    </option>

                                    <option value="Male">
                                        Male
                                    </option>

                                    <option value="Female">
                                        Female
                                    </option>

                                    <option value="Other">
                                        Other
                                    </option>
                                </select>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label htmlFor="classApplyingFor">Class Applying For:</label>

                                <select
                                    required
                                    value={formData.classApplyingFor}
                                    onChange={handleChange}
                                    className="border-2 border-gray-500 rounded-sm p-2
                                    focus:outline-none focus:border-gray-900
                                    transition-colors duration-300 ease-in-out"
                                    id="classApplyingFor"
                                    name="classApplyingFor"
                                >
                                    <option value="Select an option" disabled>
                                        Select an option
                                    </option>

                                    <option value="1st">1st</option>
                                    <option value="2nd">2nd</option>
                                    <option value="3rd">3rd</option>
                                    <option value="4th">4th</option>
                                    <option value="5th">5th</option>
                                    <option value="6th">6th</option>
                                    <option value="7th">7th</option>
                                    <option value="8th">8th</option>
                                    <option value="9th">9th</option>
                                    <option value="10th">10th</option>
                                    <option value="11th">11th</option>
                                    <option value="12th">12th</option>
                                </select>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label htmlFor="previousClass">Previous Class: </label>

                                <select
                                    value={formData.previousClass}
                                    onChange={handleChange}
                                    className="border-2 border-gray-500 rounded-sm p-2
                                    focus:outline-none focus:border-gray-900
                                    transition-colors duration-300 ease-in-out"
                                    id="previousClass"
                                    name="previousClass"
                                >
                                    <option value="">
                                        Select Previous Class
                                    </option>

                                    <option value="1st">1st</option>
                                    <option value="2nd">2nd</option>
                                    <option value="3rd">3rd</option>
                                    <option value="4th">4th</option>
                                    <option value="5th">5th</option>
                                    <option value="6th">6th</option>
                                    <option value="7th">7th</option>
                                    <option value="8th">8th</option>
                                    <option value="9th">9th</option>
                                    <option value="10th">10th</option>
                                    <option value="11th">11th</option>
                                    <option value="12th">12th</option>
                                </select>
                            </div>

                        </div>
                    </div>

                    <div className="flex flex-col gap-6">

                        <h2 className="text-2xl border-b-2 border-purple-200 pb-2">Parent / Guardian Details
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            <div className="flex flex-col gap-2">
                                <label htmlFor="fatherName">Father's Name: </label>

                                <input
                                    required value={formData.fatherName}
                                    onChange={handleChange} className="border-2 border-gray-500 rounded-sm p-2
                                    focus:outline-none focus:border-gray-900
                                    transition-colors duration-300 ease-in-out"
                                    type="text" id="fatherName"
                                    name="fatherName" placeholder="Enter Father's Name"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label htmlFor="motherName"> Mother's Name: </label>

                                <input
                                    required value={formData.motherName}
                                    onChange={handleChange} className="border-2 border-gray-500 rounded-sm p-2
                                    focus:outline-none focus:border-gray-900
                                    transition-colors duration-300 ease-in-out"
                                    type="text" id="motherName"
                                    name="motherName" placeholder="Enter Mother's Name"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label htmlFor="phone"> Parent / Guardian Phone: </label>

                                <input
                                    required value={formData.phone} onChange={handleChange}
                                    className="border-2 border-gray-500 rounded-sm p-2
                                    focus:outline-none focus:border-gray-900
                                    transition-colors duration-300 ease-in-out"
                                    type="tel" id="phone" name="phone" placeholder="Enter Phone Number"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label htmlFor="email"> Email Address: </label>

                                <input
                                    value={formData.email} onChange={handleChange}
                                    className="border-2 border-gray-500 rounded-sm p-2
                                    focus:outline-none focus:border-gray-900
                                    transition-colors duration-300 ease-in-out"
                                    type="email" id="email" name="email" placeholder="Enter Email Address"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-6">
                        <h2 className="text-2xl border-b-2 border-purple-200 pb-2"> Address Details </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2 md:col-span-2">
                                <label htmlFor="address"> Address: </label>
                                <textarea
                                    required value={formData.address} onChange={handleChange}
                                    className="border-2 border-gray-500 rounded-sm p-2
                                    focus:outline-none focus:border-gray-900
                                    transition-colors duration-300 ease-in-out resize-none"
                                    id="address" name="address"
                                    placeholder="Enter Address" rows={3}
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label htmlFor="city"> City: </label>

                                <input
                                    required value={formData.city}
                                    onChange={handleChange} className="border-2 border-gray-500 rounded-sm p-2
                                    focus:outline-none focus:border-gray-900
                                    transition-colors duration-300 ease-in-out"
                                    type="text" id="city" name="city" placeholder="Enter City"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label htmlFor="state"> State: </label>

                                <input
                                    required value={formData.state} onChange={handleChange}
                                    className="border-2 border-gray-500 rounded-sm p-2
                                    focus:outline-none focus:border-gray-900
                                    transition-colors duration-300 ease-in-out" type="text"
                                    id="state" name="state" placeholder="Enter State" />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label htmlFor="pinCode"> PIN Code: </label>

                                <input
                                    required value={formData.pinCode} onChange={handleChange}
                                    className="border-2 border-gray-500 rounded-sm p-2
                                    focus:outline-none focus:border-gray-900
                                    transition-colors duration-300 ease-in-out"
                                    type="text" id="pinCode" name="pinCode"
                                    placeholder="Enter PIN Code" maxLength={6} />
                            </div>

                        </div>
                    </div>

                    <div className="flex flex-col gap-6">

                        <h2 className="text-2xl border-b-2 border-purple-200 pb-2"> Additional Information </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            <div className="flex flex-col gap-2">
                                <label htmlFor="bloodGroup"> Blood Group: </label>

                                <select
                                    value={formData.bloodGroup} onChange={handleChange}
                                    className="border-2 border-gray-500 rounded-sm p-2
                                    focus:outline-none focus:border-gray-900
                                    transition-colors duration-300 ease-in-out" id="bloodGroup"
                                    name="bloodGroup" >
                                    <option value="Select an option">
                                        Select an option
                                    </option>

                                    <option value="A+">A+</option>
                                    <option value="A-">A-</option>
                                    <option value="B+">B+</option>
                                    <option value="B-">B-</option>
                                    <option value="AB+">AB+</option>
                                    <option value="AB-">AB-</option>
                                    <option value="O+">O+</option>
                                    <option value="O-">O-</option>
                                </select>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label htmlFor="aadhaarNumber">
                                    Aadhaar Number:</label>
                                <input
                                    value={formData.aadhaarNumber}
                                    onChange={handleChange}
                                    className="border-2 border-gray-500 rounded-sm p-2 focus:outline-none focus:border-gray-900
                                    transition-colors duration-300 ease-in-out" type="text"
                                    id="aadhaarNumber" name="aadhaarNumber" placeholder="Enter Aadhaar Number" maxLength={12}
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label htmlFor="academicYear">
                                    Academic Year:
                                </label>

                                <select
                                    required
                                    value={formData.academicYear}
                                    onChange={handleChange}
                                    className="border-2 border-gray-500 rounded-sm p-2
                                    focus:outline-none focus:border-gray-900
                                    transition-colors duration-300 ease-in-out"
                                    id="academicYear"
                                    name="academicYear"
                                >
                                    <option value="2026-27">
                                        2026-27
                                    </option>

                                    <option value="2027-28">
                                        2027-28
                                    </option>

                                    <option value="2028-29">
                                        2028-29
                                    </option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">

                        <h2 className="text-2xl border-b-2 border-purple-200 pb-2">
                            Declaration
                        </h2>

                        <label className="flex items-start gap-3 cursor-pointer">

                            <input
                                required
                                type="checkbox"
                                className="mt-1 w-4 h-4 cursor-pointer" />

                            <span>I confirm that the information provided in this
                                application is correct and complete to the best
                                of my knowledge.</span>
                        </label>
                    </div>

                    <div className="flex justify-center gap-5 pt-3">
                        <button
                            type="submit"
                            className="p-3 px-6 bg-purple-300 rounded-lg
                            shadow-[0_2px_3px] hover:bg-violet-300
                            cursor-pointer"
                        >Submit Admission Application</button>

                        <button
                            onClick={() => navigate("/")}
                            type="button"
                            className="p-3 px-6 bg-gray-200 rounded-lg
                            shadow-[0_2px_3px] hover:bg-gray-300
                            cursor-pointer"
                        >Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AdmissionForm;