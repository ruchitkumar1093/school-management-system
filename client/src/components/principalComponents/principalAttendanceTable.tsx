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
        <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-y-2 text-left text-gray-900">
                <thead>
                    <tr className="bg-purple-300">
                        <th className="rounded-l-lg px-3 py-2 font-semibold text-purple-950">
                            Class
                        </th>

                        <th className="px-3 py-2 font-semibold text-purple-950">
                            Marked by
                        </th>

                        <th className="px-3 py-2 text-center font-semibold text-purple-950">
                            Present
                        </th>

                        <th className="px-3 py-2 text-center font-semibold text-purple-950">
                            Absent
                        </th>

                        <th className="rounded-r-lg px-3 py-2 text-center font-semibold text-purple-950">
                            Attendance %
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {summaryData.length === 0 ? (
                        <tr>
                            <td
                                colSpan={5}
                                className="rounded-lg bg-purple-100 p-4 text-center text-gray-500"
                            >
                                No attendance found
                            </td>
                        </tr>
                    ) : (
                        summaryData.map((row) => (
                            <tr
                                key={row.class}
                                className="group"
                            >
                                <td className="rounded-l-lg bg-purple-200 p-3 font-medium transition-colors group-hover:bg-purple-200/70">
                                    {row.class}
                                </td>

                                <td className="bg-purple-200 p-3 transition-colors group-hover:bg-purple-200/70">
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

                                <td className="bg-purple-200 p-3 text-center transition-colors group-hover:bg-purple-200/70">
                                    {row.present}
                                </td>

                                <td className="bg-purple-200 p-3 text-center transition-colors group-hover:bg-purple-200/70">
                                    {row.absent}
                                </td>

                                <td className="rounded-r-lg bg-purple-200 p-3 text-center transition-colors group-hover:bg-purple-200/70">
                                    {row.present === 0 && row.absent === 0 ? (
                                        <span className="font-medium text-gray-500">
                                            Not Marked
                                        </span>
                                    ) : (
                                        `${row.percentage.toFixed(2)}%`
                                    )}
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