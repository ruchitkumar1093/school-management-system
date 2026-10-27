type TeacherAttendance = {
    _id: string;
    teacherId: {
        _id: string;
        name: string;
        employeeID: string;
        classes?: string[];
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
        <div className="w-full overflow-x-auto rounded-lg shadow-md">
            <table className="w-full min-w-[750px] border-collapse bg-purple-200 text-left text-gray-900">
                <thead>
                    <tr className="border-b border-purple-300 bg-purple-300/80">
                        <th className="border-r border-purple-300 p-3 text-center font-semibold text-purple-950">
                            S.No.
                        </th>

                        <th className="border-r border-purple-300 p-3 text-center font-semibold text-purple-950">
                            Teacher Name
                        </th>

                        <th className="border-r border-purple-300 p-3 text-center font-semibold text-purple-950">
                            Employee ID
                        </th>

                        <th className="border-r border-purple-300 p-3 text-center font-semibold text-purple-950">
                            Assigned Classes
                        </th>

                        <th className="p-3 text-center font-semibold text-purple-950">
                            Attendance
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
                                    {record.teacherId.employeeID?.toUpperCase() ?? "—"}
                                </td>

                                <td className="border-r border-purple-300 p-3">
                                    <div className="flex min-w-[120px] flex-wrap justify-center gap-1.5">
                                        {record.teacherId.classes?.length ? (
                                            record.teacherId.classes.map(
                                                className => (
                                                    <span
                                                        key={className}
                                                        className="rounded-md border border-purple-400 bg-purple-100 px-2.5 py-1 text-sm font-medium text-purple-900"
                                                    >
                                                        {className}
                                                    </span>
                                                )
                                            )
                                        ) : (
                                            <span className="text-sm text-gray-500">
                                                No classes assigned
                                            </span>
                                        )}
                                    </div>
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