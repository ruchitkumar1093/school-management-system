import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema(
    {
        userId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },

        employeeID:{
            type: String,
            required: true,
            unique: true
        },

        department:{
            type: String,
            enum: ["Science", "Mathematics", "English", "Social Science", "Hindi"],
            required: true
        },

        classAssigned:{
            type: String,
            enum: ["1st", "2nd", "3rd", "4th", "5th", "6th",
                "7th", "8th", "9th", "10th", "11th", "12th"],
            required: true,
            trim: true
        }
    }
);

teacherSchema.index(
    { department: 1, classAssigned: 1 },
    { unique: true }
);

const Teacher = mongoose.model("Teacher", teacherSchema);
export default Teacher;