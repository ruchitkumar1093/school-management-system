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
        <div className="w-full overflow-x-auto">
            <table className="w-full border-separate border-spacing-y-2 text-left text-gray-900">
                <thead>
                    <tr className="bg-purple-300 text-purple-950">
                        <th className="rounded-l-lg px-3 py-2 font-semibold">
                            S.No.
                        </th>

                        <th className="px-3 py-2 font-semibold">
                            Student Name
                        </th>

                        <th className="px-3 py-2 font-semibold">
                            UID
                        </th>

                        {subjects.map((subject) => (
                            <th
                                key={subject.subjectCode || subject.name}
                                className="px-3 py-2 text-center font-semibold"
                                title={subject.name}
                            >
                                {subject.name}
                            </th>
                        ))}

                        <th className="px-3 py-2 font-semibold">
                            Total
                        </th>

                        <th className="px-3 py-2 font-semibold">
                            Percentage
                        </th>

                        <th className="rounded-r-lg px-3 py-2 font-semibold">
                            Result
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {examData.length === 0 ? (
                        <tr>
                            <td
                                colSpan={columnCount}
                                className="rounded-lg bg-purple-100 p-4 text-center text-gray-500"
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
                                className="group"
                            >
                                <td className="rounded-l-lg bg-purple-200 p-3 font-medium transition-colors group-hover:bg-purple-200/70">
                                    {startIndex + index + 1}
                                </td>

                                <td className="bg-purple-200 p-3 font-medium transition-colors group-hover:bg-purple-200/70">
                                    {student.studentName}
                                </td>

                                <td className="bg-purple-200 p-3 transition-colors group-hover:bg-purple-200/70">
                                    {student.uid.toUpperCase()}
                                </td>

                                {subjects.map((subject) => (
                                    <td
                                        key={
                                            subject.subjectCode ||
                                            subject.name
                                        }
                                        className="bg-purple-200 p-3 text-center transition-colors group-hover:bg-purple-200/70"
                                    >
                                        {displayMarks(
                                            student.subjects?.[subject.name]
                                        )}
                                    </td>
                                ))}

                                <td className="bg-purple-200 p-3 text-center font-medium transition-colors group-hover:bg-purple-200/70">
                                    {displayMarks(student.total)}
                                </td>

                                <td className="bg-purple-200 p-3 text-center transition-colors group-hover:bg-purple-200/70">
                                    {student.percentage !== null
                                        ? `${student.percentage}%`
                                        : "-"}
                                </td>

                                <td
                                    className={`rounded-r-lg p-3 text-center font-medium ${
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