import mongoose from "mongoose";

const leaveSchema = new mongoose.Schema(
    {
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student"
        },

        teacherId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Teacher"
        },

        startDate: {
            type: Date,
            required: true
        },

        endDate: {
            type: Date,
            required: true
        },

        reason: {
            type: String,
            required: true,
            trim: true
        },

        status: {
            type: String,
            enum: ["Pending", "Approved", "Rejected"],
            default: "Pending",
            required: true
        }
    },
    {
        timestamps: true
    }
);

const Leave = mongoose.model("Leave", leaveSchema);

export default Leave;