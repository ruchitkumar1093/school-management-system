import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
    {
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true
        },

        teacherId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Teacher",
            required: true
        },

        date: {
            type: Date,
            required: true
        },

        status: {
            type: String,
            enum: ["Present", "Absent"],
            required: true
        }
    }
);

attendanceSchema.index(
    {
        studentId: 1,
        date: 1
    },
    {
        unique: true
    }
);

const Attendance = mongoose.model("Attendance", attendanceSchema);

export default Attendance;