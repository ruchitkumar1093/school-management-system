type Attendance = {
    _id: string;
    studentId: {
        _id: string;
        userId: {
            name: string;
            uid: string;
        };
    };
    date: string;
    status: "Present" | "Absent" | "Leave";
};

type Props = {
    attendance: Attendance[];
    startIndex: number;
};

function TeacherViewAttendanceTable({
    attendance,
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
                            Student Name:
                        </th>
                        <th className="border-r border-purple-300 p-3 font-semibold text-purple-950">
                            UID:
                        </th>
                        <th className="p-3 font-semibold text-purple-950">
                            Attendance:
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {attendance.length === 0 ? (
                        <tr>
                            <td
                                colSpan={4}
                                className="p-4 text-center text-gray-500"
                            >
                                No attendance records found
                            </td>
                        </tr>
                    ) : (
                        attendance.map((record, index) => (
                            <tr
                                key={record._id}
                                className="border-b border-purple-300 last:border-b-0 transition-colors hover:bg-purple-300/40"
                            >
                                <td className="border-r border-purple-300 p-3 font-medium">
                                    {startIndex + index + 1}
                                </td>

                                <td className="border-r border-purple-300 p-3 font-medium">
                                    {record.studentId.userId.name}
                                </td>

                                <td className="border-r border-purple-300 p-3">
                                    {record.studentId.userId.uid.toUpperCase()}
                                </td>

                                <td
                                    className={`p-3 text-center font-medium ${
                                        record.status === "Present"
                                            ? "text-emerald-600"
                                            : record.status === "Leave"
                                            ? "text-amber-600"
                                            : "text-red-600"
                                    }`}
                                >
                                    {record.status}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default TeacherViewAttendanceTable;