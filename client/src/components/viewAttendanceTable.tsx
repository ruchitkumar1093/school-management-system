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
    status: "Present" | "Absent";
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
        <div>
            <table className="border-collapse border border-gray-400 bg-purple-200">

                <thead>
                    <tr className="bg-purple-300">

                        <th className="border border-gray-400 p-3 font-medium">
                            S.No.
                        </th>

                        <th className="border border-gray-400 p-3 font-medium">
                            Student Name:
                        </th>

                        <th className="border border-gray-400 p-3 font-medium">
                            UID:
                        </th>

                        <th className="border border-gray-400 p-3 font-medium">
                            Attendance:
                        </th>

                    </tr>
                </thead>

                <tbody>

                    {attendance.length === 0 ? (

                        <tr>
                            <td
                                colSpan={4}
                                className="border border-gray-400 p-3 text-center text-gray-600"
                            >
                                No attendance records found
                            </td>
                        </tr>

                    ) : (

                        attendance.map((record, index) => (

                            <tr key={record._id}>

                                <td className="border border-gray-400 p-3">
                                    {startIndex + index + 1}
                                </td>

                                <td className="border border-gray-400 p-3">
                                    {record.studentId.userId.name}
                                </td>

                                <td className="border border-gray-400 p-3">
                                    {record.studentId.userId.uid.toUpperCase()}
                                </td>

                                <td
                                    className={`border border-gray-400 p-3 text-center ${
                                        record.status === "Present"
                                            ? ""
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