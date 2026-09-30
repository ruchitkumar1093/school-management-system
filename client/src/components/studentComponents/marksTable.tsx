type MarksData = {
    _id: string;

    subjectId: {
        name: string;
    } | null;

    exam: string;
    marksObtained: number;
    totalMarks: number;

    teacherId: {
        userId: {
            name: string;
        };
    } | null;
};

type Props = {
    marksData: MarksData[];
    startIndex: number;
};

function StudentMarksTable({
    marksData,
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
                            Exam Type:
                        </th>
                        <th className="border-r border-purple-300 p-3 font-semibold text-purple-950">
                            Checked by:
                        </th>
                        <th className="border-r border-purple-300 p-3 font-semibold text-purple-950">
                            Marks Obtained:
                        </th>
                        <th className="border-r border-purple-300 p-3 font-semibold text-purple-950">
                            Total Marks:
                        </th>
                        <th className="p-3 font-semibold text-purple-950">
                            Result:
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {marksData.length === 0 ? (
                        <tr>
                            <td
                                colSpan={7}
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
                                    {mark.subjectId?.name ??
                                        "Subject deleted"}
                                </td>

                                <td className="border-r border-purple-300 p-3 capitalize">
                                    {mark.exam}
                                </td>

                                <td className="border-r border-purple-300 p-3">
                                    {mark.teacherId?.userId?.name ??
                                        "Teacher deleted"}
                                </td>

                                <td className="border-r border-purple-300 p-3">
                                    {mark.marksObtained}
                                </td>

                                <td className="border-r border-purple-300 p-3">
                                    {mark.totalMarks}
                                </td>

                                <td
                                    className={`p-3 text-center font-medium ${
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
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default StudentMarksTable;