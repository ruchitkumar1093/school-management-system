import { useNavigate } from "react-router-dom";
import { FiCalendar } from "react-icons/fi";

type Teacher = {
    _id: string;
    name: string;
    employeeID: string;
    department: string;
    onLeave: boolean;
    attendanceStatus: "Present" | "Absent" | null;
};

type Attendance = {
    [teacherId: string]: "Present" | "Absent";
};

type Props = {
    teachers: Teacher[];
    attendance: Attendance;
    setAttendance: React.Dispatch<
        React.SetStateAction<Attendance>
    >;
    markAllStatus: "Present" | "Absent" | null;
    startIndex: number;
};

function PrincipalTeacherAttendanceTable({
    teachers,
    attendance,
    setAttendance,
    markAllStatus,
    startIndex
}: Props) {
    const navigate = useNavigate();

    return (
        <div className="overflow-x-auto rounded-lg shadow-md">
            <table className="w-full border-collapse bg-purple-200 text-left text-gray-900">
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
                            Department
                        </th>

                        <th className="border-r border-purple-300 p-3 text-center font-semibold text-purple-950">
                            Attendance
                        </th>

                        <th className="p-3 text-center font-semibold text-purple-950">
                            Calendar
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {teachers.length === 0 ? (
                        <tr>
                            <td
                                colSpan={6}
                                className="p-4 text-center text-gray-500"
                            >
                                No teacher records found
                            </td>
                        </tr>
                    ) : (
                        teachers.map((teacher, index) => {
                            const status = teacher.onLeave
                                ? null
                                : teacher.attendanceStatus ??
                                attendance[teacher._id] ??
                                markAllStatus;

                            return (
                                <tr
                                    key={teacher._id}
                                    className="border-b border-purple-300 last:border-b-0 transition-colors hover:bg-purple-300/40"
                                >
                                    <td className="border-r border-purple-300 p-3 text-center font-medium">
                                        {startIndex + index + 1}
                                    </td>

                                    <td className="border-r border-purple-300 p-3 font-medium">
                                        {teacher.name}
                                    </td>

                                    <td className="border-r border-purple-300 p-3">
                                        {teacher.employeeID.toUpperCase()}
                                    </td>

                                    <td className="border-r border-purple-300 p-3">
                                        {teacher.department}
                                    </td>

                                    <td className="border-r border-purple-300 p-2">
                                        {teacher.onLeave ? (
                                            <div className="flex justify-center">
                                                <span className="rounded-md px-5 py-2 font-medium text-yellow-600">
                                                    Leave
                                                </span>
                                            </div>
                                        ) : teacher.attendanceStatus !== null ? (
                                            <div className="flex justify-center">
                                                <span
                                                    className={`rounded-md px-5 py-2 font-medium ${teacher.attendanceStatus ===
                                                            "Present"
                                                            ? "text-green-600"
                                                            : "text-red-600"
                                                        }`}
                                                >
                                                    {teacher.attendanceStatus}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="flex justify-center gap-3">
                                                <label
                                                    className={`flex cursor-pointer items-center gap-2 rounded-md p-2 ${status === "Present"
                                                            ? "bg-purple-100 text-green-700"
                                                            : ""
                                                        }`}
                                                >
                                                    <input
                                                        className="accent-green-700"
                                                        type="radio"
                                                        name={`attendance-${teacher._id}`}
                                                        value="Present"
                                                        checked={
                                                            status === "Present"
                                                        }
                                                        onChange={() =>
                                                            setAttendance(
                                                                (previous) => ({
                                                                    ...previous,
                                                                    [teacher._id]:
                                                                        "Present"
                                                                })
                                                            )
                                                        }
                                                    />
                                                    Present
                                                </label>

                                                <label
                                                    className={`flex cursor-pointer items-center gap-2 rounded-md p-2 ${status === "Absent"
                                                            ? "bg-purple-100 text-red-700"
                                                            : ""
                                                        }`}
                                                >
                                                    <input
                                                        className="accent-red-700"
                                                        type="radio"
                                                        name={`attendance-${teacher._id}`}
                                                        value="Absent"
                                                        checked={
                                                            status === "Absent"
                                                        }
                                                        onChange={() =>
                                                            setAttendance(
                                                                (previous) => ({
                                                                    ...previous,
                                                                    [teacher._id]:
                                                                        "Absent"
                                                                })
                                                            )
                                                        }
                                                    />
                                                    Absent
                                                </label>
                                            </div>
                                        )}
                                    </td>

                                    <td className="p-2 text-center">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                navigate(
                                                    `attendanceCalendar/${teacher._id}`
                                                )
                                            }
                                            title="View teacher attendance calendar"
                                            aria-label={`View attendance calendar for ${teacher.name}`}
                                            className="inline-flex cursor-pointer items-center justify-center rounded-md p-2 text-purple-800 transition-colors hover:bg-purple-300 hover:text-purple-950"
                                        >
                                            <FiCalendar size={20} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default PrincipalTeacherAttendanceTable;