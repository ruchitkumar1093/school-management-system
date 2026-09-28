import mongoose from "mongoose";

const holidaySchema = new mongoose.Schema(
    {
        date: {
            type: Date,
            required: true,
            unique: true
        },

        name: {
            type: String,
            required: true,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

const Holiday = mongoose.model("Holiday", holidaySchema);

export default Holiday;