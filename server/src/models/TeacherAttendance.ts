import mongoose from "mongoose";

const teacherAttendanceSchema = new mongoose.Schema(
    {
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
        },

        markedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
);

teacherAttendanceSchema.index(
    {
        teacherId: 1,
        date: 1
    },
    {
        unique: true
    }
);

const TeacherAttendance = mongoose.model(
    "TeacherAttendance",
    teacherAttendanceSchema
);

export default TeacherAttendance;