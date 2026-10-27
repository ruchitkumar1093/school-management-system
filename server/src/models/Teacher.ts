import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },

        employeeID: {
            type: String,
            required: true,
            unique: true
        },

        isDeleted: {
            type: Boolean,
            default: false
        },

        deletedAt: {
            type: Date,
            default: null
        }
    }
);

const Teacher = mongoose.model("Teacher", teacherSchema);

export default Teacher;