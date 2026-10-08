type Student = {
  _id: string;
  userId: {
    name: string;
    uid: string;
  };
  onLeave: boolean;
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
};

function TeacherAttendanceTable({
  students,
  startIndex,
  attendance,
  setAttendance,
  markAllStatus,
}: Props) {
  return (
    <div className="overflow-x-auto rounded-lg shadow-md">
      <table className="w-full border-collapse bg-purple-200 text-left text-gray-900">
        <thead>
          <tr className="border-b border-purple-300 bg-purple-300/80">
            <th className="border-r border-purple-300 p-3 font-semibold text-purple-950">
              S.No.
            </th>

            <th className="border-r border-purple-300 p-3 font-semibold text-purple-950">
              Student Name:
            </th>

            <th className="border-r border-purple-300 p-3 font-semibold text-purple-950">
              UID:
            </th>

            <th className="p-3 font-semibold text-purple-950">
              Attendance:
            </th>
          </tr>
        </thead>

        <tbody>
          {students.length === 0 ? (
            <tr>
              <td
                colSpan={4}
                className="p-4 text-center text-gray-500"
              >
                No records found
              </td>
            </tr>
          ) : (
            students.map((student, index) => {
              /*
               * Individual attendance has priority over
               * the global "mark all" status.
               *
               * Example:
               *
               * markAllStatus = "Present"
               * attendance[id] = "Absent"
               *
               * Result = "Absent"
               */
              const status =
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

                  <td className="p-2">
                    {student.onLeave ? (
                      <div className="flex justify-center">
                        <span className="rounded-md bg-yellow-100 px-5 py-2 font-medium text-yellow-700">
                          Leave
                        </span>
                      </div>
                    ) : (
                      <div className="flex justify-center gap-5">
                        <label
                          className={`flex items-center gap-2 rounded-md p-2 cursor-pointer ${
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
                            checked={
                              status === "Present"
                            }
                            onChange={() =>
                              setAttendance((prev) => ({
                                ...prev,
                                [student._id]:
                                  "Present",
                              }))
                            }
                          />

                          Present
                        </label>

                        <label
                          className={`flex items-center gap-2 rounded-md p-2 cursor-pointer ${
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
                            checked={
                              status === "Absent"
                            }
                            onChange={() =>
                              setAttendance((prev) => ({
                                ...prev,
                                [student._id]:
                                  "Absent",
                              }))
                            }
                          />

                          Absent
                        </label>
                      </div>
                    )}
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