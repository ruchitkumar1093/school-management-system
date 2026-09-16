type Student = {
    _id: string;
    userId: {
        name: string;
        uid: string;
    };
    class: string;
    rollNumber: string;
};

type Attendance = {
    [studentId: string]: "Present" | "Absent";
};

type Props = {
    students: Student[];
    attendance: Attendance;
    setAttendance: React.Dispatch<React.SetStateAction<Attendance>>;
    startIndex: number;
};

function TeacherAttendanceTable({ students, startIndex, attendance, setAttendance }: Props) {

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
                    {students.length === 0 ? (
                        <tr>
                            <td
                                colSpan={4}
                                className="border border-gray-400 p-3 text-center text-gray-600"
                            >
                                No records found
                            </td>
                        </tr>
                    ) : (
                        students.map((student, index) => {
                            const status = attendance[student._id];
                            return (
                                <tr key={student._id}>
                                    <td className="border border-gray-400 p-3">
                                        {startIndex + index + 1}
                                    </td>
                                    <td className="border border-gray-400 p-3">
                                        {student.userId.name}
                                    </td>
                                    <td className="border border-gray-400 p-3">
                                        {student.userId.uid.toUpperCase()}
                                    </td>
                                    <td className="border border-gray-400 p-2">
                                        <div className="flex gap-5 justify-center">
                                            <label
                                                className={`flex items-center gap-2 p-2 rounded-md cursor-pointer ${status === "Present"
                                                    ? "bg-purple-100 text-green-700"
                                                    : ""
                                                    }`}
                                            >

                                                <input
                                                    className="accent-green-700"
                                                    type="radio"
                                                    name={`attendance-${student._id}`}
                                                    value="Present"
                                                    checked={status === "Present"}
                                                    onChange={() =>
                                                        setAttendance(prev => ({
                                                            ...prev,
                                                            [student._id]: "Present"
                                                        }))
                                                    }
                                                />

                                                Present

                                            </label>

                                            <label
                                                className={`flex items-center gap-2 p-2 rounded-md cursor-pointer ${status === "Absent"
                                                        ? "bg-purple-100 text-red-700"
                                                        : ""
                                                    }`}
                                            >

                                                <input
                                                    className="accent-red-700"
                                                    type="radio"
                                                    name={`attendance-${student._id}`}
                                                    value="Absent"
                                                    checked={status === "Absent"}
                                                    onChange={() =>
                                                        setAttendance(prev => ({
                                                            ...prev,
                                                            [student._id]: "Absent"
                                                        }))
                                                    }
                                                />

                                                Absent

                                            </label>
                                        </div>
                                    </td>
                                </tr>);
                        })
                    )}

                </tbody>
            </table>
        </div>
    );
}

export default TeacherAttendanceTable;