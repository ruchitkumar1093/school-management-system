import mongoose from "mongoose";

const arrangementSchema = new mongoose.Schema(
    {
        originalTeacherId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Teacher",
            required: true
        },

        arrangedTeacherId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Teacher",
            required: true
        },

        class: {
            type: String,
            enum: [
                "1st", "2nd", "3rd", "4th", "5th", "6th",
                "7th", "8th", "9th", "10th", "11th", "12th"
            ],
            required: true,
            trim: true
        },

        department: {
            type: String,
            enum: [
                "Science",
                "Mathematics",
                "English",
                "Social Science",
                "Hindi"
            ],
            required: true
        }
    },
    {
        collection: "arrangements",
        timestamps: true
    }
);

// Each original teacher can have only one temporary arrangement.
arrangementSchema.index(
    { originalTeacherId: 1 },
    { unique: true }
);

const Arrangement = mongoose.model("Arrangement", arrangementSchema);

export default Arrangement;