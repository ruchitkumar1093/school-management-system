type AttendanceSummary = {
    class: string;
    present: number;
    absent: number;
    percentage: number;
    teacher: {
        name: string;
        uid: string;
    } | null;
};

type Props = {
    summaryData: AttendanceSummary[];
};

function PrincipalAttendanceTable({ summaryData }: Props) {
    return (
        <div className="overflow-x-auto rounded-lg shadow-md">
            <table className="w-full border-collapse bg-purple-200 text-left text-gray-900">
                <thead>
                    <tr className="border-b border-purple-300 bg-purple-300/80">
                        <th className="border-r border-purple-300 p-3 font-semibold text-purple-950">
                            Class
                        </th>

                        <th className="border-r border-purple-300 p-3 font-semibold text-purple-950">
                            Marked by
                        </th>

                        <th className="border-r border-purple-300 p-3 font-semibold text-purple-950">
                            Present
                        </th>

                        <th className="border-r border-purple-300 p-3 font-semibold text-purple-950">
                            Absent
                        </th>

                        <th className="p-3 font-semibold text-purple-950">
                            Attendance %
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {summaryData.length === 0 ? (
                        <tr>
                            <td
                                colSpan={5}
                                className="p-4 text-center text-gray-500"
                            >
                                No attendance found
                            </td>
                        </tr>
                    ) : (
                        summaryData.map((row) => (
                            <tr
                                key={row.class}
                                className="border-b border-purple-300 last:border-b-0 transition-colors hover:bg-purple-300/40"
                            >
                                <td className="border-r border-purple-300 p-3 font-medium">
                                    {row.class}
                                </td>

                                <td className="border-r border-purple-300 p-3">
                                    {row.teacher ? (
                                        <div>
                                            <p className="font-medium">
                                                {row.teacher.name}
                                            </p>
                                        </div>
                                    ) : (
                                        "-"
                                    )}
                                </td>

                                <td className="border-r border-purple-300 p-3 text-center">
                                    {row.present}
                                </td>

                                <td className="border-r border-purple-300 p-3 text-center">
                                    {row.absent}
                                </td>

                                <td className="p-3 text-center">
                                    {row.percentage.toFixed(2)}%
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default PrincipalAttendanceTable;