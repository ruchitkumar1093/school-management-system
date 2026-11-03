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
  attendanceMarked: boolean;
};

function TeacherAttendanceTable({
  students,
  startIndex,
  attendance,
  setAttendance,
  markAllStatus,
  isClassTeacher,
  attendanceMarked,
}: Props) {
  const navigate = useNavigate();

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-separate border-spacing-y-2 text-left text-gray-900">
        <thead>
          <tr className="bg-purple-300 text-purple-950">
            <th className="rounded-l-lg px-3 py-2 text-center font-semibold">
              S.No.
            </th>

            <th className="px-3 py-2 text-center font-semibold">
              Student Name:
            </th>

            <th className="px-3 py-2 text-center font-semibold">
              UID:
            </th>

            <th className="px-3 py-2 text-center font-semibold">
              Attendance:
            </th>

            <th className="rounded-r-lg px-3 py-2 text-center font-semibold">
              Calendar
            </th>
          </tr>
        </thead>

        <tbody>
          {students.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                className="rounded-lg bg-purple-100 p-4 text-center text-gray-500"
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
                <tr key={student._id} className="group">
                  <td className="rounded-l-lg bg-purple-200 p-3 text-center font-medium transition-colors group-hover:bg-purple-200/70">
                    {startIndex + index + 1}
                  </td>

                  <td className="bg-purple-200 p-3 font-medium transition-colors group-hover:bg-purple-200/70">
                    {student.userId.name}
                  </td>

                  <td className="bg-purple-200 p-3 transition-colors group-hover:bg-purple-200/70">
                    {student.userId.uid.toUpperCase()}
                  </td>

                  {isClassTeacher ? (
                    <td className="bg-purple-200 p-2 transition-colors group-hover:bg-purple-200/70">
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
                  ) : attendanceMarked ? (
                    <td className="bg-purple-200 p-2 transition-colors group-hover:bg-purple-200/70">
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
                        <div className="text-center text-gray-500">—</div>
                      )}
                    </td>
                  ) : (
                    <td className="bg-purple-200 p-3 align-middle transition-colors group-hover:bg-purple-200/70">
                      <div className="flex items-center justify-center gap-2 text-center text-sm text-purple-800">
                        <FiLock className="h-4 w-4 shrink-0" />
                        <span>Only class teachers can mark</span>
                      </div>
                    </td>
                  )}

                  <td className="rounded-r-lg bg-purple-200 p-2 text-center transition-colors group-hover:bg-purple-200/70">
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `../attendance/attendanceCalendar/${student._id}`
                        )
                      }
                      title="View attendance calendar"
                      aria-label={`View attendance calendar for ${student.userId.name}`}
                      className="inline-flex cursor-pointer items-center justify-center rounded-md p-1.5 text-purple-800 transition-colors hover:bg-purple-300 hover:text-purple-950"
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