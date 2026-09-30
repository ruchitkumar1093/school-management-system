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

function PrincipalSubjectsTable({
    subject,
    handleEditSubject,
    handleDeleteSubject,
    startIndex
}: Props) {
    return (
        <div className="overflow-x-auto rounded-lg shadow-md">
            <table className="w-full border-collapse bg-purple-200 text-left text-gray-900">
                <thead>
                    <tr className="border-b border-purple-300 bg-purple-300/80">
                        <th className="border-r border-purple-300 p-3 font-semibold text-purple-950">
                            S.No.
                        </th>
                        <th className="border-r border-purple-300 p-3 font-semibold text-purple-950">
                            Subject Name:
                        </th>
                        <th className="border-r border-purple-300 p-3 font-semibold text-purple-950">
                            Subject Code:
                        </th>
                        <th className="border-r border-purple-300 p-3 font-semibold text-purple-950">
                            Class:
                        </th>
                        <th className="border-r border-purple-300 p-3 font-semibold text-purple-950">
                            Teacher Assigned:
                        </th>
                        <th className="p-3 font-semibold text-purple-950">
                            Actions:
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {subject.length === 0 ? (
                        <tr>
                            <td
                                colSpan={6}
                                className="p-4 text-center text-gray-500"
                            >
                                No records found
                            </td>
                        </tr>
                    ) : (
                        subject.map((sub, index) => (
                            <tr
                                key={sub._id}
                                className="border-b border-purple-300 last:border-b-0 transition-colors hover:bg-purple-300/40"
                            >
                                <td className="border-r border-purple-300 p-3 font-medium">
                                    {startIndex + index + 1}
                                </td>

                                <td className="border-r border-purple-300 p-3 font-medium">
                                    {sub.name}
                                </td>

                                <td className="border-r border-purple-300 p-3">
                                    {sub.subjectCode.toUpperCase()}
                                </td>

                                <td className="border-r border-purple-300 p-3">
                                    {sub.class}
                                </td>

                                <td className="border-r border-purple-300 p-3">
                                    {sub.teacherName}
                                </td>

                                <td className="p-3">
                                    <div className="flex items-center gap-1">
                                        <button
                                            title="Edit"
                                            onClick={() =>
                                                handleEditSubject(sub._id)
                                            }
                                            className="cursor-pointer p-1.5 text-purple-900 transition-colors hover:text-purple-600"
                                        >
                                            <FiEdit className="h-4 w-4" />
                                        </button>

                                        <button
                                            title="Delete"
                                            onClick={() =>
                                                handleDeleteSubject(sub._id)
                                            }
                                            className="cursor-pointer p-1.5 text-purple-900 transition-colors hover:text-red-700"
                                        >
                                            <FiTrash className="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default PrincipalSubjectsTable;