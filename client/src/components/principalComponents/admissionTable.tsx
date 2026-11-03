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
        <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-y-2 text-left text-gray-900">
                <thead>
                    <tr className="bg-purple-300 text-purple-950">
                        <th className="rounded-l-lg px-3 py-2 font-semibold">
                            S.No.
                        </th>
                        <th className="px-3 py-2 font-semibold">
                            Student Name:
                        </th>
                        <th className="px-3 py-2 font-semibold">
                            Class Applying For:
                        </th>
                        <th className="px-3 py-2 font-semibold">
                            Status
                        </th>
                        <th className="rounded-r-lg px-3 py-2 font-semibold">
                            Actions:
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {admission.length === 0 ? (
                        <tr>
                            <td
                                colSpan={5}
                                className="rounded-lg bg-purple-100 p-4 text-center text-gray-500"
                            >
                                No records found
                            </td>
                        </tr>
                    ) : (
                        admission.map((adm, index) => (
                            <tr key={adm._id} className="group">
                                <td className="rounded-l-lg bg-purple-200 p-3 font-medium transition-colors group-hover:bg-purple-200/70">
                                    {startIndex + index + 1}
                                </td>

                                <td className="bg-purple-200 p-3 font-medium transition-colors group-hover:bg-purple-200/70">
                                    {adm.studentName}
                                </td>

                                <td className="bg-purple-200 p-3 transition-colors group-hover:bg-purple-200/70">
                                    {adm.classApplyingFor}
                                </td>

                                <td className="bg-purple-200 p-3 capitalize transition-colors group-hover:bg-purple-200/70">
                                    {adm.status}
                                </td>

                                <td className="rounded-r-lg bg-purple-200 p-3 transition-colors group-hover:bg-purple-200/70">
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            title="View"
                                            onClick={() =>
                                                handleViewAdmission(adm._id)
                                            }
                                            className="cursor-pointer rounded-md p-1.5 text-purple-800 transition-colors hover:bg-purple-300 hover:text-purple-950"
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