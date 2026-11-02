import mongoose, { Schema, Document, Types } from "mongoose";

export interface IFeePayment extends Document {
    feeId: Types.ObjectId;
    studentId: Types.ObjectId;
    amount: number;
    status: "pending" | "success" | "failed";

    // Used by individual payments
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    receiptNumber?: string;

    // Used by FeeTransaction-based allocations
    transactionId?: Types.ObjectId;

    // Used by CombinedFeePayment-based allocations
    combinedPaymentId?: Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}

const feePaymentSchema = new Schema<IFeePayment>(
    {
        feeId: {
            type: Schema.Types.ObjectId,
            ref: "Fee",
            required: true,
        },

        studentId: {
            type: Schema.Types.ObjectId,
            ref: "Student",
            required: true,
        },

        amount: {
            type: Number,
            required: true,
            min: [
                1,
                "Payment amount must be greater than zero",
            ],
        },

        status: {
            type: String,
            enum: ["pending", "success", "failed"],
            default: "pending",
            required: true,
        },

        // Fields used by individual Razorpay payments.
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

        // References the parent FeeTransaction.
        transactionId: {
            type: Schema.Types.ObjectId,
            ref: "FeeTransaction",
        },

        // References the parent CombinedFeePayment.
        combinedPaymentId: {
            type: Schema.Types.ObjectId,
            ref: "CombinedFeePayment",
        },
    },
    {
        timestamps: true,
    }
);

// Prevent duplicate allocations for the same fee
// within a FeeTransaction.
feePaymentSchema.index(
    {
        transactionId: 1,
        feeId: 1,
    },
    {
        unique: true,
        partialFilterExpression: {
            transactionId: {
                $exists: true,
            },
        },
        name: "unique_fee_allocation_per_transaction",
    }
);

// Prevent duplicate allocations for the same fee
// within a CombinedFeePayment.
feePaymentSchema.index(
    {
        combinedPaymentId: 1,
        feeId: 1,
    },
    {
        unique: true,
        partialFilterExpression: {
            combinedPaymentId: {
                $exists: true,
            },
        },
        name: "unique_fee_allocation_per_combined_payment",
    }
);

const FeePayment = mongoose.model<IFeePayment>(
    "FeePayment",
    feePaymentSchema
);

export default FeePayment;