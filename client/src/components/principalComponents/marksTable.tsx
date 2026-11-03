import { FiEdit, FiTrash, FiCalendar } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

type Mark = {
    _id: string;

    studentId: {
        _id: string;
        class: string;
        userId: {
            name: string;
            uid: string;
        } | null;
    } | null;

    teacherId: {
        userId: {
            name: string;
        } | null;
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
    const navigate = useNavigate();

    const handleViewAttendance = (studentId: string) => {
        navigate(
            `/principal/attendance/viewAttendance/attendanceCalendar/${studentId}`
        );
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-y-2 text-left text-gray-900">
                <thead>
                    <tr className="bg-purple-300">
                        <th className="rounded-l-lg px-3 py-2 font-semibold text-purple-950">
                            S.No.
                        </th>
                        <th className="px-3 py-2 font-semibold text-purple-950">
                            Student Name:
                        </th>
                        <th className="px-3 py-2 font-semibold text-purple-950">
                            Subject Name:
                        </th>
                        <th className="px-3 py-2 font-semibold text-purple-950">
                            UID:
                        </th>
                        <th className="px-3 py-2 font-semibold text-purple-950">
                            Class:
                        </th>
                        <th className="px-3 py-2 font-semibold text-purple-950">
                            Exam Type:
                        </th>
                        <th className="px-3 py-2 font-semibold text-purple-950">
                            Checked By:
                        </th>
                        <th className="px-3 py-2 font-semibold text-purple-950">
                            Marks Obtained:
                        </th>
                        <th className="px-3 py-2 font-semibold text-purple-950">
                            Max Marks:
                        </th>
                        <th className="px-3 py-2 font-semibold text-purple-950">
                            Result:
                        </th>
                        <th className="rounded-r-lg px-3 py-2 text-center font-semibold text-purple-950">
                            Manage:
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {marksData.length === 0 ? (
                        <tr>
                            <td
                                colSpan={11}
                                className="rounded-lg bg-purple-100 p-4 text-center text-gray-500"
                            >
                                No records found
                            </td>
                        </tr>
                    ) : (
                        marksData.map((mark, index) => (
                            <tr
                                key={mark._id}
                                className="group"
                            >
                                <td className="rounded-l-lg bg-purple-200 p-3 font-medium transition-colors group-hover:bg-purple-200/70">
                                    {startIndex + index + 1}
                                </td>

                                <td className="bg-purple-200 p-3 font-medium transition-colors group-hover:bg-purple-200/70">
                                    {mark.studentId?.userId?.name ??
                                        "Student Deleted"}
                                </td>

                                <td className="bg-purple-200 p-3 transition-colors group-hover:bg-purple-200/70">
                                    {mark.subjectId?.name ??
                                        "Subject Deleted"}
                                </td>

                                <td className="bg-purple-200 p-3 transition-colors group-hover:bg-purple-200/70">
                                    {mark.studentId?.userId?.uid?.toUpperCase() ??
                                        "..."}
                                </td>

                                <td className="bg-purple-200 p-3 transition-colors group-hover:bg-purple-200/70">
                                    {mark.studentId?.class ?? "..."}
                                </td>

                                <td className="bg-purple-200 p-3 capitalize transition-colors group-hover:bg-purple-200/70">
                                    {mark.exam}
                                </td>

                                <td className="bg-purple-200 p-3 transition-colors group-hover:bg-purple-200/70">
                                    {mark.teacherId?.userId?.name ??
                                        "Teacher Deleted"}
                                </td>

                                <td className="bg-purple-200 p-3 transition-colors group-hover:bg-purple-200/70">
                                    {mark.marksObtained}
                                </td>

                                <td className="bg-purple-200 p-3 transition-colors group-hover:bg-purple-200/70">
                                    {mark.totalMarks}
                                </td>

                                <td
                                    className={`p-3 font-medium transition-colors ${
                                        (mark.marksObtained / mark.totalMarks) *
                                            100 >=
                                        33
                                            ? "bg-green-200 text-green-800 group-hover:bg-green-200/70"
                                            : "bg-red-200 text-red-800 group-hover:bg-red-200/70"
                                    }`}
                                >
                                    {(mark.marksObtained / mark.totalMarks) *
                                        100 >=
                                    33
                                        ? "Pass"
                                        : "Fail"}
                                </td>

                                <td className="rounded-r-lg bg-purple-200 p-3 transition-colors group-hover:bg-purple-200/70">
                                    <div className="flex items-center gap-1">
                                        {mark.studentId?._id ? (
                                            <button
                                                type="button"
                                                title="View student attendance calendar"
                                                aria-label={`View attendance calendar for ${
                                                    mark.studentId.userId?.name ??
                                                    "student"
                                                }`}
                                                onClick={() =>
                                                    handleViewAttendance(
                                                        mark.studentId!._id
                                                    )
                                                }
                                                className="cursor-pointer rounded p-1.5 text-purple-900 transition-colors hover:bg-purple-200 hover:text-purple-700"
                                            >
                                                <FiCalendar className="h-4 w-4" />
                                            </button>
                                        ) : (
                                            <span
                                                className="text-gray-400"
                                                title="Student record unavailable"
                                            >
                                                —
                                            </span>
                                        )}

                                        <button
                                            type="button"
                                            title="Edit"
                                            onClick={() =>
                                                handleEditMarks(mark._id)
                                            }
                                            className="cursor-pointer rounded p-1.5 text-purple-900 transition-colors hover:bg-purple-200 hover:text-purple-700"
                                        >
                                            <FiEdit className="h-4 w-4" />
                                        </button>

                                        <button
                                            type="button"
                                            title="Delete"
                                            onClick={() =>
                                                handleDeleteMarks(mark._id)
                                            }
                                            className="cursor-pointer rounded p-1.5 text-purple-900 transition-colors hover:bg-red-100 hover:text-red-700"
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