import {
    FiEdit,
    FiTrash,
    FiEye,
    FiRotateCcw,
    FiXCircle
} from "react-icons/fi";

type Student = {
    _id: string;
    userId: {
        name: string;
        uid: string;
    };
    class: string;
    rollNumber: number;
    isDeleted: boolean;
    deletedAt: string | null;
};

type Props = {
    student: Student[];
    handleEditStudent: (id: string) => void;
    handleDeleteStudent: (id: string) => void;
    handleStudentProfile: (id: string) => void;
    handleRestoreStudent: (id: string) => void;
    handlePermanentlyDeleteStudent: (id: string) => void;
    selectedStudents: string[];
    handleSelectStudent: (id: string) => void;
    handleSelectAllStudents: () => void;
    allStudentsSelected: boolean;
    startIndex: number;
};

function PrincipalStudentsTable({
    student,
    handleEditStudent,
    handleDeleteStudent,
    handleStudentProfile,
    handleRestoreStudent,
    handlePermanentlyDeleteStudent,
    selectedStudents,
    handleSelectStudent,
    handleSelectAllStudents,
    allStudentsSelected,
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
                                checked={allStudentsSelected}
                                onChange={handleSelectAllStudents}
                                className="h-4 w-4 cursor-pointer accent-purple-700"
                            />
                        </th>

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
                                colSpan={7}
                                className="p-4 text-center text-gray-500"
                            >
                                No records found
                            </td>
                        </tr>
                    ) : (
                        student.map((std, index) => (
                            <tr
                                key={std._id}
                                className={`border-b border-purple-300 last:border-b-0 transition-colors ${
                                    std.isDeleted
                                        ? "bg-gray-200 text-gray-500"
                                        : "hover:bg-purple-300/40"
                                }`}
                            >
                                <td className="w-12 border-r border-purple-300 p-3 text-center">
                                    <input
                                        type="checkbox"
                                        checked={
                                            !std.isDeleted &&
                                            selectedStudents.includes(std._id)
                                        }
                                        disabled={std.isDeleted}
                                        onChange={() =>
                                            handleSelectStudent(std._id)
                                        }
                                        className="h-4 w-4 cursor-pointer accent-purple-700 disabled:cursor-not-allowed disabled:opacity-40"
                                    />
                                </td>

                                <td className="border-r border-purple-300 p-3 font-medium">
                                    {startIndex + index + 1}
                                </td>

                                <td className="border-r border-purple-300 p-3 font-medium">
                                    <div className="flex items-center gap-2">
                                        <span>{std.userId.name}</span>

                                        {std.isDeleted && (
                                            <span className="rounded-full bg-gray-400 px-2 py-0.5 text-xs font-medium text-white">
                                                Deleted
                                            </span>
                                        )}
                                    </div>
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
                                        {std.isDeleted ? (
                                            <>
                                                <button
                                                    title="Restore"
                                                    onClick={() =>
                                                        handleRestoreStudent(std._id)
                                                    }
                                                    className="cursor-pointer p-1.5 text-purple-900 transition-colors hover:text-green-700"
                                                >
                                                    <FiRotateCcw className="h-4 w-4" />
                                                </button>

                                                <button
                                                    title="Permanently Delete"
                                                    onClick={() =>
                                                        handlePermanentlyDeleteStudent(std._id)
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
                                                        handleEditStudent(std._id)
                                                    }
                                                    className="cursor-pointer p-1.5 text-purple-900 transition-colors hover:text-purple-600"
                                                >
                                                    <FiEdit className="h-4 w-4" />
                                                </button>

                                                <button
                                                    title="Delete"
                                                    onClick={() =>
                                                        handleDeleteStudent(std._id)
                                                    }
                                                    className="cursor-pointer p-1.5 text-purple-900 transition-colors hover:text-red-700"
                                                >
                                                    <FiTrash className="h-4 w-4" />
                                                </button>

                                                <button
                                                    title="View"
                                                    onClick={() =>
                                                        handleStudentProfile(std._id)
                                                    }
                                                    className="cursor-pointer p-1.5 text-purple-900 transition-colors hover:text-purple-600"
                                                >
                                                    <FiEye className="h-4 w-4" />
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

export default PrincipalStudentsTable;