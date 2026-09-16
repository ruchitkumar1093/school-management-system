type AttendanceSummary = {
    class: string;
    present: number;
    absent: number;
    percentage: number;
};

type Props = {
    summaryData: AttendanceSummary[];
};

function PrincipalAttendanceTable({ summaryData }: Props) {
    return (
        <div >
            <table className="border-collapse border border-gray-400 bg-purple-200">
                <thead>
                    <tr className="bg-purple-300">
                        <th className="border border-gray-400 p-3 font-medium">
                            Class
                        </th>
                        <th className="border border-gray-400 p-3 font-medium">
                            Present
                        </th>
                        <th className="border border-gray-400 p-3 font-medium">
                            Absent
                        </th>
                        <th className="border border-gray-400 p-3 font-medium">
                            Attendance %
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {summaryData.length === 0 ? (
                        <tr>
                            <td
                                colSpan={4}
                                className="border border-gray-400 p-4 text-center text-gray-600"
                            >
                                No attendance found
                            </td>
                        </tr>
                    ) : (
                        summaryData.map((row) => (
                            <tr key={row.class}>
                                <td className="border border-gray-400 p-3">
                                    {row.class}
                                </td>

                                <td className="border border-gray-400 p-3 text-center">
                                    {row.present}
                                </td>

                                <td className="border border-gray-400 p-3 text-center">
                                    {row.absent}
                                </td>

                                <td className="border border-gray-400 p-3 text-center">
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