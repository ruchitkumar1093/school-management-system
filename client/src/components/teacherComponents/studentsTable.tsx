import { FiEdit, FiTrash } from "react-icons/fi";

type Student = {
    _id: string;
    userId: {
        name: string;
        uid: string;
    };
    class: string;
    rollNumber: number;
};

type Props = {
    student: Student[];
    handleEditStudent: (id: string) => void;
    handleDeleteStudent: (id: string) => void;
    startIndex: number;
};

function TeacherStudentsTable({ student, handleEditStudent, handleDeleteStudent, startIndex }: Props) {
    return (
        <div >
            <table className="border-collapse border border-gray-400 bg-purple-200">
                <thead>
                    <tr className="bg-purple-300">
                        <th className="border border-gray-400 p-3 font-medium">S.No.</th>
                        <th className="border border-gray-400 p-3 font-medium">Student Name:</th>
                        <th className="border border-gray-400 p-3 font-medium">UID:</th>
                        <th className="border border-gray-400 p-3 font-medium">Class:</th>
                        <th className="border border-gray-400 p-3 font-medium">Roll no:</th>
                        <th className="border border-gray-400 p-3 font-medium">Actions:</th>
                    </tr>
                </thead>
                <tbody>
                    {student.length === 0 ? (
                        <tr>
                            <td
                                colSpan={5}
                                className="border border-gray-400 p-3 text-center text-gray-600"
                            >
                                No records found
                            </td>
                        </tr>
                    ) : (student.map((std, index) => (
                        <tr key={std._id}>
                            <td className="border border-gray-400 p-3">{startIndex + index + 1}</td>
                            <td className="border border-gray-400 p-3">{std.userId.name}</td>
                            <td className="border border-gray-400 p-3">{std.userId.uid.toUpperCase()}</td>
                            <td className="border border-gray-400 p-3">{std.class}</td>
                            <td className="border border-gray-400 p-3">{std.rollNumber}</td>
                            <td className="border border-gray-400 p-3">
                                <div className="flex gap-2">
                                    <button onClick={() => handleEditStudent(std._id)} className="hover:text-purple-700 p-2 cursor-pointer"><FiEdit /></button>
                                    <button onClick={() => handleDeleteStudent(std._id)} className="hover:text-purple-700 p-2 cursor-pointer"><FiTrash /></button>
                                </div>
                            </td>
                        </tr>
                    )))}
                </tbody>
            </table>
        </div>
    );
}

export default TeacherStudentsTable;