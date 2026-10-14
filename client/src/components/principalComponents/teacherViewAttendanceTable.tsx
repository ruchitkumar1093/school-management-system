type TeacherAttendance = {
    _id: string;
    teacherId: {
        _id: string;
        name: string;
        employeeID: string;
        department: string;
    };
    date: string;
    status: "Present" | "Absent" | "Leave" | "Not Marked";
};

type Props = {
    attendance: TeacherAttendance[];
    startIndex: number;
};

function PrincipalViewTeacherAttendanceTable({
    attendance,
    startIndex
}: Props) {
    return (
        <div className="overflow-x-auto rounded-lg shadow-md">
            <table className="w-full border-collapse bg-purple-200 text-left text-gray-900">
                <thead>
                    <tr className="border-b border-purple-300 bg-purple-300/80">
                        <th className="border-r border-purple-300 p-3 text-center font-semibold text-purple-950">
                            S.No.
                        </th>

                        <th className="border-r border-purple-300 p-3 text-center font-semibold text-purple-950">
                            Teacher Name:
                        </th>

                        <th className="border-r border-purple-300 p-3 text-center font-semibold text-purple-950">
                            Employee ID:
                        </th>

                        <th className="border-r border-purple-300 p-3 text-center font-semibold text-purple-950">
                            Department:
                        </th>

                        <th className="p-3 text-center font-semibold text-purple-950">
                            Attendance:
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {attendance.length === 0 ? (
                        <tr>
                            <td
                                colSpan={5}
                                className="p-4 text-center text-gray-500"
                            >
                                No teacher attendance records found
                            </td>
                        </tr>
                    ) : (
                        attendance.map((record, index) => (
                            <tr
                                key={record._id}
                                className="border-b border-purple-300 last:border-b-0 transition-colors hover:bg-purple-300/40"
                            >
                                <td className="border-r border-purple-300 p-3 text-center font-medium">
                                    {startIndex + index + 1}
                                </td>

                                <td className="border-r border-purple-300 p-3 font-medium">
                                    {record.teacherId.name}
                                </td>

                                <td className="border-r border-purple-300 p-3">
                                    {record.teacherId.employeeID.toUpperCase()}
                                </td>

                                <td className="border-r border-purple-300 p-3">
                                    {record.teacherId.department}
                                </td>

                                <td
                                    className={`p-3 text-center font-medium ${
                                        record.status === "Present"
                                            ? "text-emerald-600"
                                            : record.status === "Absent"
                                            ? "text-red-600"
                                            : record.status === "Leave"
                                            ? "text-amber-600"
                                            : "text-gray-500"
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

export default PrincipalViewTeacherAttendanceTable;