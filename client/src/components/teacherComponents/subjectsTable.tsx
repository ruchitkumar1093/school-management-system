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
        <div className="overflow-x-auto">
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
                            Subject Code:
                        </th>
                        <th className="rounded-r-lg px-3 py-2 font-semibold">
                            Class:
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {subject.length === 0 ? (
                        <tr>
                            <td
                                colSpan={4}
                                className="rounded-lg bg-purple-100 p-4 text-center text-gray-500"
                            >
                                No records found
                            </td>
                        </tr>
                    ) : (
                        subject.map((sub, index) => (
                            <tr key={sub._id} className="group">
                                <td className="rounded-l-lg bg-purple-200 p-3 font-medium transition-colors group-hover:bg-purple-200/70">
                                    {startIndex + index + 1}
                                </td>
                                <td className="bg-purple-200 p-3 font-medium transition-colors group-hover:bg-purple-200/70">
                                    {sub.name}
                                </td>
                                <td className="bg-purple-200 p-3 transition-colors group-hover:bg-purple-200/70">
                                    {sub.subjectCode.toUpperCase()}
                                </td>
                                <td className="rounded-r-lg bg-purple-200 p-3 transition-colors group-hover:bg-purple-200/70">
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