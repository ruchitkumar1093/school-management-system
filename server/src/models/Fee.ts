import mongoose, { Schema, Document, Types } from "mongoose";

export type FeeType = "Tuition Fee" | "Examination Fee";

export const validFeeClasses = [
    "1st", "2nd", "3rd", "4th", "5th", "6th",
    "7th", "8th", "9th", "10th", "11th", "12th",
] as const;

export interface IFee extends Document {
    feeType: FeeType;
    class: string | null;
    amount: number;
    dueDate: Date;
    createdBy: Types.ObjectId;
}

const feeSchema = new Schema<IFee>(
    {
        feeType: {
            type: String,
            enum: ["Tuition Fee", "Examination Fee"],
            required: true,
        },

        class: {
            type: String,
            enum: [...validFeeClasses, null],
            default: null
        },

        amount: {
            type: Number,
            required: true,
            min: [1, "Fee amount must be greater than zero"],
        },

        dueDate: {
            type: Date,
            required: true,
        },

        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Only one tuition fee per class.
feeSchema.index(
    { class: 1 },
    {
        unique: true,
        partialFilterExpression: {
            feeType: "Tuition Fee",
        },
        name: "unique_tuition_fee_per_class",
    }
);

// Only one examination fee for the entire school.
feeSchema.index(
    { feeType: 1 },
    {
        unique: true,
        partialFilterExpression: {
            feeType: "Examination Fee",
        },
        name: "unique_school_examination_fee",
    }
);

// Enforce the relationship between fee type and class.
feeSchema.pre("validate", function () {
    if (this.feeType === "Tuition Fee" && !this.class) {
        this.invalidate(
            "class",
            "A class is required for tuition fees."
        );
    }

    if (this.feeType === "Examination Fee" && this.class !== null) {
        this.invalidate(
            "class",
            "The examination fee must apply to the entire school."
        );
    }
});

const Fee = mongoose.model<IFee>("Fee", feeSchema);

export default Fee;