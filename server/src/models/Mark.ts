import mongoose from "mongoose";

const marksSchema = new mongoose.Schema(
    {
        studentId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true
        },

        teacherId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Teacher",
            required: true
        },

        subjectId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Subject",
            required: true
        },

        exam:{
            type: String,
            enum: ["class test", "mid term", "final"]
        },

        marksObtained:{
            type: Number,
            required: true,
            trim: true
        },

        totalMarks:{
            type: Number,
            required: true,
            trim: true
        }
    }
);

marksSchema.index(
    {
        studentId: 1,
        subjectId: 1,
        exam: 1
    },
    {
        unique: true
    }
);

const Mark = mongoose.model("Mark", marksSchema);
export default Mark;