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
    status: "Present" | "Absent" | "Leave" | "Not Marked";
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
        <div className="w-full overflow-x-auto">
            <table className="w-full border-separate border-spacing-y-2 text-left text-gray-900">
                <thead>
                    <tr className="bg-purple-300 text-purple-950">
                        <th className="rounded-l-lg px-3 py-2 font-semibold">
                            S.No.
                        </th>

                        <th className="px-3 py-2 font-semibold">
                            Student Name:
                        </th>

                        <th className="px-3 py-2 font-semibold">
                            UID:
                        </th>

                        <th className="rounded-r-lg px-3 py-2 text-center font-semibold">
                            Attendance:
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {attendance.length === 0 ? (
                        <tr>
                            <td
                                colSpan={4}
                                className="rounded-lg bg-purple-100 p-4 text-center text-gray-500"
                            >
                                No students found
                            </td>
                        </tr>
                    ) : (
                        attendance.map((record, index) => (
                            <tr key={record._id} className="group">
                                <td className="rounded-l-lg bg-purple-200 p-3 font-medium transition-colors group-hover:bg-purple-200/70">
                                    {startIndex + index + 1}
                                </td>

                                <td className="bg-purple-200 p-3 font-medium transition-colors group-hover:bg-purple-200/70">
                                    {record.studentId.userId.name}
                                </td>

                                <td className="bg-purple-200 p-3 transition-colors group-hover:bg-purple-200/70">
                                    {record.studentId.userId.uid.toUpperCase()}
                                </td>

                                <td
                                    className={`rounded-r-lg p-3 text-center font-medium ${
                                        record.status === "Present"
                                            ? "bg-purple-200 text-emerald-600 transition-colors group-hover:bg-purple-200/70"
                                            : record.status === "Absent"
                                              ? "bg-purple-200 text-red-600 transition-colors group-hover:bg-purple-200/70"
                                              : record.status === "Leave"
                                                ? "bg-purple-200 text-amber-600 transition-colors group-hover:bg-purple-200/70"
                                                : "bg-purple-200 text-gray-500 transition-colors group-hover:bg-purple-200/70"
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