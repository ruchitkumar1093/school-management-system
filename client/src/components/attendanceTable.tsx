
import { useNavigate } from "react-router-dom";
import { FiCalendar, FiLock } from "react-icons/fi";

type Student = {
  _id: string;
  userId: {
    name: string;
    uid: string;
  };
  onLeave: boolean;
  attendanceStatus: "Present" | "Absent" | null;
};

type Attendance = {
  [studentId: string]: "Present" | "Absent";
};

type Props = {
  students: Student[];
  attendance: Attendance;
  setAttendance: React.Dispatch<React.SetStateAction<Attendance>>;
  markAllStatus: "Present" | "Absent" | null;
  startIndex: number;
  isClassTeacher: boolean;
};

function TeacherAttendanceTable({
  students,
  startIndex,
  attendance,
  setAttendance,
  markAllStatus,
  isClassTeacher,
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
              Student Name:
            </th>
            <th className="border-r border-purple-300 p-3 text-center font-semibold text-purple-950">
              UID:
            </th>
            <th className="border-r border-purple-300 p-3 text-center font-semibold text-purple-950">
              Attendance:
            </th>
            <th className="p-3 text-center font-semibold text-purple-950">
              Calendar
            </th>
          </tr>
        </thead>

        <tbody>
          {students.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                className="p-4 text-center text-gray-500"
              >
                No records found
              </td>
            </tr>
          ) : (
            students.map((student, index) => {
              const status =
                student.attendanceStatus ??
                attendance[student._id] ??
                markAllStatus;

              return (
                <tr
                  key={student._id}
                  className="border-b border-purple-300 last:border-b-0 transition-colors hover:bg-purple-300/40"
                >
                  <td className="border-r border-purple-300 p-3 font-medium">
                    {startIndex + index + 1}
                  </td>

                  <td className="border-r border-purple-300 p-3 font-medium">
                    {student.userId.name}
                  </td>

                  <td className="border-r border-purple-300 p-3">
                    {student.userId.uid.toUpperCase()}
                  </td>

                  {isClassTeacher ? (
                    <td className="border-r border-purple-300 border-b border-purple-300 p-2">
                      {student.onLeave ? (
                        <div className="flex justify-center">
                          <span className="rounded-md px-5 py-2 font-medium text-yellow-600">
                            Leave
                          </span>
                        </div>
                      ) : student.attendanceStatus !== null ? (
                        <div className="flex justify-center">
                          <span
                            className={`rounded-md px-5 py-2 font-medium ${
                              student.attendanceStatus === "Present"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {student.attendanceStatus}
                          </span>
                        </div>
                      ) : (
                        <div className="flex justify-center gap-5">
                          <label
                            className={`flex cursor-pointer items-center gap-2 rounded-md p-2 ${
                              status === "Present"
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
                                setAttendance((prev) => ({
                                  ...prev,
                                  [student._id]: "Present",
                                }))
                              }
                            />
                            Present
                          </label>

                          <label
                            className={`flex cursor-pointer items-center gap-2 rounded-md p-2 ${
                              status === "Absent"
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
                                setAttendance((prev) => ({
                                  ...prev,
                                  [student._id]: "Absent",
                                }))
                              }
                            />
                            Absent
                          </label>
                        </div>
                      )}
                    </td>
                  ) : (
                    index === 0 && (
                      <td
                        rowSpan={students.length}
                        className="border-r border-purple-300 p-3 align-middle"
                      >
                        <div className="flex items-center justify-center gap-2 text-center text-sm text-purple-800">
                          <FiLock className="h-4 w-4 shrink-0" />
                          <span>
                            Only class teachers can mark
                          </span>
                        </div>
                      </td>
                    )
                  )}

                  <td className="p-2 text-center">
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `../attendance/attendanceCalendar/${student._id}`
                        )
                      }
                      title="View attendance calendar"
                      aria-label={`View attendance calendar for ${student.userId.name}`}
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

export default TeacherAttendanceTable;
