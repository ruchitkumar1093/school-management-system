
import TeacherAttendance from "../src/models/TeacherAttendance";
import Teacher from "../src/models/Teacher";
import User from "../src/models/User";

export const up = async () => {
    const teachers = await Teacher.find().sort({ employeeID: 1 });
    const principal = await User.findOne({ role: "principal" });

    if (!principal) {
        throw new Error("Principal user not found. Run the first migration first.");
    }

    if (teachers.length === 0) {
        throw new Error("No teachers found. Run the first migration first.");
    }

    const attendanceDates = [
        new Date("2026-09-01"),
        new Date("2026-09-02"),
        new Date("2026-09-03"),
        new Date("2026-09-04"),
        new Date("2026-09-05"),
        new Date("2026-09-08"),
        new Date("2026-09-09"),
        new Date("2026-09-10"),
        new Date("2026-09-11"),
        new Date("2026-09-12")
    ];

    const attendanceData: {
        teacherId: typeof teachers[number]["_id"];
        date: Date;
        status: "Present" | "Absent";
        markedBy: typeof principal["_id"];
    }[] = [];

    teachers.forEach((teacher, teacherIndex) => {
        attendanceDates.forEach((date, dateIndex) => {
            const isAbsent =
                (teacherIndex + dateIndex) % 5 === 0 ||
                (teacherIndex === 1 && dateIndex === 3);

            attendanceData.push({
                teacherId: teacher._id,
                date,
                status: isAbsent ? "Absent" : "Present",
                markedBy: principal._id
            });
        });
    });

    await TeacherAttendance.bulkWrite(
        attendanceData.map((record) => ({
            updateOne: {
                filter: {
                    teacherId: record.teacherId,
                    date: record.date
                },
                update: {
                    $set: record
                },
                upsert: true
            }
        }))
    );

    console.log("Teacher attendance seeded successfully");
    console.log(`Teachers: ${teachers.length}`);
    console.log(`Attendance records: ${attendanceData.length}`);
    console.log(`Marked by principal: ${principal.uid}`);
};