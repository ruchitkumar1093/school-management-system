import React from "react";
import { FiEdit, FiTrash, FiEye } from "react-icons/fi";

type Student = {
  _id: string;
  userId: {
    name: string;
    uid: string;
  };
  class: string;
  rollNumber: number;
};

type Props = {
  student: Student[];
  handleEditStudent: (id: string) => void;
  handleDeleteStudent: (id: string) => void;
  handleStudentProfile: (id: string) => void;
  startIndex: number;
};

function PrincipalStudentsTable({
  student,
  handleEditStudent,
  handleDeleteStudent,
  handleStudentProfile,
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
              Student Name:
            </th>
            <th className="border-r border-purple-300 p-3 font-semibold text-purple-950">
              UID:
            </th>
            <th className="border-r border-purple-300 p-3 font-semibold text-purple-950">
              Class:
            </th>
            <th className="border-r border-purple-300 p-3 font-semibold text-purple-950">
              Roll no:
            </th>
            <th className="p-3 font-semibold text-purple-950">
              Actions:
            </th>
          </tr>
        </thead>
        <tbody>
          {student.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="p-4 text-center text-gray-500"
              >
                No records found
              </td>
            </tr>
          ) : (
            student.map((std, index) => (
              <tr
                key={std._id}
                className="border-b border-purple-300 last:border-b-0 transition-colors hover:bg-purple-300/40"
              >
                <td className="border-r border-purple-300 p-3 font-medium">
                  {startIndex + index + 1}
                </td>
                <td className="border-r border-purple-300 p-3 font-medium">
                  {std.userId.name}
                </td>
                <td className="border-r border-purple-300 p-3">
                  {std.userId.uid.toUpperCase()}
                </td>
                <td className="border-r border-purple-300 p-3">
                  {std.class}
                </td>
                <td className="border-r border-purple-300 p-3">
                  {std.rollNumber}
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-1">
                    <button
                      title="Edit"
                      onClick={() => handleEditStudent(std._id)}
                      className="p-1.5 text-purple-900 transition-colors hover:text-purple-600 cursor-pointer"
                    >
                      <FiEdit className="h-4 w-4" />
                    </button>
                    <button
                      title="Delete"
                      onClick={() => handleDeleteStudent(std._id)}
                      className="p-1.5 text-purple-900 transition-colors hover:text-red-700 cursor-pointer"
                    >
                      <FiTrash className="h-4 w-4" />
                    </button>
                    <button
                      title="View"
                      onClick={() => handleStudentProfile(std._id)}
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

export default PrincipalStudentsTable;