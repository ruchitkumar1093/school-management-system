import { useEffect, useState } from "react";

import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import Breadcrumb from "../../components/breadcrumb";
import AttendanceCalendar from "../../components/attendanceCalendar";

import {
    getAttendance
} from "../../services/studentApi";

type Attendance = {
    _id: string;
    date: string;
    status: "Present" | "Absent" | "Leave";
};

type StudentInfo = {
    name: string;
    uid: string;
    class: string;
    rollNumber: string;
};

function AttendanceCalendarPage() {

    const [attendance, setAttendance] =
        useState<Attendance[]>([]);

    const [student, setStudent] =
        useState<StudentInfo | null>(null);

    const [loading, setLoading] =
        useState(true);

    useEffect(() => {

        const fetchAttendance = async () => {

            try {

                const response =
                    await getAttendance(1, 1000);

                const formattedAttendance =
                    response.data.attendance.map(
                        (record: Attendance) => ({
                            ...record,
                            date: record.date.split("T")[0]
                        })
                    );

                setAttendance(
                    formattedAttendance
                );

                setStudent(
                    response.data.student
                );

            }
            catch (error) {

                console.error(
                    "Failed to fetch attendance:",
                    error
                );

                setAttendance([]);
                setStudent(null);

            }
            finally {

                setLoading(false);

            }
        };

        fetchAttendance();

    }, []);

    return (
        <div className="flex min-h-screen flex-col font-fredoka">

            <NavBar />

            <div className="flex flex-1 bg-purple-100">

                <SideBar />

                <div className="flex min-w-0 flex-1 flex-col">

                    <Breadcrumb />

                    <div className="flex flex-1 flex-col px-16 pt-10 pb-12">

                        <div className="mb-8">

                            <h1 className="text-3xl font-medium text-gray-900">
                                Attendance Calendar
                            </h1>

                            <p className="mt-1 text-sm text-gray-600">
                                View your attendance by date
                            </p>

                        </div>

                        {loading ? (

                            <p className="text-gray-600">
                                Loading attendance...
                            </p>

                        ) : (

                            <>
                                {student && (
                                    <div className="mb-6 flex flex-wrap gap-8">

                                        <div>
                                            Student:
                                            <span className="ml-1 font-medium">
                                                {student.name}
                                            </span>
                                        </div>

                                        <div>
                                            UID:
                                            <span className="ml-1 font-medium">
                                                {student.uid.toUpperCase()}
                                            </span>
                                        </div>

                                        <div>
                                            Class:
                                            <span className="ml-1 font-medium">
                                                {student.class}
                                            </span>
                                        </div>

                                        <div>
                                            Roll Number:
                                            <span className="ml-1 font-medium">
                                                {student.rollNumber}
                                            </span>
                                        </div>

                                    </div>
                                )}

                                <AttendanceCalendar
                                    attendance={attendance}
                                />
                            </>

                        )}

                    </div>

                </div>

            </div>

        </div>
    );
}

export default AttendanceCalendarPage;