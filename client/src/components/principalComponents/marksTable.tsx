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

function PrincipalMarksTable({
    marksData,
    handleEditMarks,
    handleDeleteMarks,
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
                            Student Name:
                        </th>
                        <th className="border-r border-purple-300 p-3 font-semibold text-purple-950">
                            Subject Name:
                        </th>
                        <th className="border-r border-purple-300 p-3 font-semibold text-purple-950">
                            UID:
                        </th>
                        <th className="border-r border-purple-300 p-3 font-semibold text-purple-950">
                            Class:
                        </th>
                        <th className="border-r border-purple-300 p-3 font-semibold text-purple-950">
                            Exam Type:
                        </th>
                        <th className="border-r border-purple-300 p-3 font-semibold text-purple-950">
                            Checked By:
                        </th>
                        <th className="border-r border-purple-300 p-3 font-semibold text-purple-950">
                            Marks Obtained:
                        </th>
                        <th className="border-r border-purple-300 p-3 font-semibold text-purple-950">
                            Max Marks:
                        </th>
                        <th className="border-r border-purple-300 p-3 font-semibold text-purple-950">
                            Result:
                        </th>
                        <th className="p-3 font-semibold text-purple-950">
                            Actions:
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {marksData.length === 0 ? (
                        <tr>
                            <td
                                colSpan={11}
                                className="p-4 text-center text-gray-500"
                            >
                                No records found
                            </td>
                        </tr>
                    ) : (
                        marksData.map((mark, index) => (
                            <tr
                                key={mark._id}
                                className="border-b border-purple-300 last:border-b-0 transition-colors hover:bg-purple-300/40"
                            >
                                <td className="border-r border-purple-300 p-3 font-medium">
                                    {startIndex + index + 1}
                                </td>

                                <td className="border-r border-purple-300 p-3 font-medium">
                                    {mark.studentId?.userId?.name ??
                                        "Student Deleted"}
                                </td>

                                <td className="border-r border-purple-300 p-3">
                                    {mark.subjectId?.name ??
                                        "Subject Deleted"}
                                </td>

                                <td className="border-r border-purple-300 p-3">
                                    {mark.studentId?.userId?.uid?.toUpperCase() ??
                                        "..."}
                                </td>

                                <td className="border-r border-purple-300 p-3">
                                    {mark.studentId?.class ?? "..."}
                                </td>

                                <td className="border-r border-purple-300 p-3 capitalize">
                                    {mark.exam}
                                </td>

                                <td className="border-r border-purple-300 p-3">
                                    {mark.teacherId?.userId?.name ??
                                        "Teacher Deleted"}
                                </td>

                                <td className="border-r border-purple-300 p-3">
                                    {mark.marksObtained}
                                </td>

                                <td className="border-r border-purple-300 p-3">
                                    {mark.totalMarks}
                                </td>

                                <td
                                    className={`border-r border-purple-300 p-3 font-medium ${
                                        (mark.marksObtained /
                                            mark.totalMarks) *
                                            100 >=
                                        33
                                            ? "bg-green-200 text-green-800"
                                            : "bg-red-200 text-red-800"
                                    }`}
                                >
                                    {(mark.marksObtained /
                                        mark.totalMarks) *
                                        100 >=
                                    33
                                        ? "Pass"
                                        : "Fail"}
                                </td>

                                <td className="p-3">
                                    <div className="flex items-center gap-1">
                                        <button
                                            title="Edit"
                                            onClick={() =>
                                                handleEditMarks(mark._id)
                                            }
                                            className="cursor-pointer p-1.5 text-purple-900 transition-colors hover:text-purple-600"
                                        >
                                            <FiEdit className="h-4 w-4" />
                                        </button>

                                        <button
                                            title="Delete"
                                            onClick={() =>
                                                handleDeleteMarks(mark._id)
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

export default PrincipalMarksTable;