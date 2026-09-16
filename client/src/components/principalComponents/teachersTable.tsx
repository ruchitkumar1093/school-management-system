import { FiEdit, FiTrash } from "react-icons/fi";

type Teacher = {
    _id: string;
    userId: {
        name: string;
    };
    employeeID: string;
    department: string;
    classAssigned: string;
};

type Props = {
    teacher: Teacher[];
    handleEditTeacher: (id: string) => void;
    handleDeleteTeacher: (id: string) => void;
    startIndex: number;
};

function PrincipalTeachersTable({ teacher, handleEditTeacher, handleDeleteTeacher, startIndex }: Props) {
    return (
        <div>
            <table className="border-collapse border border-gray-400 bg-purple-200">
                <thead>
                    <tr className="bg-purple-300">
                        <th className="border border-gray-400 p-3 font-medium">S.No.</th>
                        <th className="border border-gray-400 p-3 font-medium">Teacher Name:</th>
                        <th className="border border-gray-400 p-3 font-medium">Employee ID:</th>
                        <th className="border border-gray-400 p-3 font-medium">Department:</th>
                        <th className="border border-gray-400 p-3 font-medium">Class Assigned:</th>
                        <th className="border border-gray-400 p-3 font-medium">Actions:</th>
                    </tr>
                </thead>
                <tbody>
                    {teacher.length === 0 ? (
                        <tr>
                            <td
                                colSpan={5}
                                className="border border-gray-400 p-3 text-center text-gray-600"
                            >
                                No records found
                            </td>
                        </tr>
                    ) : (teacher.map((tch, index) => (
                        <tr key={tch._id}>
                            <td className="border border-gray-400 p-3">{startIndex + index + 1}</td>
                            <td className="border border-gray-400 p-3">{tch.userId.name}</td>
                            <td className="border border-gray-400 p-3">{tch.employeeID.toUpperCase()}</td>
                            <td className="border border-gray-400 p-3">{tch.department}</td>
                            <td className="border border-gray-400 p-3">{tch.classAssigned}</td>
                            <td className="border border-gray-400 p-3">
                                <div className="flex gap-2">
                                    <button onClick={() => handleEditTeacher(tch._id)} className="hover:text-purple-700 p-2 cursor-pointer"><FiEdit /></button>
                                    <button onClick={() => handleDeleteTeacher(tch._id)} className="hover:text-purple-700 p-2 cursor-pointer"><FiTrash /></button>
                                </div>
                            </td>
                        </tr>
                    )))}
                </tbody>
            </table>
        </div>
    );
}

export default PrincipalTeachersTable;