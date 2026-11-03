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
        <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-y-2 text-left text-gray-900">
                <thead>
                    <tr>
                        <th className="px-3 py-2 font-semibold text-purple-950 bg-purple-300 rounded-l-lg">
                            S.No.
                        </th>
                        <th className="px-3 py-2 font-semibold text-purple-950 bg-purple-300">
                            Subject Name:
                        </th>
                        <th className="px-3 py-2 font-semibold text-purple-950 bg-purple-300">
                            Subject Code:
                        </th>
                        <th className="px-3 py-2 font-semibold text-purple-950 bg-purple-300">
                            Class:
                        </th>
                        <th className="px-3 py-2 font-semibold text-purple-950 bg-purple-300">
                            Teacher Assigned:
                        </th>
                        <th className="px-3 py-2 text-center font-semibold text-purple-950 bg-purple-300 rounded-r-lg">
                            Actions:
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {subject.length === 0 ? (
                        <tr>
                            <td
                                colSpan={6}
                                className="rounded-lg bg-purple-100 p-4 text-center text-gray-500"
                            >
                                No records found
                            </td>
                        </tr>
                    ) : (
                        subject.map((sub, index) => (
                            <tr
                                key={sub._id}
                                className="group transition-colors"
                            >
                                <td className="whitespace-nowrap rounded-l-lg border-y border-l border-none bg-purple-200 p-3 font-medium group-hover:bg-purple-200/70">
                                    {startIndex + index + 1}
                                </td>

                                <td className="border-y border-none bg-purple-200 p-3 font-medium group-hover:bg-purple-200/70">
                                    {sub.name}
                                </td>

                                <td className="border-y border-none bg-purple-200 p-3 group-hover:bg-purple-200/70">
                                    {sub.subjectCode.toUpperCase()}
                                </td>

                                <td className="border-y border-none bg-purple-200 p-3 group-hover:bg-purple-200/70">
                                    {sub.class}
                                </td>

                                <td className="border-y border-none bg-purple-200 p-3 group-hover:bg-purple-200/70">
                                    {sub.teacherName}
                                </td>

                                <td className="rounded-r-lg border-y border-r border-none bg-purple-200 p-3 group-hover:bg-purple-200/70">
                                    <div className="flex items-center justify-center gap-1">
                                        <button
                                            type="button"
                                            title="Edit"
                                            aria-label={`Edit ${sub.name}`}
                                            onClick={() =>
                                                handleEditSubject(sub._id)
                                            }
                                            className="cursor-pointer rounded-md p-1.5 text-purple-900 transition-colors hover:bg-purple-200 hover:text-purple-700"
                                        >
                                            <FiEdit className="h-4 w-4" />
                                        </button>

                                        <button
                                            type="button"
                                            title="Delete"
                                            aria-label={`Delete ${sub.name}`}
                                            onClick={() =>
                                                handleDeleteSubject(sub._id)
                                            }
                                            className="cursor-pointer rounded-md p-1.5 text-purple-900 transition-colors hover:bg-red-100 hover:text-red-700"
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