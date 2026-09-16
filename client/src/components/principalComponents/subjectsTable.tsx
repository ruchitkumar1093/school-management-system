import { FiEdit, FiTrash } from "react-icons/fi";

type Subject = {
    _id: string;
    name: string;
    subjectCode: string;
    class: string;
    teacherName: string;
};

type Props = {
    subject: Subject[];
    handleEditSubject: (id: string) => void;
    handleDeleteSubject: (id: string) => void;
    startIndex: number;
};

function PrincipalSubjectsTable({ subject, handleEditSubject, handleDeleteSubject, startIndex }: Props) {
    return (
        <div >

            <table className="border-collapse border border-gray-400 bg-purple-200">
                <thead>
                    <tr className="bg-purple-300">
                        <th className="border border-gray-400 p-3 font-medium">S.No.</th>
                        <th className="border border-gray-400 p-3 font-medium">Subject Name:</th>
                        <th className="border border-gray-400 p-3 font-medium">Subject Code:</th>
                        <th className="border border-gray-400 p-3 font-medium">Class:</th>
                        <th className="border border-gray-400 p-3 font-medium">Teacher Assigned:</th>
                        <th className="border border-gray-400 p-3 font-medium">Actions:</th>
                    </tr>
                </thead>
                <tbody>
                    {subject.length === 0 ? (
                        <tr>
                            <td
                                colSpan={5}
                                className="border border-gray-400 p-3 text-center text-gray-600"
                            >
                                No records found
                            </td>
                        </tr>
                    ) : (subject.map((sub, index) => (
                        <tr key={sub._id}>
                            <td className="border border-gray-400 p-3">{startIndex + index + 1}</td>
                            <td className="border border-gray-400 p-3">{sub.name}</td>
                            <td className="border border-gray-400 p-3">{sub.subjectCode.toUpperCase()}</td>
                            <td className="border border-gray-400 p-3">{sub.class}</td>
                            <td className="border border-gray-400 p-3">{sub.teacherName}</td>
                            <td className="border border-gray-400 p-3">
                                <div className="flex gap-2">
                                    <button onClick={() => handleEditSubject(sub._id)} className="hover:text-purple-700 p-2 cursor-pointer"><FiEdit /></button>
                                    <button onClick={() => handleDeleteSubject(sub._id)} className="hover:text-purple-700 p-2 cursor-pointer"><FiTrash /></button>
                                </div>
                            </td>
                        </tr>
                    )))}
                </tbody>
            </table>
        </div>
    );
}

export default PrincipalSubjectsTable;