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
        isActive: boolean;
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
    isClassTeacher: boolean;
    loadingTeacherStatus: boolean;
};

function TeacherStudentsTable({
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
    startIndex,
    isClassTeacher,
}: Props) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-y-2 text-left text-gray-900">
                <thead>
                    <tr className="bg-purple-300 text-purple-950">
                        <th className="w-12 rounded-l-lg px-3 py-2 text-center">
                            <input
                                type="checkbox"
                                checked={allStudentsSelected}
                                onChange={handleSelectAllStudents}
                                disabled={
                                    student.filter(
                                        (std) => !std.isDeleted
                                    ).length === 0
                                }
                                className="h-4 w-4 cursor-pointer accent-purple-700 disabled:cursor-not-allowed disabled:opacity-40"
                            />
                        </th>

                        <th className="px-3 py-2 font-semibold">
                            S.No.
                        </th>

                        <th className="px-3 py-2 font-semibold">
                            Student Name:
                        </th>

                        <th className="px-3 py-2 font-semibold">
                            UID:
                        </th>

                        <th className="px-3 py-2 font-semibold">
                            Class:
                        </th>

                        <th className="px-3 py-2 font-semibold">
                            Roll no:
                        </th>

                        <th className="rounded-r-lg px-3 py-2 font-semibold">
                            Actions:
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {student.length === 0 ? (
                        <tr>
                            <td
                                colSpan={7}
                                className="rounded-lg bg-purple-100 p-4 text-center text-gray-500"
                            >
                                No records found
                            </td>
                        </tr>
                    ) : (
                        student.map((std, index) => {
                            const rowBackground = std.isDeleted
                                ? "bg-gray-200 text-gray-500"
                                : !std.userId.isActive
                                  ? "bg-red-50/70 text-gray-500"
                                  : "bg-purple-200";

                            const cellHover = !std.isDeleted && std.userId.isActive
                                ? "group-hover:bg-purple-200/70"
                                : "";

                            return (
                                <tr key={std._id} className="group">
                                    <td className={`w-12 rounded-l-lg p-3 text-center transition-colors ${rowBackground} ${cellHover}`}>
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

                                    <td className={`p-3 font-medium transition-colors ${rowBackground} ${cellHover}`}>
                                        {startIndex + index + 1}
                                    </td>

                                    <td className={`p-3 font-medium transition-colors ${rowBackground} ${cellHover}`}>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span>{std.userId.name}</span>

                                            {std.isDeleted && (
                                                <span className="rounded-full bg-gray-400 px-2.5 py-1 text-xs font-medium text-white">
                                                    Deleted
                                                </span>
                                            )}

                                            {!std.isDeleted &&
                                                !std.userId.isActive && (
                                                    <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                                                        Deactivated
                                                    </span>
                                                )}
                                        </div>
                                    </td>

                                    <td className={`p-3 transition-colors ${rowBackground} ${cellHover}`}>
                                        {std.userId.uid.toUpperCase()}
                                    </td>

                                    <td className={`p-3 transition-colors ${rowBackground} ${cellHover}`}>
                                        {std.class}
                                    </td>

                                    <td className={`p-3 transition-colors ${rowBackground} ${cellHover}`}>
                                        {std.rollNumber}
                                    </td>

                                    <td className={`rounded-r-lg p-3 transition-colors ${rowBackground} ${cellHover}`}>
                                        <div className="flex items-center gap-1">
                                            {std.isDeleted ? (
                                                <>
                                                    <button
                                                        type="button"
                                                        title="Restore"
                                                        onClick={() =>
                                                            handleRestoreStudent(std._id)
                                                        }
                                                        className="cursor-pointer rounded-md p-1.5 text-purple-900 transition-colors hover:bg-green-100 hover:text-green-700"
                                                    >
                                                        <FiRotateCcw className="h-4 w-4" />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        title="Permanently Delete"
                                                        onClick={() =>
                                                            handlePermanentlyDeleteStudent(std._id)
                                                        }
                                                        className="cursor-pointer rounded-md p-1.5 text-purple-900 transition-colors hover:bg-red-100 hover:text-red-700"
                                                    >
                                                        <FiXCircle className="h-4 w-4" />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        type="button"
                                                        title={
                                                            isClassTeacher
                                                                ? "Edit"
                                                                : "Only class teachers can edit students"
                                                        }
                                                        onClick={() => handleEditStudent(std._id)}
                                                        className="cursor-pointer rounded-md p-1.5 text-purple-900 transition-colors hover:bg-purple-300 hover:text-purple-950"
                                                    >
                                                        <FiEdit className="h-4 w-4" />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        title={
                                                            isClassTeacher
                                                                ? "Delete"
                                                                : "Only class teachers can delete students"
                                                        }
                                                        onClick={() => handleDeleteStudent(std._id)}
                                                        className="cursor-pointer rounded-md p-1.5 text-purple-900 transition-colors hover:bg-red-100 hover:text-red-700"
                                                    >
                                                        <FiTrash className="h-4 w-4" />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        title="View"
                                                        onClick={() =>
                                                            handleStudentProfile(std._id)
                                                        }
                                                        className="cursor-pointer rounded-md p-1.5 text-purple-900 transition-colors hover:bg-purple-300 hover:text-purple-950"
                                                    >
                                                        <FiEye className="h-4 w-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
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

export default TeacherStudentsTable;