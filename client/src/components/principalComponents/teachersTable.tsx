import {
    FiEdit,
    FiTrash,
    FiEye,
    FiBarChart2,
    FiRotateCcw,
    FiXCircle
} from "react-icons/fi";

type Teacher = {
    _id: string;
    userId: {
        name: string;
    };
    employeeID: string;
    department: string;
    classAssigned: string;
    isDeleted: boolean;
    deletedAt: string | null;
};

type Props = {
    teacher: Teacher[];
    handleEditTeacher: (id: string) => void;
    handleDeleteTeacher: (id: string) => void;
    handleTeacherProfile: (id: string) => void;
    handleTeacherMarks: (id: string) => void;
    handleRestoreTeacher: (id: string) => void;
    handlePermanentlyDeleteTeacher: (id: string) => void;
    selectedTeachers: string[];
    handleSelectTeacher: (id: string) => void;
    handleSelectAllTeachers: () => void;
    allTeachersSelected: boolean;
    startIndex: number;
};

function PrincipalTeachersTable({
    teacher,
    handleEditTeacher,
    handleDeleteTeacher,
    handleTeacherProfile,
    handleTeacherMarks,
    handleRestoreTeacher,
    handlePermanentlyDeleteTeacher,
    selectedTeachers,
    handleSelectTeacher,
    handleSelectAllTeachers,
    allTeachersSelected,
    startIndex
}: Props) {
    return (
        <div className="overflow-x-auto rounded-lg shadow-md">
            <table className="w-full border-collapse bg-purple-200 text-left text-gray-900">
                <thead>
                    <tr className="border-b border-purple-300 bg-purple-300/80">
                        <th className="w-12 border-r border-purple-300 p-3 text-center">
                            <input
                                type="checkbox"
                                checked={allTeachersSelected}
                                onChange={handleSelectAllTeachers}
                                className="h-4 w-4 cursor-pointer accent-purple-700"
                            />
                        </th>

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
                                colSpan={7}
                                className="p-4 text-center text-gray-500"
                            >
                                No records found
                            </td>
                        </tr>
                    ) : (
                        teacher.map((tch, index) => (
                            <tr
                                key={tch._id}
                                className={`border-b border-purple-300 last:border-b-0 transition-colors ${
                                    tch.isDeleted
                                        ? "bg-gray-200 text-gray-500"
                                        : "hover:bg-purple-300/40"
                                }`}
                            >
                                <td className="w-12 border-r border-purple-300 p-3 text-center">
                                    <input
                                        type="checkbox"
                                        checked={
                                            !tch.isDeleted &&
                                            selectedTeachers.includes(tch._id)
                                        }
                                        disabled={tch.isDeleted}
                                        onChange={() =>
                                            handleSelectTeacher(tch._id)
                                        }
                                        className="h-4 w-4 cursor-pointer accent-purple-700 disabled:cursor-not-allowed disabled:opacity-40"
                                    />
                                </td>

                                <td className="border-r border-purple-300 p-3 font-medium">
                                    {startIndex + index + 1}
                                </td>

                                <td className="border-r border-purple-300 p-3 font-medium">
                                    <div className="flex items-center gap-2">
                                        <span>{tch.userId.name}</span>

                                        {tch.isDeleted && (
                                            <span className="rounded-full bg-gray-400 px-2 py-0.5 text-xs font-medium text-white">
                                                Deleted
                                            </span>
                                        )}
                                    </div>
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
                                        {tch.isDeleted ? (
                                            <>
                                                <button
                                                    title="Restore"
                                                    onClick={() =>
                                                        handleRestoreTeacher(tch._id)
                                                    }
                                                    className="cursor-pointer p-1.5 text-purple-900 transition-colors hover:text-green-700"
                                                >
                                                    <FiRotateCcw className="h-4 w-4" />
                                                </button>

                                                <button
                                                    title="Permanently Delete"
                                                    onClick={() =>
                                                        handlePermanentlyDeleteTeacher(tch._id)
                                                    }
                                                    className="cursor-pointer p-1.5 text-purple-900 transition-colors hover:text-red-700"
                                                >
                                                    <FiXCircle className="h-4 w-4" />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    title="Edit"
                                                    onClick={() =>
                                                        handleEditTeacher(tch._id)
                                                    }
                                                    className="cursor-pointer p-1.5 text-purple-900 transition-colors hover:text-purple-600"
                                                >
                                                    <FiEdit className="h-4 w-4" />
                                                </button>

                                                <button
                                                    title="Delete"
                                                    onClick={() =>
                                                        handleDeleteTeacher(tch._id)
                                                    }
                                                    className="cursor-pointer p-1.5 text-purple-900 transition-colors hover:text-red-700"
                                                >
                                                    <FiTrash className="h-4 w-4" />
                                                </button>

                                                <button
                                                    title="View"
                                                    onClick={() =>
                                                        handleTeacherProfile(tch._id)
                                                    }
                                                    className="cursor-pointer p-1.5 text-purple-900 transition-colors hover:text-purple-600"
                                                >
                                                    <FiEye className="h-4 w-4" />
                                                </button>

                                                <button
                                                    title="View Marks"
                                                    onClick={() =>
                                                        handleTeacherMarks(tch._id)
                                                    }
                                                    className="cursor-pointer p-1.5 text-purple-900 transition-colors hover:text-purple-600"
                                                >
                                                    <FiBarChart2 className="h-4 w-4" />
                                                </button>
                                            </>
                                        )}
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