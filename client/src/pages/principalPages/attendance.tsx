import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import { getAttendanceSummary } from "../../services/principalApi";
import PrincipalAttendanceTable from "../../components/principalComponents/principalAttendanceTable";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Breadcrumb from "../../components/breadcrumb";

type Summary = {
    class: string;
    present: number;
    absent: number;
    percentage: number;
};

function PrincipalAttendance() {

    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState(
        new Date().toISOString().split("T")[0]
    );

    const [summaryData, setSummaryData] = useState<Summary[]>([]);

    const fetchAttendanceSummary = async () => {
        try {
            const response = await getAttendanceSummary(selectedDate);

            console.log("Attendance summary:", response.data);

            setSummaryData(response.data);
        } catch (error) {
            console.log(error);
            setSummaryData([]);
        }
    };

    useEffect(() => {
        fetchAttendanceSummary();
    }, [selectedDate]);

    return (
        <div className="flex flex-col min-h-screen font-fredoka">
            <NavBar />

            <div className="flex flex-1 bg-purple-100">
                <SideBar />

                <div className="flex flex-col">
                    <Breadcrumb />
                    <div className="flex flex-col pt-12 pl-20 mb-10 max-w-6xl">
                        <div className="items-center mb-6">
                            <h1 className="text-3xl">
                                Attendance Summary:
                            </h1>


                        </div>
                        <div className="mb-4 flex justify-between">
                            <input
                                type="date"
                                value={selectedDate}
                                max={new Date().toISOString().split("T")[0]}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="border-2 border-gray-500 rounded-sm p-2
                            focus:outline-none focus:border-gray-900"
                            />
                            <button
                                type="button" onClick={() => navigate("viewAttendance")}
                                className="p-2 bg-purple-300 rounded-lg shadow-[0_2px_1px] hover:bg-violet-300 cursor-pointer"
                            >
                                View Attendance
                            </button>
                        </div>

                        <PrincipalAttendanceTable
                            summaryData={summaryData}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PrincipalAttendance;