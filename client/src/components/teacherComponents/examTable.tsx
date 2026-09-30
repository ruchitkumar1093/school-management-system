type SubjectMarks = {
    obtained: number;
    total: number;
};

type ExamResult = {
    studentName: string;
    uid: string;
    class: string;

    science: SubjectMarks | null;
    mathematics: SubjectMarks | null;
    english: SubjectMarks | null;
    socialScience: SubjectMarks | null;
    hindi: SubjectMarks | null;

    total: SubjectMarks | null;

    percentage: number | null;

    result: string;
};

type Props = {
    examData: ExamResult[];
    startIndex: number;
};

function TeacherExamTable({ examData, startIndex }: Props) {
    const displayMarks = (marks: SubjectMarks | null) => {
        if (!marks) {
            return "-";
        }

        return `${marks.obtained}/${marks.total}`;
    };

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
                            UID:
                        </th>
                        <th className="border-r border-purple-300 p-3 font-semibold text-purple-950">
                            Science:
                        </th>
                        <th className="border-r border-purple-300 p-3 font-semibold text-purple-950">
                            Maths:
                        </th>
                        <th className="border-r border-purple-300 p-3 font-semibold text-purple-950">
                            English:
                        </th>
                        <th className="border-r border-purple-300 p-3 font-semibold text-purple-950">
                            Social Science:
                        </th>
                        <th className="border-r border-purple-300 p-3 font-semibold text-purple-950">
                            Hindi:
                        </th>
                        <th className="border-r border-purple-300 p-3 font-semibold text-purple-950">
                            Total:
                        </th>
                        <th className="border-r border-purple-300 p-3 font-semibold text-purple-950">
                            Percentage:
                        </th>
                        <th className="p-3 font-semibold text-purple-950">
                            Result:
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {examData.length === 0 ? (
                        <tr>
                            <td
                                colSpan={11}
                                className="p-4 text-center text-gray-500"
                            >
                                No records found
                            </td>
                        </tr>
                    ) : (
                        examData.map((student, index) => (
                            <tr
                                key={student.uid}
                                className="border-b border-purple-300 last:border-b-0 transition-colors hover:bg-purple-300/40"
                            >
                                <td className="border-r border-purple-300 p-3 font-medium">
                                    {startIndex + index + 1}
                                </td>

                                <td className="border-r border-purple-300 p-3 font-medium">
                                    {student.studentName}
                                </td>

                                <td className="border-r border-purple-300 p-3">
                                    {student.uid.toUpperCase()}
                                </td>

                                <td className="border-r border-purple-300 p-3 text-center">
                                    {displayMarks(student.science)}
                                </td>

                                <td className="border-r border-purple-300 p-3 text-center">
                                    {displayMarks(student.mathematics)}
                                </td>

                                <td className="border-r border-purple-300 p-3 text-center">
                                    {displayMarks(student.english)}
                                </td>

                                <td className="border-r border-purple-300 p-3 text-center">
                                    {displayMarks(student.socialScience)}
                                </td>

                                <td className="border-r border-purple-300 p-3 text-center">
                                    {displayMarks(student.hindi)}
                                </td>

                                <td className="border-r border-purple-300 p-3 text-center">
                                    {student.total
                                        ? `${student.total.obtained}/${student.total.total}`
                                        : "-"}
                                </td>

                                <td className="border-r border-purple-300 p-3 text-center">
                                    {student.percentage !== null
                                        ? `${student.percentage}%`
                                        : "-"}
                                </td>

                                <td
                                    className={`p-3 text-center font-medium ${
                                        student.result === "Pass"
                                            ? "bg-green-200 text-green-800"
                                            : student.result === "Fail"
                                            ? "bg-red-200 text-red-800"
                                            : student.result === "Incomplete"
                                            ? "bg-orange-200 text-orange-800"
                                            : "bg-gray-200 text-gray-700"
                                    }`}
                                >
                                    {student.result}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default TeacherExamTable;