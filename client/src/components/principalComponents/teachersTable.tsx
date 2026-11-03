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
        isActive: boolean;
    };
    employeeID: string;
    classes: string[];
    subjects: string[];
    isDeleted: boolean;
    deletedAt: string | null;
    isClassTeacher: boolean;
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
        <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[900px] border-separate border-spacing-y-2 text-left text-gray-900">
                <thead>
                    <tr className="bg-purple-300">
                        <th className="w-12 rounded-l-lg px-3 py-2 text-center">
                            <input
                                type="checkbox"
                                checked={allTeachersSelected}
                                onChange={handleSelectAllTeachers}
                                className="h-4 w-4 cursor-pointer accent-purple-700"
                            />
                        </th>

                        <th className="px-3 py-2 font-semibold text-purple-950">
                            S.No.
                        </th>

                        <th className="px-3 py-2 font-semibold text-purple-950">
                            Teacher Name
                        </th>

                        <th className="px-3 py-2 font-semibold text-purple-950">
                            Employee ID
                        </th>

                        <th className="px-3 py-2 font-semibold text-purple-950">
                            Assigned Classes
                        </th>

                        <th className="px-3 py-2 font-semibold text-purple-950">
                            Assigned Subjects
                        </th>

                        <th className="rounded-r-lg px-3 py-2 font-semibold text-purple-950">
                            Actions
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {teacher.length === 0 ? (
                        <tr>
                            <td
                                colSpan={7}
                                className="rounded-lg bg-purple-100 p-4 text-center text-gray-500"
                            >
                                No records found
                            </td>
                        </tr>
                    ) : (
                        teacher.map((tch, index) => (
                            <tr
                                key={tch._id}
                                className={`group ${
                                    tch.isDeleted
                                        ? "text-gray-500"
                                        : !tch.userId?.isActive
                                          ? "text-gray-500"
                                          : ""
                                }`}
                            >
                                <td
                                    className={`w-12 rounded-l-lg p-3 text-center transition-colors ${
                                        tch.isDeleted
                                            ? "bg-gray-200"
                                            : !tch.userId?.isActive
                                              ? "bg-red-50/70"
                                              : "bg-purple-200 group-hover:bg-purple-200/70"
                                    }`}
                                >
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

                                <td
                                    className={`p-3 font-medium transition-colors ${
                                        tch.isDeleted
                                            ? "bg-gray-200"
                                            : !tch.userId?.isActive
                                              ? "bg-red-50/70"
                                              : "bg-purple-200 group-hover:bg-purple-200/70"
                                    }`}
                                >
                                    {startIndex + index + 1}
                                </td>

                                <td
                                    className={`p-3 font-medium transition-colors ${
                                        tch.isDeleted
                                            ? "bg-gray-200"
                                            : !tch.userId?.isActive
                                              ? "bg-red-50/70"
                                              : "bg-purple-200 group-hover:bg-purple-200/70"
                                    }`}
                                >
                                    <div className="flex min-w-[170px] flex-wrap items-center gap-2">
                                        <span>
                                            {tch.userId?.name ?? "Unknown"}
                                        </span>

                                        {tch.isDeleted && (
                                            <span className="rounded-full bg-gray-400 px-2.5 py-1 text-xs font-medium text-white">
                                                Deleted
                                            </span>
                                        )}

                                        {!tch.isDeleted &&
                                            !tch.userId?.isActive && (
                                                <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                                                    Deactivated
                                                </span>
                                            )}

                                        {!tch.isDeleted &&
                                            tch.isClassTeacher && (
                                                <span className="rounded-full bg-purple-300 px-2.5 py-1 text-xs font-medium text-purple-800">
                                                    Class Teacher
                                                </span>
                                            )}
                                    </div>
                                </td>

                                <td
                                    className={`p-3 transition-colors ${
                                        tch.isDeleted
                                            ? "bg-gray-200"
                                            : !tch.userId?.isActive
                                              ? "bg-red-50/70"
                                              : "bg-purple-200 group-hover:bg-purple-200/70"
                                    }`}
                                >
                                    {tch.employeeID?.toUpperCase() ?? "—"}
                                </td>

                                <td
                                    className={`p-3 transition-colors ${
                                        tch.isDeleted
                                            ? "bg-gray-200"
                                            : !tch.userId?.isActive
                                              ? "bg-red-50/70"
                                              : "bg-purple-200 group-hover:bg-purple-200/70"
                                    }`}
                                >
                                    <div className="flex min-w-[130px] flex-wrap gap-1.5">
                                        {tch.classes?.length ? (
                                            tch.classes.map(className => (
                                                <span
                                                    key={className}
                                                    className="rounded-md border border-purple-400 bg-purple-100 px-2.5 py-1 text-sm font-medium text-purple-900"
                                                >
                                                    {className}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-sm text-gray-500">
                                                No classes assigned
                                            </span>
                                        )}
                                    </div>
                                </td>

                                <td
                                    className={`p-3 transition-colors ${
                                        tch.isDeleted
                                            ? "bg-gray-200"
                                            : !tch.userId?.isActive
                                              ? "bg-red-50/70"
                                              : "bg-purple-200 group-hover:bg-purple-200/70"
                                    }`}
                                >
                                    <div className="flex min-w-[150px] flex-wrap gap-1.5">
                                        {tch.subjects?.length ? (
                                            tch.subjects.map(subject => (
                                                <span
                                                    key={subject}
                                                    className="rounded-md border border-purple-400 bg-purple-100 px-2.5 py-1 text-sm font-medium text-purple-900"
                                                >
                                                    {subject}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-sm text-gray-500">
                                                No subjects assigned
                                            </span>
                                        )}
                                    </div>
                                </td>

                                <td
                                    className={`rounded-r-lg p-3 transition-colors ${
                                        tch.isDeleted
                                            ? "bg-gray-200"
                                            : !tch.userId?.isActive
                                              ? "bg-red-50/70"
                                              : "bg-purple-200 group-hover:bg-purple-200/70"
                                    }`}
                                >
                                    <div className="flex items-center gap-1">
                                        {tch.isDeleted ? (
                                            <>
                                                <button
                                                    type="button"
                                                    title="Restore"
                                                    onClick={() =>
                                                        handleRestoreTeacher(tch._id)
                                                    }
                                                    className="cursor-pointer rounded p-1.5 text-purple-900 transition-colors hover:bg-purple-200 hover:text-green-700"
                                                >
                                                    <FiRotateCcw className="h-4 w-4" />
                                                </button>

                                                <button
                                                    type="button"
                                                    title="Permanently Delete"
                                                    onClick={() =>
                                                        handlePermanentlyDeleteTeacher(tch._id)
                                                    }
                                                    className="cursor-pointer rounded p-1.5 text-purple-900 transition-colors hover:bg-red-100 hover:text-red-700"
                                                >
                                                    <FiXCircle className="h-4 w-4" />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    type="button"
                                                    title="Edit"
                                                    onClick={() =>
                                                        handleEditTeacher(tch._id)
                                                    }
                                                    className="cursor-pointer rounded p-1.5 text-purple-900 transition-colors hover:bg-purple-200 hover:text-purple-700"
                                                >
                                                    <FiEdit className="h-4 w-4" />
                                                </button>

                                                <button
                                                    type="button"
                                                    title="Delete"
                                                    onClick={() =>
                                                        handleDeleteTeacher(tch._id)
                                                    }
                                                    className="cursor-pointer rounded p-1.5 text-purple-900 transition-colors hover:bg-red-100 hover:text-red-700"
                                                >
                                                    <FiTrash className="h-4 w-4" />
                                                </button>

                                                <button
                                                    type="button"
                                                    title="View"
                                                    onClick={() =>
                                                        handleTeacherProfile(tch._id)
                                                    }
                                                    className="cursor-pointer rounded p-1.5 text-purple-900 transition-colors hover:bg-purple-200 hover:text-purple-700"
                                                >
                                                    <FiEye className="h-4 w-4" />
                                                </button>

                                                <button
                                                    type="button"
                                                    title="View Marks"
                                                    onClick={() =>
                                                        handleTeacherMarks(tch._id)
                                                    }
                                                    className="cursor-pointer rounded p-1.5 text-purple-900 transition-colors hover:bg-purple-200 hover:text-purple-700"
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