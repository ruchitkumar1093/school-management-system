import { FiEdit, FiTrash } from "react-icons/fi";

type Mark = {
    _id: string;

    studentId: {
        class: string;
        userId: {
            name: string;
            uid: string;
        };
    } | null;

    teacherId: {
        userId: {
            name: string;
        };
    } | null;

    subjectId: {
        name: string;
    } | null;

    exam: string;
    marksObtained: number;
    totalMarks: number;
};

type Props = {
    marksData: Mark[];
    handleEditMarks: (id: string) => void;
    handleDeleteMarks: (id: string) => void;
    startIndex: number;
};

function PrincipalMarksTable({ marksData, handleEditMarks, handleDeleteMarks, startIndex }: Props) {
    return (
        <div >

            <table className="border-collapse border border-gray-400 bg-purple-200">
                <thead>
                    <tr className="bg-purple-300">
                        <th className="border border-gray-400 p-3 font-medium">S.No.</th>
                        <th className="border border-gray-400 p-3 font-medium">Student Name:</th>
                        <th className="border border-gray-400 p-3 font-medium">Subject Name:</th>
                        <th className="border border-gray-400 p-3 font-medium">UID:</th>
                        <th className="border border-gray-400 p-3 font-medium">Class:</th>
                        <th className="border border-gray-400 p-3 font-medium">Exam Type:</th>
                        <th className="border border-gray-400 p-3 font-medium">Checked By:</th>
                        <th className="border border-gray-400 p-3 font-medium">Marks Obtained:</th>
                        <th className="border border-gray-400 p-3 font-medium">Max Marks:</th>
                        <th className="border border-gray-400 p-3 font-medium">Result:</th>
                        <th className="border border-gray-400 p-3 font-medium">Actions:</th>
                    </tr>
                </thead>
                <tbody>
                    {marksData.length === 0 ? (
                        <tr>
                            <td
                                colSpan={5}
                                className="border border-gray-400 p-3 text-center text-gray-600"
                            >
                                No records found
                            </td>
                        </tr>
                    ) : (marksData.map((mark, index) => (
                        <tr key={mark._id}>
                            <td className="border border-gray-400 p-3">{startIndex + index + 1}</td>
                            <td className="border border-gray-400 p-3">{mark.studentId?.userId?.name ?? "Student Deleted"}</td>
                            <td className="border border-gray-400 p-3">{mark.subjectId?.name ?? "Subject Deleted"}</td>
                            <td className="border border-gray-400 p-3">{mark.studentId?.userId?.uid.toUpperCase() ?? "..."}</td>
                            <td className="border border-gray-400 p-3">{mark.studentId?.class ?? "..."}</td>
                            <td className="border border-gray-400 p-3">{mark.exam}</td>
                            <td className="border border-gray-400 p-3">{mark.teacherId?.userId?.name ?? "Teacher Deleted"}</td>
                            <td className="border border-gray-400 p-3">{mark.marksObtained}</td>
                            <td className="border border-gray-400 p-3">{mark.totalMarks}</td>
                            <td className={`border border-gray-400 p-3 ${(mark.marksObtained / mark.totalMarks) * 100 >= 33
                                    ? "bg-green-200" : "bg-red-200" }`}>{(mark.marksObtained / mark.totalMarks) * 100 >= 33
                                    ? "Pass" : "Fail"}</td>
                            <td className="border border-gray-400 p-3">
                                <div className="flex gap-2">
                                    <button onClick={() => handleEditMarks(mark._id)} className="hover:text-purple-700 p-2 cursor-pointer"><FiEdit /></button>
                                    <button onClick={() => handleDeleteMarks(mark._id)} className="hover:text-purple-700 p-2 cursor-pointer"><FiTrash /></button>
                                </div>
                            </td>
                        </tr>
                    )))}
                </tbody>
            </table>
        </div>
    );
}

export default PrincipalMarksTable;