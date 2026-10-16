import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import { useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { addSubject, updateSubject, getSubjectById } from "../../services/principalApi";
import { useState, useEffect } from "react";
import Breadcrumb from "../../components/breadcrumb";
import Modal from "../../components/modal";

function SubjectForm() {

    type FormData = {
        name: string;
        subjectCode: string;
        class: string
    };

    const [searchParams] = useSearchParams();
    const mode = searchParams.get("mode");
    const id = searchParams.get("id");

    const isAdding = mode === "add";

    const subjectPrefixes: Record<string, string> = {
        Science: "SCI",
        Hindi: "HND",
        "Social Science": "SSC",
        English: "ENG",
        Mathematics: "MTH"
    };

    const classCodes: Record<string, string> = {
        "1st": "01",
        "2nd": "02",
        "3rd": "03",
        "4th": "04",
        "5th": "05",
        "6th": "06",
        "7th": "07",
        "8th": "08",
        "9th": "09",
        "10th": "10",
        "11th": "11",
        "12th": "12"
    };

    const navigate = useNavigate();

    const [formData, setFormData] = useState<FormData>({
        name: "Select an option",
        subjectCode: "",
        class: "Select an option"
    });

    const [modalOpen, setModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [modalMessage, setModalMessage] = useState("");

    useEffect(() => {
        const fetchSubject = async () => {
            try {
                if (!isAdding && id) {
                    const response = await getSubjectById(id);
                    const subject = response.data;

                    setFormData({
                        name: subject.name,
                        subjectCode: subject.subjectCode,
                        class: subject.class
                    });
                }
            }
            catch (error) {
                console.log(error);
            }
        };
        fetchSubject();
    }, [id, isAdding]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            if (isAdding) {
                await addSubject(formData);
                setModalTitle("Success");
                setModalMessage("Subject Added");
            }
            else if (id) {
                await updateSubject(id, formData);
                setModalTitle("Success");
                setModalMessage("Subject Updated");
            }

            setModalOpen(true);
        }
        catch (error: any) {
            console.log(error);

            setModalTitle("Error");
            setModalMessage(
                error.response?.data?.message || "Failed"
            );
            setModalOpen(true);
        }
    };

    const handleModalClose = () => {
        setModalOpen(false);

        if (
            modalMessage === "Subject Added" ||
            modalMessage === "Subject Updated"
        ) {
            navigate(-1);
        }
    };

    const generateSubjectCode = (name: string, className: string) => {
        const prefix = subjectPrefixes[name];
        const classCode = classCodes[className];

        if (!prefix || !classCode) {
            return "";
        }

        return `${prefix}${classCode}`;
    };

    return (
        <div className="flex flex-col min-h-screen font-fredoka">
            <NavBar />

            <div className="flex flex-1 bg-purple-100">
                <SideBar />

                <div>
                    <Breadcrumb />

                    <form onSubmit={handleSubmit} className="flex flex-col gap-7 p-15">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="name">Subject Name:</label>
                            <select required value={formData.name}
                                onChange={(e) => {
                                    const name = e.target.value;

                                    setFormData(previous => ({
                                        ...previous,
                                        name,
                                        subjectCode: generateSubjectCode(
                                            name,
                                            previous.class
                                        )
                                    }));
                                }} className="w-sm border-2 border-gray-500 rounded-sm p-2
                    focus:outline-none focus:border-gray-900 transition-colors duration-300 ease-in-out"
                                id="name" name="name">
                                <option disabled>Select an option</option>
                                <option>Science</option>
                                <option>Mathematics</option>
                                <option>English</option>
                                <option>Social Science</option>
                                <option>Hindi</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label htmlFor="class">Class:</label>
                            <select required value={formData.class}
                                onChange={(e) => {
                                    const className = e.target.value;

                                    setFormData(previous => ({
                                        ...previous,
                                        class: className,
                                        subjectCode: generateSubjectCode(
                                            previous.name,
                                            className
                                        )
                                    }));
                                }} className="w-sm border-2 border-gray-500 rounded-sm p-2
                    focus:outline-none focus:border-gray-900 transition-colors duration-300 ease-in-out"
                                id="class" name="class">
                                <option disabled>Select an option</option>
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

                        <div className="flex flex-col gap-2">
                            <label htmlFor="code">Subject Code:</label>
                            <input required value={formData.subjectCode} onChange={(e) => setFormData({
                                ...formData,
                                subjectCode: e.target.value
                            })} className="w-sm border-2 border-gray-500 rounded-sm p-2
                    focus:outline-none focus:border-gray-900 transition-colors duration-300 ease-in-out"
                                type="text" id="code" placeholder="Enter Subject Code" name="code" />
                        </div>

                        <div className="flex gap-5">
                            <button type="submit" className="rounded-lg bg-purple-300 px-6 py-3 font-medium text-purple-950 shadow-[0_2px_3px] transition-colors hover:bg-violet-300 cursor-pointer">
                                {isAdding ? "Add" : "Update"}
                            </button>

                            <button onClick={() => navigate(-1)} type="button" className="rounded-lg bg-purple-300 px-6 py-3 font-medium text-purple-950 shadow-[0_2px_3px] transition-colors hover:bg-violet-300 cursor-pointer">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <Modal
                isOpen={modalOpen}
                title={modalTitle}
                message={modalMessage}
                onClose={handleModalClose}
            />
        </div>
    );
}

export default SubjectForm;