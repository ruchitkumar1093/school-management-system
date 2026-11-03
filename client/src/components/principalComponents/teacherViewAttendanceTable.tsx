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
        <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[750px] border-separate border-spacing-y-2 text-left text-gray-900">
                <thead>
                    <tr className="bg-purple-300 text-purple-950">
                        <th className="rounded-l-lg px-3 py-2 text-center font-semibold">
                            S.No.
                        </th>

                        <th className="px-3 py-2 text-center font-semibold">
                            Teacher Name
                        </th>

                        <th className="px-3 py-2 text-center font-semibold">
                            Employee ID
                        </th>

                        <th className="px-3 py-2 text-center font-semibold">
                            Assigned Classes
                        </th>

                        <th className="rounded-r-lg px-3 py-2 text-center font-semibold">
                            Attendance
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {attendance.length === 0 ? (
                        <tr>
                            <td
                                colSpan={5}
                                className="rounded-lg bg-purple-100 p-4 text-center text-gray-500"
                            >
                                No teacher attendance records found
                            </td>
                        </tr>
                    ) : (
                        attendance.map((record, index) => (
                            <tr key={record._id} className="group">
                                <td className="rounded-l-lg bg-purple-200 p-3 text-center font-medium transition-colors group-hover:bg-purple-200/70">
                                    {startIndex + index + 1}
                                </td>

                                <td className="bg-purple-200 p-3 font-medium transition-colors group-hover:bg-purple-200/70">
                                    {record.teacherId.name}
                                </td>

                                <td className="bg-purple-200 p-3 transition-colors group-hover:bg-purple-200/70">
                                    {record.teacherId.employeeID?.toUpperCase() ?? "—"}
                                </td>

                                <td className="bg-purple-200 p-3 transition-colors group-hover:bg-purple-200/70">
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

                                <td className="rounded-r-lg bg-purple-200 p-3 text-center font-medium transition-colors group-hover:bg-purple-200/70">
                                    <span
                                        className={
                                            record.status === "Present"
                                                ? "text-emerald-600"
                                                : record.status === "Absent"
                                                  ? "text-red-600"
                                                  : record.status === "Leave"
                                                    ? "text-amber-600"
                                                    : "text-gray-500"
                                        }
                                    >
                                        {record.status}
                                    </span>
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