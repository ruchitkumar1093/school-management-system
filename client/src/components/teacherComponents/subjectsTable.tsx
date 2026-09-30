type Subject = {
    _id: string;
    name: string;
    subjectCode: string;
    class: string;
};

type Props = {
    subject: Subject[];
    startIndex: number;
};

function TeacherSubjectsTable({
    subject,
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
                            Subject Code:
                        </th>
                        <th className="p-3 font-semibold text-purple-950">
                            Class:
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {subject.length === 0 ? (
                        <tr>
                            <td
                                colSpan={4}
                                className="p-4 text-center text-gray-500"
                            >
                                No records found
                            </td>
                        </tr>
                    ) : (
                        subject.map((sub, index) => (
                            <tr
                                key={sub._id}
                                className="border-b border-purple-300 last:border-b-0 transition-colors hover:bg-purple-300/40"
                            >
                                <td className="border-r border-purple-300 p-3 font-medium">
                                    {startIndex + index + 1}
                                </td>
                                <td className="border-r border-purple-300 p-3 font-medium">
                                    {sub.name}
                                </td>
                                <td className="border-r border-purple-300 p-3">
                                    {sub.subjectCode.toUpperCase()}
                                </td>
                                <td className="p-3">
                                    {sub.class}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default TeacherSubjectsTable;