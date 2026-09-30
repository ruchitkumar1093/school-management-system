import { FiEye } from "react-icons/fi";

type Admission = {
    _id: string;
    studentName: string;
    classApplyingFor: string;
    status: string;
};

type Props = {
    admission: Admission[];
    startIndex: number;
    handleViewAdmission: (id: string) => void;
};

function AdmissionTable({
    admission,
    startIndex,
    handleViewAdmission
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
                            Class Applying For:
                        </th>
                        <th className="border-r border-purple-300 p-3 font-semibold text-purple-950">
                            Status
                        </th>
                        <th className="p-3 font-semibold text-purple-950">
                            Actions:
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {admission.length === 0 ? (
                        <tr>
                            <td
                                colSpan={5}
                                className="p-4 text-center text-gray-500"
                            >
                                No records found
                            </td>
                        </tr>
                    ) : (
                        admission.map((adm, index) => (
                            <tr
                                key={adm._id}
                                className="border-b border-purple-300 last:border-b-0 transition-colors hover:bg-purple-300/40"
                            >
                                <td className="border-r border-purple-300 p-3 font-medium">
                                    {startIndex + index + 1}
                                </td>

                                <td className="border-r border-purple-300 p-3 font-medium">
                                    {adm.studentName}
                                </td>

                                <td className="border-r border-purple-300 p-3">
                                    {adm.classApplyingFor}
                                </td>

                                <td className="border-r border-purple-300 p-3 capitalize">
                                    {adm.status}
                                </td>

                                <td className="p-3">
                                    <div className="flex items-center gap-1">
                                        <button
                                            title="View"
                                            onClick={() =>
                                                handleViewAdmission(adm._id)
                                            }
                                            className="cursor-pointer p-1.5 text-purple-900 transition-colors hover:text-purple-600"
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

export default AdmissionTable;