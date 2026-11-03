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
        <div className="w-full overflow-x-auto">
            <table className="w-full border-separate border-spacing-y-2 text-left text-gray-900">
                <thead>
                    <tr className="bg-purple-300 text-purple-950">
                        <th className="rounded-l-lg px-3 py-2 font-semibold">
                            S.No.
                        </th>

                        <th className="px-3 py-2 font-semibold">
                            Subject Name:
                        </th>

                        <th className="px-3 py-2 font-semibold">
                            Exam Type:
                        </th>

                        <th className="px-3 py-2 font-semibold">
                            Checked by:
                        </th>

                        <th className="px-3 py-2 font-semibold">
                            Marks Obtained:
                        </th>

                        <th className="px-3 py-2 font-semibold">
                            Total Marks:
                        </th>

                        <th className="rounded-r-lg px-3 py-2 text-center font-semibold">
                            Result:
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {marksData.length === 0 ? (
                        <tr>
                            <td
                                colSpan={7}
                                className="rounded-lg bg-purple-100 p-4 text-center text-gray-500"
                            >
                                No records found
                            </td>
                        </tr>
                    ) : (
                        marksData.map((mark, index) => {
                            const isPass =
                                (mark.marksObtained / mark.totalMarks) *
                                    100 >=
                                33;

                            return (
                                <tr key={mark._id} className="group">
                                    <td className="rounded-l-lg bg-purple-200 p-3 font-medium transition-colors group-hover:bg-purple-200/70">
                                        {startIndex + index + 1}
                                    </td>

                                    <td className="bg-purple-200 p-3 font-medium transition-colors group-hover:bg-purple-200/70">
                                        {mark.subjectId?.name ??
                                            "Subject deleted"}
                                    </td>

                                    <td className="bg-purple-200 p-3 capitalize transition-colors group-hover:bg-purple-200/70">
                                        {mark.exam}
                                    </td>

                                    <td className="bg-purple-200 p-3 transition-colors group-hover:bg-purple-200/70">
                                        {mark.teacherId?.userId?.name ??
                                            "Teacher deleted"}
                                    </td>

                                    <td className="bg-purple-200 p-3 transition-colors group-hover:bg-purple-200/70">
                                        {mark.marksObtained}
                                    </td>

                                    <td className="bg-purple-200 p-3 transition-colors group-hover:bg-purple-200/70">
                                        {mark.totalMarks}
                                    </td>

                                    <td
                                        className={`rounded-r-lg p-3 text-center font-medium ${
                                            isPass
                                                ? "bg-green-200 text-green-800"
                                                : "bg-red-200 text-red-800"
                                        }`}
                                    >
                                        {isPass ? "Pass" : "Fail"}
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default StudentMarksTable;