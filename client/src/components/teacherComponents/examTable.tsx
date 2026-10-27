type SubjectMarks = {
obtained: number;
total: number;
};

type ExamResult = {
studentName: string;
uid: string;
class: string;
subjects: Record<string, SubjectMarks | null>;
total: SubjectMarks | null;
percentage: number | null;
result: string;
};

type TeacherSubject = {
name: string;
subjectCode: string;
};

type Props = {
examData: ExamResult[];
startIndex: number;
subjects: TeacherSubject[];
};

function TeacherExamTable({
examData,
startIndex,
subjects,
}: Props) {
const displayMarks = (
marks: SubjectMarks | null | undefined
) => {
if (!marks) {
return "-";
}

    return `${marks.obtained}/${marks.total}`;
};

const columnCount = 6 + subjects.length;

return (
    <div className="block w-full min-w-0 max-w-full overflow-x-auto rounded-lg shadow-md">
        <table className="w-max min-w-full whitespace-nowrap border-collapse bg-purple-200 text-left text-gray-900">
            <thead>
                <tr className="border-b border-purple-300 bg-purple-300/80">
                    <th className="whitespace-nowrap border-r border-purple-300 p-3 font-semibold text-purple-950">
                        S.No.
                    </th>

                    <th className="whitespace-nowrap border-r border-purple-300 p-3 font-semibold text-purple-950">
                        Student Name
                    </th>

                    <th className="whitespace-nowrap border-r border-purple-300 p-3 font-semibold text-purple-950">
                        UID
                    </th>

                    {subjects.map((subject) => (
                        <th
                            key={subject.subjectCode || subject.name}
                            className="whitespace-nowrap border-r border-purple-300 p-3 text-center font-semibold text-purple-950"
                            title={subject.name}
                        >
                            {subject.name}
                        </th>
                    ))}

                    <th className="whitespace-nowrap border-r border-purple-300 p-3 font-semibold text-purple-950">
                        Total
                    </th>

                    <th className="whitespace-nowrap border-r border-purple-300 p-3 font-semibold text-purple-950">
                        Percentage
                    </th>

                    <th className="whitespace-nowrap p-3 font-semibold text-purple-950">
                        Result
                    </th>
                </tr>
            </thead>

            <tbody>
                {examData.length === 0 ? (
                    <tr>
                        <td
                            colSpan={columnCount}
                            className="p-4 text-center text-gray-500"
                        >
                            No records found
                        </td>
                    </tr>
                ) : (
                    examData.map((student, index) => (
                        <tr
                            key={
                                student.uid ||
                                `${student.class}-${index}`
                            }
                            className="border-b border-purple-300 transition-colors last:border-b-0 hover:bg-purple-300/40"
                        >
                            <td className="whitespace-nowrap border-r border-purple-300 p-3 font-medium">
                                {startIndex + index + 1}
                            </td>

                            <td className="whitespace-nowrap border-r border-purple-300 p-3 font-medium">
                                {student.studentName}
                            </td>

                            <td className="whitespace-nowrap border-r border-purple-300 p-3">
                                {student.uid.toUpperCase()}
                            </td>

                            {subjects.map((subject) => (
                                <td
                                    key={
                                        subject.subjectCode ||
                                        subject.name
                                    }
                                    className="whitespace-nowrap border-r border-purple-300 p-3 text-center"
                                >
                                    {displayMarks(
                                        student.subjects?.[subject.name]
                                    )}
                                </td>
                            ))}

                            <td className="whitespace-nowrap border-r border-purple-300 p-3 text-center font-medium">
                                {displayMarks(student.total)}
                            </td>

                            <td className="whitespace-nowrap border-r border-purple-300 p-3 text-center">
                                {student.percentage !== null
                                    ? `${student.percentage}%`
                                    : "-"}
                            </td>

                            <td
                                className={`whitespace-nowrap p-3 text-center font-medium ${
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