import mongoose from "mongoose";

const classSchema = new mongoose.Schema(
    {
        class: {
            type: String,
            enum: [
                "1st",
                "2nd",
                "3rd",
                "4th",
                "5th",
                "6th",
                "7th",
                "8th",
                "9th",
                "10th",
                "11th",
                "12th"
            ],
            required: true,
            unique: true
        },

        teacherId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Teacher",
            required: true
        }
    }
);

const Class = mongoose.model("Class", classSchema);

export default Class;