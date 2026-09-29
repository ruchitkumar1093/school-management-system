import Leave from "../src/models/Leave";
import Student from "../src/models/Student";

export async function up() {

    const students = await Student.find()
        .sort({ rollNumber: 1 })
        .limit(10);

    if (students.length < 10) {
        throw new Error(
            "At least 10 students are required to seed leave applications"
        );
    }

    const leaves = [
        {
            studentId: students[0]._id,
            startDate: new Date("2026-09-28"),
            endDate: new Date("2026-09-28"),
            reason: "Medical appointment",
            status: "Approved"
        },
        {
            studentId: students[0]._id,
            startDate: new Date("2026-10-12"),
            endDate: new Date("2026-10-14"),
            reason: "Family function",
            status: "Pending"
        },

        {
            studentId: students[1]._id,
            startDate: new Date("2026-09-29"),
            endDate: new Date("2026-09-30"),
            reason: "Fever and illness",
            status: "Approved"
        },

        {
            studentId: students[2]._id,
            startDate: new Date("2026-10-05"),
            endDate: new Date("2026-10-06"),
            reason: "Family function",
            status: "Rejected"
        },

        {
            studentId: students[3]._id,
            startDate: new Date("2026-10-08"),
            endDate: new Date("2026-10-08"),
            reason: "Medical checkup",
            status: "Pending"
        },

        {
            studentId: students[4]._id,
            startDate: new Date("2026-10-15"),
            endDate: new Date("2026-10-17"),
            reason: "Travel with family",
            status: "Approved"
        },

        {
            studentId: students[5]._id,
            startDate: new Date("2026-10-20"),
            endDate: new Date("2026-10-21"),
            reason: "Personal reasons",
            status: "Pending"
        },

        {
            studentId: students[6]._id,
            startDate: new Date("2026-10-22"),
            endDate: new Date("2026-10-22"),
            reason: "Doctor appointment",
            status: "Approved"
        },

        {
            studentId: students[7]._id,
            startDate: new Date("2026-10-26"),
            endDate: new Date("2026-10-28"),
            reason: "Family emergency",
            status: "Pending"
        },

        {
            studentId: students[8]._id,
            startDate: new Date("2026-11-02"),
            endDate: new Date("2026-11-04"),
            reason: "Out of station",
            status: "Rejected"
        },

        {
            studentId: students[9]._id,
            startDate: new Date("2026-11-10"),
            endDate: new Date("2026-11-12"),
            reason: "Religious function",
            status: "Approved"
        }
    ];

    await Leave.deleteMany({});

    await Leave.insertMany(leaves);

    console.log(
        `004_seedLeaves: inserted ${leaves.length} leave applications`
    );
}