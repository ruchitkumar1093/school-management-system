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

function AdmissionTable({ admission, startIndex, handleViewAdmission }: Props) {
    return (
        <div >
            <table className="border-collapse border border-gray-400 bg-purple-200">
                <thead>
                    <tr className="bg-purple-300">
                        <th className="border border-gray-400 p-3 font-medium">S.No.</th>
                        <th className="border border-gray-400 p-3 font-medium">Student Name:</th>
                        <th className="border border-gray-400 p-3 font-medium">Class Applying For:</th>
                        <th className="border border-gray-400 p-3 font-medium">Status</th>
                        <th className="border border-gray-400 p-3 font-medium">Actions:</th>
                    </tr>
                </thead>
                <tbody>
                    {admission.length === 0 ? (
                        <tr>
                            <td
                                colSpan={5}
                                className="border border-gray-400 p-3 text-center text-gray-600"
                            >
                                No records found
                            </td>
                        </tr>
                    ) : (admission.map((adm, index) => (
                        <tr key={adm._id}>
                            <td className="border border-gray-400 p-3">{startIndex + index + 1}</td>
                            <td className="border border-gray-400 p-3">{adm.studentName}</td>
                            <td className="border border-gray-400 p-3">{adm.classApplyingFor}</td>
                            <td className="border border-gray-400 p-3">{adm.status}</td>
                            <td className="border border-gray-400 p-3">
                                <div className="flex gap-2 justify-center">
                                    <button onClick={() => handleViewAdmission(adm._id)} className="hover:text-purple-700 p-2 cursor-pointer"><FiEye /></button>
                                </div>
                            </td>
                        </tr>
                    )))}
                </tbody>
            </table>
        </div>
    );
}

export default AdmissionTable;