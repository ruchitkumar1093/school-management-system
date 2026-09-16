import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },

        class: {
            type: String,
            enum: ["1st", "2nd", "3rd", "4th", "5th", "6th",
                "7th", "8th", "9th", "10th", "11th", "12th"],
            required: true,
            trim: true
        },
        section: {
            type: String,
            enum: ["A", "B", "C", "D"],
            trim: true
        },
        rollNumber: {
            type: Number,
            required: true,
            trim: true
        }
    }
);

const Student = mongoose.model("Student", studentSchema);
export default Student;