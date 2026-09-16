import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            enum: ["Science", "Mathematics", "English", "Social Science", "Hindi"],
            required: true
        },

        subjectCode: {
            type: String,
            required: true,
            trim: true,
            unique: true
        },

        class: {
            type: String,
            enum: ["1st", "2nd", "3rd", "4th", "5th", "6th",
                "7th", "8th", "9th", "10th", "11th", "12th"],
            required: true,
            trim: true
        }
    }
);

subjectSchema.index(
    { name: 1, class: 1 },
    { unique: true }
);

const Subject = mongoose.model("Subject", subjectSchema);
export default Subject;