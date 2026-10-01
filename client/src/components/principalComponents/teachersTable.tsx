import { FiEdit, FiTrash, FiEye } from "react-icons/fi";

type Teacher = {
  _id: string;
  userId: {
    name: string;
  };
  employeeID: string;
  department: string;
  classAssigned: string;
};

type Props = {
  teacher: Teacher[];
  handleEditTeacher: (id: string) => void;
  handleDeleteTeacher: (id: string) => void;
  handleTeacherProfile: (id: string) => void;
  startIndex: number;
};

function PrincipalTeachersTable({
  teacher,
  handleEditTeacher,
  handleDeleteTeacher,
  handleTeacherProfile,
  startIndex,
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
              Teacher Name:
            </th>
            <th className="border-r border-purple-300 p-3 font-semibold text-purple-950">
              Employee ID:
            </th>
            <th className="border-r border-purple-300 p-3 font-semibold text-purple-950">
              Department:
            </th>
            <th className="border-r border-purple-300 p-3 font-semibold text-purple-950">
              Class Assigned:
            </th>
            <th className="p-3 font-semibold text-purple-950">
              Actions:
            </th>
          </tr>
        </thead>
        <tbody>
          {teacher.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="p-4 text-center text-gray-500"
              >
                No records found
              </td>
            </tr>
          ) : (
            teacher.map((tch, index) => (
              <tr
                key={tch._id}
                className="border-b border-purple-300 last:border-b-0 transition-colors hover:bg-purple-300/40"
              >
                <td className="border-r border-purple-300 p-3 font-medium">
                  {startIndex + index + 1}
                </td>
                <td className="border-r border-purple-300 p-3 font-medium">
                  {tch.userId.name}
                </td>
                <td className="border-r border-purple-300 p-3">
                  {tch.employeeID.toUpperCase()}
                </td>
                <td className="border-r border-purple-300 p-3">
                  {tch.department}
                </td>
                <td className="border-r border-purple-300 p-3">
                  {tch.classAssigned}
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-1">
                    <button
                      title="Edit"
                      onClick={() => handleEditTeacher(tch._id)}
                      className="p-1.5 text-purple-900 transition-colors hover:text-purple-600 cursor-pointer"
                    >
                      <FiEdit className="h-4 w-4" />
                    </button>
                    <button
                      title="Delete"
                      onClick={() => handleDeleteTeacher(tch._id)}
                      className="p-1.5 text-purple-900 transition-colors hover:text-red-700 cursor-pointer"
                    >
                      <FiTrash className="h-4 w-4" />
                    </button>
                    <button
                      title="View"
                      onClick={() => handleTeacherProfile(tch._id)}
                      className="p-1.5 text-purple-900 transition-colors hover:text-purple-600 cursor-pointer"
                    >
                      <FiEye className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default PrincipalTeachersTable;