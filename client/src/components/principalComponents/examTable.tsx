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

function PrincipalExamTable({ examData, startIndex }: Props) {

    const displayMarks = (marks: SubjectMarks | null) => {
        if (!marks) {
            return "-";
        }

        return `${marks.obtained}/${marks.total}`;
    };

    return (
        <div>

            <table className="border-collapse border border-gray-400 bg-purple-200">

                <thead>
                    <tr className="bg-purple-300">
                        <th className="border border-gray-400 p-3 font-medium">
                            S.No.
                        </th>
                        <th className="border border-gray-400 p-3 font-medium">
                            Student Name:
                        </th>
                        <th className="border border-gray-400 p-3 font-medium">
                            UID:
                        </th>
                        <th className="border border-gray-400 p-3 font-medium">
                            Science:
                        </th>
                        <th className="border border-gray-400 p-3 font-medium">
                            Maths:
                        </th>
                        <th className="border border-gray-400 p-3 font-medium">
                            English:
                        </th>
                        <th className="border border-gray-400 p-3 font-medium">
                            Social Science:
                        </th>
                        <th className="border border-gray-400 p-3 font-medium">
                            Hindi:
                        </th>
                        <th className="border border-gray-400 p-3 font-medium">
                            Total:
                        </th>
                        <th className="border border-gray-400 p-3 font-medium">
                            Percentage:
                        </th>
                        <th className="border border-gray-400 p-3 font-medium">
                            Result:
                        </th>
                    </tr>
                </thead>


                <tbody>

                    {examData.length === 0 ? (
                        <tr>
                            <td
                                colSpan={11}
                                className="border border-gray-400 p-3 text-center text-gray-600"
                            >No records found</td>
                        </tr>

                    ) : (

                        examData.map((student, index) => (

                            <tr key={student.uid}>

                                <td className="border border-gray-400 p-3">
                                    {startIndex + index + 1}
                                </td>

                                <td className="border border-gray-400 p-3">
                                    {student.studentName}
                                </td>

                                <td className="border border-gray-400 p-3">
                                    {student.uid.toUpperCase()}
                                </td>

                                <td className="border border-gray-400 p-3 text-center">
                                    {displayMarks(student.science)}
                                </td>

                                <td className="border border-gray-400 p-3 text-center">
                                    {displayMarks(student.mathematics)}
                                </td>

                                <td className="border border-gray-400 p-3 text-center">
                                    {displayMarks(student.english)}
                                </td>

                                <td className="border border-gray-400 p-3 text-center">
                                    {displayMarks(student.socialScience)}
                                </td>

                                <td className="border border-gray-400 p-3 text-center">
                                    {displayMarks(student.hindi)}
                                </td>

                                <td className="border border-gray-400 p-3 text-center">
                                    {student.total
                                        ? `${student.total.obtained}/${student.total.total}`
                                        : "-"
                                    }
                                </td>

                                <td className="border border-gray-400 p-3 text-center">
                                    {student.percentage !== null
                                        ? `${student.percentage}%`
                                        : "-"
                                    }
                                </td>

                                <td className={`border border-gray-400 p-3 text-center
                                    ${student.result === "Pass"
                                        ? "bg-green-200"
                                        : student.result === "Fail"
                                            ? "bg-red-200"
                                            : student.result === "Incomplete"
                                                ? "bg-orange-200"
                                                : "bg-gray-200"
                                    }`}>
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

export default PrincipalExamTable;