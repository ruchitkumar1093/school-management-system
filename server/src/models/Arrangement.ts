import mongoose from "mongoose";

const arrangementSchema = new mongoose.Schema(
    {
        originalTeacherId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Teacher",
            required: true,
        },

        arrangedTeacherId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Teacher",
            required: true,
        },

        class: {
            type: String,
            enum: [
                "1st", "2nd", "3rd", "4th", "5th", "6th",
                "7th", "8th", "9th", "10th", "11th", "12th",
            ],
            required: true,
            trim: true,
        },

        subjectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Subject",
            required: true,
        },

        wasClassTeacher: {
            type: Boolean,
            default: false,
        },
    },
    {
        collection: "arrangements",
        timestamps: true,
    }
);

// One arrangement per original teacher, class, and subject.
arrangementSchema.index(
    {
        originalTeacherId: 1,
        class: 1,
        subjectId: 1,
    },
    { unique: true }
);

// Find arrangements by either original or replacement teacher.
arrangementSchema.index({ arrangedTeacherId: 1 });
arrangementSchema.index({ originalTeacherId: 1 });

const Arrangement = mongoose.model(
    "Arrangement",
    arrangementSchema
);

export default Arrangement;