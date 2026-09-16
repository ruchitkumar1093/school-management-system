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

function StudentMarksTable({ marksData, startIndex }: Props) {
    return (
        <div >

            <table className="border-collapse border border-gray-400 bg-purple-200">
                <thead>
                    <tr className="bg-purple-300">
                        <th className="border border-gray-400 p-3 font-medium">S.No.</th>
                        <th className="border border-gray-400 p-3 font-medium">Subject Name:</th>
                        <th className="border border-gray-400 p-3 font-medium">Exam Type:</th>
                        <th className="border border-gray-400 p-3 font-medium">Checked by:</th>
                        <th className="border border-gray-400 p-3 font-medium">Marks Obtained:</th>
                        <th className="border border-gray-400 p-3 font-medium">Total Marks:</th>
                        <th className="border border-gray-400 p-3 font-medium">Result:</th>
                    </tr>
                </thead>
                <tbody>
                    {marksData.length === 0 ? (
                        <tr>
                            <td
                                colSpan={5}
                                className="border border-gray-400 p-3 text-center text-gray-600"
                            >
                                No records found
                            </td>
                        </tr>
                    ) : (marksData.map((mark, index) => (
                        <tr key={mark._id}>
                            <td className="border border-gray-400 p-3">{startIndex + index + 1}</td>
                            <td className="border border-gray-400 p-3">{mark.subjectId?.name ?? "Subject deleted"}</td>
                            <td className="border border-gray-400 p-3">{mark.exam}</td>
                            <td className="border border-gray-400 p-3">{mark.teacherId?.userId?.name ?? "Teacher deleted"}</td>
                            <td className="border border-gray-400 p-3">{mark.marksObtained}</td>
                            <td className="border border-gray-400 p-3">{mark.totalMarks}</td>
                            <td className={`border border-gray-400 p-3 ${(mark.marksObtained / mark.totalMarks) * 100 >= 33
                                    ? "bg-green-200" : "bg-red-200" }`}>{(mark.marksObtained / mark.totalMarks) * 100 >= 33
                                    ? "Pass" : "Fail"}</td>
                        </tr>
                    )))}
                </tbody>
            </table>
        </div>
    )
}

export default StudentMarksTable;    