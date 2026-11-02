import mongoose, { Schema, Document, Types } from "mongoose";

export interface ICombinedFeeAllocation {
    feeId: Types.ObjectId;
    amount: number;
}

export interface ICombinedFeePayment extends Document {
    studentId: Types.ObjectId;
    allocations: ICombinedFeeAllocation[];
    totalAmount: number;
    status: "pending" | "success" | "failed";
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    receiptNumber?: string;

    createdAt: Date;
    updatedAt: Date;
}

const combinedFeeAllocationSchema =
    new Schema<ICombinedFeeAllocation>(
        {
            feeId: {
                type: Schema.Types.ObjectId,
                ref: "Fee",
                required: true,
            },
            amount: {
                type: Number,
                required: true,
                min: [
                    1,
                    "Allocation amount must be greater than zero",
                ],
            },
        },
        {
            _id: false,
        }
    );

const combinedFeePaymentSchema =
    new Schema<ICombinedFeePayment>(
        {
            studentId: {
                type: Schema.Types.ObjectId,
                ref: "Student",
                required: true,
            },

            allocations: {
                type: [combinedFeeAllocationSchema],
                required: true,
                validate: {
                    validator: (
                        allocations: ICombinedFeeAllocation[]
                    ) => allocations.length > 0,
                    message:
                        "At least one fee allocation is required.",
                },
            },

            totalAmount: {
                type: Number,
                required: true,
                min: [
                    1,
                    "Total payment must be greater than zero",
                ],
            },

            status: {
                type: String,
                enum: ["pending", "success", "failed"],
                default: "pending",
                required: true,
            },

            razorpayOrderId: {
                type: String,
                unique: true,
                sparse: true,
            },

            razorpayPaymentId: {
                type: String,
                sparse: true,
            },

            razorpaySignature: {
                type: String,
                select: false,
            },

            receiptNumber: {
                type: String,
                unique: true,
                sparse: true,
            },
        },
        {
            timestamps: true,
        }
    );

const CombinedFeePayment =
    mongoose.model<ICombinedFeePayment>(
        "CombinedFeePayment",
        combinedFeePaymentSchema
    );

export default CombinedFeePayment;