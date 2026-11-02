import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import crypto from "crypto";
import Razorpay from "razorpay";
import CombinedFeePayment from "../models/CombinedFeePayment";
import FeePayment from "../models/FeePayment";
import Fee, { IFee } from "../models/Fee";
import Student from "../models/Student";
import PDFDocument from "pdfkit";

const VALID_CLASSES = [
    "1st", "2nd", "3rd", "4th", "5th", "6th",
    "7th", "8th", "9th", "10th", "11th", "12th",
] as const;

type FeeType = "Tuition Fee" | "Examination Fee";

const VALID_FEE_TYPES: FeeType[] = [
    "Tuition Fee",
    "Examination Fee",
];

const isValidDate = (value: unknown): value is string => {
    if (typeof value !== "string" || !value.trim()) {
        return false;
    }

    return !Number.isNaN(new Date(value).getTime());
};

const getFeeType = (value: unknown): FeeType | null => {
    if (
        typeof value === "string" &&
        VALID_FEE_TYPES.includes(value as FeeType)
    ) {
        return value as FeeType;
    }

    return null;
};

const getPaymentSummary = async (
    feeId: mongoose.Types.ObjectId,
    studentId?: mongoose.Types.ObjectId
): Promise<number> => {
    const query: {
        feeId: mongoose.Types.ObjectId;
        status: "success";
        studentId?: mongoose.Types.ObjectId;
    } = {
        feeId,
        status: "success",
    };

    if (studentId) {
        query.studentId = studentId;
    }

    const payments = await FeePayment.find(query).select("amount");

    return payments.reduce(
        (total, payment) => total + payment.amount,
        0
    );
};

const getPaymentStatus = (
    amount: number,
    totalPaid: number
): "Unpaid" | "Partially Paid" | "Paid" => {
    if (totalPaid >= amount) return "Paid";
    if (totalPaid > 0) return "Partially Paid";
    return "Unpaid";
};

/**
 * Converts a submitted amount into a valid positive number.
 * Accepts numeric form values as either numbers or numeric strings.
 */
const parseAmount = (value: unknown): number | null => {
    if (
        value === undefined ||
        value === null ||
        value === "" ||
        (typeof value !== "number" && typeof value !== "string")
    ) {
        return null;
    }

    const amount = Number(value);

    if (!Number.isFinite(amount) || amount <= 0) {
        return null;
    }

    // Currency amounts should have no more than two decimal places.
    if (Math.round(amount * 100) !== amount * 100) {
        return null;
    }

    return amount;
};

/**
 * Returns the fee configurations applicable to a student.
 * Tuition is specific to the student's class.
 * Examination fees apply to the entire school.
 */
const getApplicableFeeQuery = (studentClass: string) => ({
    $or: [
        {
            feeType: "Tuition Fee",
            class: studentClass,
        },
        {
            feeType: "Examination Fee",
            class: null,
        },
    ],
});

/**
 * Handles MongoDB duplicate-key errors from the unique indexes.
 */
const isDuplicateKeyError = (
    error: unknown
): error is { code: number; keyPattern?: Record<string, unknown> } => {
    return (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: number }).code === 11000
    );
};

/*
|--------------------------------------------------------------------------
| PRINCIPAL CONTROLLERS
|--------------------------------------------------------------------------
*/

export const createFee = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        // IMPORTANT: These names match the current Fee model and frontend.
        const { feeType: submittedFeeType, class: submittedClass, dueDate } =
            req.body;

        const feeType = getFeeType(submittedFeeType);

        if (!feeType) {
            return res.status(400).json({
                message:
                    "Fee type must be either Tuition Fee or Examination Fee",
            });
        }

        const amount = parseAmount(req.body.amount);

        if (amount === null) {
            return res.status(400).json({
                message:
                    "Amount must be a valid number greater than zero with at most two decimal places",
            });
        }

        if (!isValidDate(dueDate)) {
            return res.status(400).json({
                message: "A valid due date is required",
            });
        }

        let normalizedClass: string | null = null;

        if (feeType === "Tuition Fee") {
            if (
                typeof submittedClass !== "string" ||
                !VALID_CLASSES.includes(
                    submittedClass as (typeof VALID_CLASSES)[number]
                )
            ) {
                return res.status(400).json({
                    message: "A valid class is required for a tuition fee",
                });
            }

            normalizedClass = submittedClass;
        }

        if (
            feeType === "Examination Fee" &&
            submittedClass !== null &&
            submittedClass !== undefined &&
            submittedClass !== ""
        ) {
            return res.status(400).json({
                message:
                    "An examination fee applies to the entire school. Its class must be null.",
            });
        }

        const createdBy = req.user?.userId;

        if (!createdBy) {
            return res.status(401).json({
                message: "Authentication required",
            });
        }

        const duplicateQuery =
            feeType === "Tuition Fee"
                ? {
                    feeType: "Tuition Fee" as const,
                    class: normalizedClass,
                }
                : {
                    feeType: "Examination Fee" as const,
                    class: null,
                };

        const existingFee = await Fee.findOne(duplicateQuery);

        if (existingFee) {
            return res.status(409).json({
                message:
                    feeType === "Tuition Fee"
                        ? `A tuition fee already exists for Class ${normalizedClass}. Edit the existing configuration instead.`
                        : "The school-wide examination fee already exists. Edit the existing configuration instead.",
            });
        }

        const fee = await Fee.create({
            feeType,
            class: normalizedClass,
            amount,
            dueDate: new Date(dueDate),
            createdBy,
        });

        const populatedFee = await Fee.findById(fee._id).populate(
            "createdBy",
            "name uid"
        );

        return res.status(201).json({
            message: "Fee created successfully",
            fee: populatedFee,
        });
    } catch (error) {
        if (isDuplicateKeyError(error)) {
            return res.status(409).json({
                message:
                    "This fee configuration already exists. Each class can have only one tuition fee, and the school can have only one examination fee.",
            });
        }

        if (
            error instanceof mongoose.Error &&
            error.name === "ValidationError"
        ) {
            return res.status(400).json({
                message: error.message,
            });
        }

        next(error);
    }
};

/**
 * Retrieve all fee configurations.
 *
 * These are shared configurations, not individual student balances.
 * Payment totals and balances are calculated separately for each student.
 */
export const getFees = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const fees = await Fee.find()
            .populate("createdBy", "name uid")
            .sort({ feeType: 1, class: 1 });

        return res.status(200).json({
            message: "Fees retrieved successfully",
            fees,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Retrieve one fee configuration.
 */
export const getFeeById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const feeId = req.params.feeId;

        if (
            typeof feeId !== "string" ||
            !mongoose.Types.ObjectId.isValid(feeId)
        ) {
            return res.status(400).json({
                message: "Invalid fee ID",
            });
        }

        const fee = await Fee.findById(feeId).populate(
            "createdBy",
            "name uid"
        );

        if (!fee) {
            return res.status(404).json({
                message: "Fee not found",
            });
        }

        return res.status(200).json({
            message: "Fee retrieved successfully",
            fee,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update an existing fee configuration.
 * Its fee type and class are fixed after creation.
 */
export const updateFee = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const feeId = req.params.feeId;
        const { amount: submittedAmount, dueDate } = req.body;

        // Validate fee ID
        if (
            typeof feeId !== "string" ||
            !mongoose.Types.ObjectId.isValid(feeId)
        ) {
            return res.status(400).json({
                message: "Invalid fee ID",
            });
        }

        // Find existing fee
        const fee = await Fee.findById(feeId);

        if (!fee) {
            return res.status(404).json({
                message: "Fee not found",
            });
        }

        // Prevent changing fee type or assigned class
        if (
            req.body.feeType !== undefined ||
            req.body.class !== undefined ||
            req.body.type !== undefined ||
            req.body.className !== undefined
        ) {
            return res.status(400).json({
                message:
                    "A fee's type and class cannot be changed. Edit only its amount or due date.",
            });
        }

        // Update amount if provided
        if (submittedAmount !== undefined) {
            const amount = parseAmount(submittedAmount);

            if (amount === null) {
                return res.status(400).json({
                    message:
                        "Amount must be a valid number greater than zero with at most two decimal places",
                });
            }

            // Check individual payments that are pending or successful
            const existingIndividualPayment = await FeePayment.exists({
                feeId: fee._id,
                status: {
                    $in: ["pending", "success"],
                },
            });

            // Check combined payments that are pending or successful
            const existingCombinedPayment =
                await CombinedFeePayment.exists({
                    "allocations.feeId": fee._id,
                    status: {
                        $in: ["pending", "success"],
                    },
                });

            // Prevent amount changes if a pending or completed payment exists
            if (
                existingIndividualPayment ||
                existingCombinedPayment
            ) {
                return res.status(400).json({
                    message:
                        "Cannot change the fee amount because a pending or completed payment exists for this fee.",
                });
            }

            fee.amount = amount;
        }

        // Update due date if provided
        if (dueDate !== undefined) {
            if (!isValidDate(dueDate)) {
                return res.status(400).json({
                    message: "A valid due date is required",
                });
            }

            fee.dueDate = new Date(dueDate);
        }

        // Save changes
        await fee.save();

        // Fetch updated fee with principal details
        const updatedFee = await Fee.findById(fee._id).populate(
            "createdBy",
            "name uid"
        );

        return res.status(200).json({
            message: "Fee updated successfully",
            fee: updatedFee,
        });
    } catch (error) {
        // Handle duplicate fee configuration
        if (isDuplicateKeyError(error)) {
            return res.status(409).json({
                message: "This fee configuration already exists.",
            });
        }

        // Handle Mongoose validation errors
        if (
            error instanceof mongoose.Error &&
            error.name === "ValidationError"
        ) {
            return res.status(400).json({
                message: error.message,
            });
        }

        next(error);
    }
};

/**
 * Delete a fee configuration only when no payment records exist.
 */
export const deleteFee = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const feeId = req.params.feeId;

        if (
            typeof feeId !== "string" ||
            !mongoose.Types.ObjectId.isValid(feeId)
        ) {
            return res.status(400).json({
                message: "Invalid fee ID",
            });
        }

        const fee = await Fee.findById(feeId);

        if (!fee) {
            return res.status(404).json({
                message: "Fee not found",
            });
        }

        const existingPayment = await FeePayment.exists({
            feeId: fee._id,
        });

        if (existingPayment) {
            return res.status(400).json({
                message:
                    "Cannot delete this fee because payment records exist for it.",
            });
        }

        await Fee.findByIdAndDelete(fee._id);

        return res.status(200).json({
            message: "Fee deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};

/*
|--------------------------------------------------------------------------
| STUDENT CONTROLLERS
|--------------------------------------------------------------------------
*/

export const getMyFees = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                message: "Authentication required",
            });
        }

        const student = await Student.findOne({
            userId,
            isDeleted: false,
        });

        if (!student) {
            return res.status(404).json({
                message: "Student record not found",
            });
        }

        const fees = await Fee.find(
            getApplicableFeeQuery(student.class) as any
        )
            .populate("createdBy", "name uid")
            .sort({ dueDate: 1 });

        const feeDetails = await Promise.all(
            fees.map(async (fee) => {
                const totalPaid = await getPaymentSummary(
                    fee._id,
                    student._id
                );

                return {
                    ...fee.toObject(),
                    totalPaid,
                    balance: Math.max(0, fee.amount - totalPaid),
                    paymentStatus: getPaymentStatus(
                        fee.amount,
                        totalPaid
                    ),
                };
            })
        );

        return res.status(200).json({
            message: "Your fees retrieved successfully",
            fees: feeDetails,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Retrieve a single fee only if it applies to the logged-in student.
 */
export const getMyFeeById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.userId;
        const feeIdParam = req.params.feeId;
        const feeId = Array.isArray(feeIdParam)
            ? feeIdParam[0]
            : feeIdParam;

        if (!userId) {
            return res.status(401).json({
                message: "Authentication required",
            });
        }

        if (
            !feeId ||
            !mongoose.Types.ObjectId.isValid(feeId)
        ) {
            return res.status(400).json({
                message: "Invalid fee ID",
            });
        }

        const student = await Student.findOne({
            userId,
            isDeleted: false,
        });

        if (!student) {
            return res.status(404).json({
                message: "Student record not found",
            });
        }

        const fee = await Fee.findById(feeId).populate(
            "createdBy",
            "name uid"
        );

        if (!fee) {
            return res.status(404).json({
                message: "Fee not found",
            });
        }

        const isApplicable =
            (fee.feeType === "Tuition Fee" &&
                fee.class === student.class) ||
            (fee.feeType === "Examination Fee" &&
                fee.class === null);

        if (!isApplicable) {
            return res.status(404).json({
                message: "Fee not found",
            });
        }

        const totalPaid = await getPaymentSummary(
            fee._id,
            student._id
        );

        return res.status(200).json({
            message: "Fee details retrieved successfully",
            fee: {
                ...fee.toObject(),
                totalPaid,
                balance: Math.max(0, fee.amount - totalPaid),
                paymentStatus: getPaymentStatus(
                    fee.amount,
                    totalPaid
                ),
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create a Razorpay order for the logged-in student's outstanding balance.
 */
export const createPaymentOrder = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.userId;
        const feeIdParam = req.params.feeId;
        const feeId = Array.isArray(feeIdParam)
            ? feeIdParam[0]
            : feeIdParam;

        if (!userId) {
            return res.status(401).json({
                message: "Authentication required",
            });
        }

        if (
            !feeId ||
            !mongoose.Types.ObjectId.isValid(feeId)
        ) {
            return res.status(400).json({
                message: "Invalid fee ID",
            });
        }

        const student = await Student.findOne({
            userId,
            isDeleted: false,
        });

        if (!student) {
            return res.status(404).json({
                message: "Student record not found",
            });
        }

        const feeFilter: mongoose.QueryFilter<IFee> = {
            _id: new mongoose.Types.ObjectId(feeId),
            $or: [
                {
                    feeType: "Tuition Fee",
                    class: student.class,
                },
                {
                    feeType: "Examination Fee",
                    class: null,
                },
            ],
        };

        const fee = await Fee.findOne(feeFilter);

        if (!fee) {
            return res.status(404).json({
                message: "Fee not found",
            });
        }

        const totalPaid = await getPaymentSummary(
            fee._id,
            student._id
        );

        const outstandingBalance = Math.max(
            0,
            Math.round((fee.amount - totalPaid) * 100) / 100
        );

        if (outstandingBalance <= 0) {
            return res.status(400).json({
                message: "This fee has already been paid in full.",
            });
        }

        // If amount is omitted, default to the full outstanding balance.
        const requestedAmount =
            req.body.amount === undefined
                ? outstandingBalance
                : parseAmount(req.body.amount);

        if (requestedAmount === null) {
            return res.status(400).json({
                message:
                    "Payment amount must be greater than zero and have at most two decimal places.",
            });
        }

        if (requestedAmount > outstandingBalance) {
            return res.status(400).json({
                message: `Payment amount cannot exceed the outstanding balance of ₹${outstandingBalance.toFixed(2)}.`,
                outstandingBalance,
            });
        }

        const amountInPaise = Math.round(
            requestedAmount * 100
        );

        if (
            !Number.isSafeInteger(amountInPaise) ||
            amountInPaise <= 0
        ) {
            return res.status(400).json({
                message: "Invalid payment amount",
            });
        }

        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!keyId || !keySecret) {
            throw new Error(
                "Razorpay configuration is missing. Check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET."
            );
        }

        const razorpay = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });

        const order = await razorpay.orders.create({
            amount: amountInPaise,
            currency: "INR",
            receipt: `fee_${Date.now()}`,
            notes: {
                feeId: fee._id.toString(),
                studentId: student._id.toString(),
            },
        });

        const payment = await FeePayment.create({
            feeId: fee._id,
            studentId: student._id,
            amount: requestedAmount,
            status: "pending",
            razorpayOrderId: order.id,
        });

        return res.status(201).json({
            message: "Payment order created successfully",
            paymentId: payment._id,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId,
            outstandingBalance,
            remainingBalanceAfterPayment: Math.max(
                0,
                Math.round(
                    (outstandingBalance - requestedAmount) * 100
                ) / 100
            ),
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Verify Razorpay signature and confirm the payment was captured.
 */
export const verifyPayment = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.userId;

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        } = req.body;

        if (!userId) {
            return res.status(401).json({
                message: "Authentication required",
            });
        }

        if (
            typeof razorpay_order_id !== "string" ||
            !razorpay_order_id ||
            typeof razorpay_payment_id !== "string" ||
            !razorpay_payment_id ||
            typeof razorpay_signature !== "string" ||
            !razorpay_signature
        ) {
            return res.status(400).json({
                message: "Payment verification details are required",
            });
        }

        const student = await Student.findOne({
            userId,
            isDeleted: false,
        });

        if (!student) {
            return res.status(404).json({
                message: "Student record not found",
            });
        }

        const payment = await FeePayment.findOne({
            studentId: student._id,
            razorpayOrderId: razorpay_order_id,
        });

        if (!payment) {
            return res.status(404).json({
                message: "Payment order not found",
            });
        }

        if (payment.status === "success") {
            if (
                payment.razorpayPaymentId === razorpay_payment_id
            ) {
                return res.status(200).json({
                    message: "Payment has already been verified",
                    payment,
                });
            }

            return res.status(409).json({
                message:
                    "This order has already been verified with another payment.",
            });
        }

        if (payment.status !== "pending") {
            return res.status(400).json({
                message: "This payment is not pending",
            });
        }

        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!keyId || !keySecret) {
            throw new Error("Razorpay configuration is missing");
        }

        const expectedSignature = crypto
            .createHmac("sha256", keySecret)
            .update(
                `${razorpay_order_id}|${razorpay_payment_id}`
            )
            .digest("hex");

        const expectedBuffer = Buffer.from(
            expectedSignature,
            "hex"
        );

        const signatureIsHex =
            /^[a-f0-9]{64}$/i.test(razorpay_signature);

        if (!signatureIsHex) {
            return res.status(400).json({
                message: "Invalid payment signature",
            });
        }

        const receivedBuffer = Buffer.from(
            razorpay_signature,
            "hex"
        );

        const signatureIsValid =
            expectedBuffer.length === receivedBuffer.length &&
            crypto.timingSafeEqual(
                expectedBuffer,
                receivedBuffer
            );

        if (!signatureIsValid) {
            return res.status(400).json({
                message: "Invalid payment signature",
            });
        }

        const razorpay = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });

        const [order, razorpayPayment] = await Promise.all([
            razorpay.orders.fetch(razorpay_order_id),
            razorpay.payments.fetch(razorpay_payment_id),
        ]);

        if (
            razorpayPayment.order_id !== razorpay_order_id ||
            order.id !== razorpay_order_id
        ) {
            return res.status(400).json({
                message:
                    "Payment does not match the expected order.",
            });
        }

        const expectedAmountInPaise = Math.round(
            payment.amount * 100
        );

        if (
            order.amount !== expectedAmountInPaise ||
            razorpayPayment.amount !== expectedAmountInPaise ||
            order.currency !== "INR" ||
            razorpayPayment.currency !== "INR"
        ) {
            return res.status(400).json({
                message:
                    "Payment amount or currency does not match.",
            });
        }

        if (razorpayPayment.status !== "captured") {
            return res.status(400).json({
                message:
                    "Payment has not been captured successfully.",
                paymentStatus: razorpayPayment.status,
            });
        }

        const receiptNumber = `FEE-${Date.now()}-${payment._id
            .toString()
            .slice(-6)
            .toUpperCase()}`;

        payment.status = "success";
        payment.razorpayPaymentId = razorpay_payment_id;
        payment.razorpaySignature = razorpay_signature;
        payment.receiptNumber = receiptNumber;

        await payment.save();

        return res.status(200).json({
            message: "Payment verified successfully",
            payment,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Retrieve the logged-in student's payment history.
 */
export const getMyPaymentHistory = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                message: "Authentication required",
            });
        }

        const student = await Student.findOne({
            userId,
            isDeleted: false,
        });

        if (!student) {
            return res.status(404).json({
                message: "Student record not found",
            });
        }

        // Fetch individual payments only.
        // Combined payment allocations are excluded because
        // the combined transaction is fetched separately below.
        const individualPayments = await FeePayment.find({
            studentId: student._id,
            combinedPaymentId: { $exists: false },
        })
            .populate({
                path: "feeId",
                select: "feeType class amount dueDate",
            })
            .sort({ createdAt: -1 })
            .lean();

        // Fetch combined transactions, including their fee breakdown.
        const combinedPayments = await CombinedFeePayment.find({
            studentId: student._id,
        })
            .populate({
                path: "allocations.feeId",
                select: "feeType class amount dueDate",
            })
            .sort({ createdAt: -1 })
            .lean();

        // Normalize individual payments.
        const individualHistory = individualPayments.map((payment) => {
            const fee = payment.feeId as unknown as {
                _id: mongoose.Types.ObjectId;
                feeType: string;
                class: string | null;
                amount: number;
                dueDate: Date;
            } | null;

            return {
                _id: payment._id,
                paymentType: "individual" as const,
                amount: payment.amount,
                status: payment.status,
                receiptNumber: payment.receiptNumber ?? null,
                paymentId: payment.razorpayPaymentId ?? null,
                date: payment.createdAt ?? payment._id.getTimestamp(),
                feeDescription: fee
                    ? `${fee.feeType}${fee.class ? ` - Class ${fee.class}` : ""}`
                    : "Fee payment",
                fees: fee
                    ? [
                        {
                            feeType: fee.feeType,
                            className: fee.class ?? "School-wide",
                            amount: payment.amount,
                        },
                    ]
                    : [],
            };
        });

        // Normalize combined payments into one row per transaction.
        const combinedHistory = combinedPayments.map((payment) => {
            const fees = payment.allocations.map((allocation) => {
                const fee = allocation.feeId as unknown as {
                    _id: mongoose.Types.ObjectId;
                    feeType: string;
                    class: string | null;
                    amount: number;
                    dueDate: Date;
                } | null;

                return {
                    feeType: fee?.feeType ?? "Fee",
                    className: fee?.class ?? "School-wide",
                    amount: allocation.amount,
                };
            });

            return {
                _id: payment._id,
                paymentType: "combined" as const,
                amount: payment.totalAmount,
                status: payment.status,
                receiptNumber: payment.receiptNumber ?? null,
                paymentId: payment.razorpayPaymentId ?? null,
                date: payment.createdAt ?? payment._id.getTimestamp(),
                feeDescription: fees
                    .map((fee) => fee.feeType)
                    .join(", "),
                fees,
            };
        });

        const payments = [
            ...individualHistory,
            ...combinedHistory,
        ].sort(
            (a, b) =>
                b.date.getTime() - a.date.getTime()
        );

        return res.status(200).json({
            message: "Payment history retrieved successfully",
            payments,
        });
    } catch (error) {
        next(error);
    }
};

export const createCombinedPaymentOrder = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                message: "Authentication required",
            });
        }

        const student = await Student.findOne({
            userId,
            isDeleted: false,
        });

        if (!student) {
            return res.status(404).json({
                message: "Student record not found",
            });
        }

        const feeFilter = {
            $or: [
                {
                    feeType: "Tuition Fee",
                    class: student.class,
                },
                {
                    feeType: "Examination Fee",
                    class: null,
                },
            ],
        } as mongoose.QueryFilter<IFee>;

        const fees = await Fee.find(feeFilter).sort({
            dueDate: 1,
        });

        if (fees.length === 0) {
            return res.status(404).json({
                message: "No applicable fees were found.",
            });
        }

        const outstandingByFeeId = new Map<
            string,
            {
                feeId: mongoose.Types.ObjectId;
                balance: number;
            }
        >();

        for (const fee of fees) {
            const totalPaid = await getPaymentSummary(
                fee._id,
                student._id
            );

            const balance = Math.max(
                0,
                Math.round((fee.amount - totalPaid) * 100) / 100
            );

            if (balance > 0) {
                outstandingByFeeId.set(fee._id.toString(), {
                    feeId: fee._id,
                    balance,
                });
            }
        }

        if (outstandingByFeeId.size === 0) {
            return res.status(400).json({
                message: "You have no outstanding fees to pay.",
            });
        }

        const submittedAllocations = req.body.allocations;

        let allocations: {
            feeId: mongoose.Types.ObjectId;
            amount: number;
        }[];

        // Backward compatibility: no allocations means pay all balances.
        if (submittedAllocations === undefined) {
            allocations = Array.from(
                outstandingByFeeId.values()
            ).map((item) => ({
                feeId: item.feeId,
                amount: item.balance,
            }));
        } else {
            if (
                !Array.isArray(submittedAllocations) ||
                submittedAllocations.length === 0
            ) {
                return res.status(400).json({
                    message:
                        "Allocations must be a non-empty array.",
                });
            }

            const seenFeeIds = new Set<string>();

            allocations = [];

            for (const submitted of submittedAllocations) {
                if (
                    !submitted ||
                    typeof submitted.feeId !== "string" ||
                    !mongoose.Types.ObjectId.isValid(
                        submitted.feeId
                    )
                ) {
                    return res.status(400).json({
                        message: "Each allocation must contain a valid feeId.",
                    });
                }

                const feeIdString = submitted.feeId;

                if (seenFeeIds.has(feeIdString)) {
                    return res.status(400).json({
                        message:
                            "Duplicate fee IDs are not allowed in allocations.",
                    });
                }

                seenFeeIds.add(feeIdString);

                const outstanding =
                    outstandingByFeeId.get(feeIdString);

                if (!outstanding) {
                    return res.status(400).json({
                        message:
                            "One or more selected fees are not applicable or have no outstanding balance.",
                    });
                }

                const amount = parseAmount(submitted.amount);

                if (amount === null) {
                    return res.status(400).json({
                        message:
                            "Each allocation amount must be greater than zero and have at most two decimal places.",
                    });
                }

                if (amount > outstanding.balance) {
                    return res.status(400).json({
                        message:
                            `Allocation for fee ${feeIdString} cannot exceed its outstanding balance of ₹${outstanding.balance.toFixed(2)}.`,
                    });
                }

                allocations.push({
                    feeId: outstanding.feeId,
                    amount,
                });
            }
        }

        if (allocations.length === 0) {
            return res.status(400).json({
                message: "No valid fee allocations were provided.",
            });
        }

        const totalAmountInPaise = allocations.reduce(
            (total, allocation) =>
                total + Math.round(allocation.amount * 100),
            0
        );

        if (
            !Number.isSafeInteger(totalAmountInPaise) ||
            totalAmountInPaise <= 0
        ) {
            return res.status(400).json({
                message: "Invalid combined payment amount.",
            });
        }

        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!keyId || !keySecret) {
            throw new Error(
                "Razorpay configuration is missing."
            );
        }

        const razorpay = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });

        const order = await razorpay.orders.create({
            amount: totalAmountInPaise,
            currency: "INR",
            receipt: `combined_fee_${Date.now()}`,
            notes: {
                studentId: student._id.toString(),
                paymentType: "combined_fee",
            },
        });

        const combinedPayment =
            await CombinedFeePayment.create({
                studentId: student._id,
                allocations,
                totalAmount: totalAmountInPaise / 100,
                status: "pending",
                razorpayOrderId: order.id,
            });

        return res.status(201).json({
            message:
                "Combined payment order created successfully",
            combinedPaymentId: combinedPayment._id,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId,
            allocations,
        });
    } catch (error) {
        next(error);
    }
};


export const verifyCombinedPayment = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        } = req.body;

        // 1. Validate the Razorpay response.
        if (
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature
        ) {
            return res.status(400).json({
                message:
                    "Missing Razorpay payment verification details.",
            });
        }

        // 2. Find the authenticated student.
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                message: "Authentication required.",
            });
        }

        const student = await Student.findOne({
            userId,
            isDeleted: false,
        });

        if (!student) {
            return res.status(404).json({
                message: "Student record not found.",
            });
        }

        // 3. Find the combined payment belonging to this student.
        const combinedPayment =
            await CombinedFeePayment.findOne({
                studentId: student._id,
                razorpayOrderId: razorpay_order_id,
            });

        if (!combinedPayment) {
            return res.status(404).json({
                message:
                    "Combined payment transaction not found.",
            });
        }

        // 4. Verify the Razorpay signature.
        const secret = process.env.RAZORPAY_KEY_SECRET;
        const keyId = process.env.RAZORPAY_KEY_ID;

        if (!secret || !keyId) {
            throw new Error(
                "Razorpay configuration is missing."
            );
        }

        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(
                `${razorpay_order_id}|${razorpay_payment_id}`
            )
            .digest("hex");

        const receivedSignature =
            String(razorpay_signature);

        const expectedBuffer = Buffer.from(
            expectedSignature,
            "hex"
        );

        const receivedBuffer = Buffer.from(
            receivedSignature,
            "hex"
        );

        const signatureIsValid =
            /^[a-f0-9]{64}$/i.test(receivedSignature) &&
            expectedBuffer.length === receivedBuffer.length &&
            crypto.timingSafeEqual(
                expectedBuffer,
                receivedBuffer
            );

        if (!signatureIsValid) {
            return res.status(400).json({
                message: "Invalid Razorpay payment signature.",
            });
        }

        // 5. Handle repeated verification requests.
        if (combinedPayment.status === "success") {
            // The order must not be accepted with a different payment.
            if (
                combinedPayment.razorpayPaymentId !==
                razorpay_payment_id
            ) {
                return res.status(400).json({
                    message:
                        "This order has already been verified with another payment.",
                });
            }

            return res.status(200).json({
                message:
                    "Payment has already been verified.",
                combinedPaymentId: combinedPayment._id,
                receiptNumber:
                    combinedPayment.receiptNumber,
            });
        }

        if (combinedPayment.status === "failed") {
            return res.status(400).json({
                message:
                    "This combined payment has failed.",
            });
        }

        // 6. Verify the order and payment directly with Razorpay.
        const razorpay = new Razorpay({
            key_id: keyId,
            key_secret: secret,
        });

        const [order, payment] = await Promise.all([
            razorpay.orders.fetch(razorpay_order_id),
            razorpay.payments.fetch(razorpay_payment_id),
        ]);

        // Confirm the payment belongs to the expected order.
        if (
            order.id !== combinedPayment.razorpayOrderId ||
            payment.order_id !==
            combinedPayment.razorpayOrderId
        ) {
            return res.status(400).json({
                message:
                    "Payment does not belong to this transaction.",
            });
        }

        // 7. Validate the total and allocation amounts.
        const expectedAmountInPaise = Math.round(
            combinedPayment.totalAmount * 100
        );

        const allocationsTotalInPaise =
            combinedPayment.allocations.reduce(
                (total, allocation) =>
                    total +
                    Math.round(allocation.amount * 100),
                0
            );

        if (
            !Number.isSafeInteger(expectedAmountInPaise) ||
            expectedAmountInPaise <= 0 ||
            allocationsTotalInPaise !==
            expectedAmountInPaise ||
            Number(order.amount) !==
            expectedAmountInPaise ||
            Number(payment.amount) !==
            expectedAmountInPaise ||
            order.currency !== "INR" ||
            payment.currency !== "INR"
        ) {
            return res.status(400).json({
                message:
                    "Payment amount or currency does not match.",
            });
        }

        // 8. Only accept a captured payment.
        if (payment.status !== "captured") {
            return res.status(400).json({
                message:
                    "Payment has not been captured successfully.",
            });
        }

        for (const allocation of combinedPayment.allocations) {
            await FeePayment.updateOne(
                {
                    combinedPaymentId: combinedPayment._id,
                    feeId: allocation.feeId,
                },
                {
                    $setOnInsert: {
                        combinedPaymentId:
                            combinedPayment._id,
                        feeId: allocation.feeId,
                        studentId: student._id,
                        amount: allocation.amount,
                        status: "success",
                    },
                },
                {
                    upsert: true,
                    runValidators: true,
                }
            );
        }

        combinedPayment.status = "success";

        combinedPayment.razorpayPaymentId =
            razorpay_payment_id;

        combinedPayment.razorpaySignature =
            razorpay_signature;

        combinedPayment.receiptNumber ??=
            `FEE-${Date.now()}-${combinedPayment._id
                .toString()
                .slice(-6)}`;

        await combinedPayment.save();

        return res.status(200).json({
            message:
                "Combined fee payment verified successfully.",
            combinedPaymentId: combinedPayment._id,
            receiptNumber:
                combinedPayment.receiptNumber,
        });
    } catch (error) {
        next(error);
    }
};


//Reciept PDF:
type ReceiptStudent = {
    name: string;
    uid: string;
    className: string;
};

type ReceiptItem = {
    feeType: string;
    className: string;
    amount: number;
};

type ReceiptDetails = {
    receiptNumber: string;
    student: ReceiptStudent;
    items: ReceiptItem[];
    totalAmount: number;
    paymentId: string;
    paymentDate: Date;
};

const generateFeeReceipt = (
    res: Response,
    receipt: ReceiptDetails
) => {
    const doc = new PDFDocument({
        size: "A4",
        margins: {
            top: 50,
            bottom: 50,
            left: 50,
            right: 50,
        },
    });

    const filename = `${receipt.receiptNumber}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
    );

    doc.pipe(res);

    // Header
    doc
        .fontSize(22)
        .font("Helvetica-Bold")
        .text("SCHOOL FEE RECEIPT", {
            align: "center",
        });

    doc.moveDown(0.5);

    doc
        .fontSize(10)
        .font("Helvetica")
        .text("Payment receipt", {
            align: "center",
        });

    doc.moveDown(1.5);

    // Receipt information
    doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .text("Receipt Details");

    doc.moveDown(0.5);

    doc.font("Helvetica").fontSize(10);

    doc.text(`Receipt Number: ${receipt.receiptNumber}`);
    doc.text(`Payment ID: ${receipt.paymentId}`);
    doc.text(
        `Payment Date: ${receipt.paymentDate.toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        })}`
    );
    doc.text("Payment Status: SUCCESS");

    doc.moveDown(1);

    // Student information
    doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .text("Student Details");

    doc.moveDown(0.5);

    doc.font("Helvetica").fontSize(10);
    doc.text(`Student Name: ${receipt.student.name}`);
    doc.text(`Student UID: ${receipt.student.uid}`);
    doc.text(`Class: ${receipt.student.className}`);

    doc.moveDown(1.5);

    // Fee breakdown table
    const left = 50;
    const right = 545;
    const amountX = 430;
    let y = doc.y;

    doc
        .rect(left, y, right - left, 28)
        .fill("#E8EEF7");

    doc
        .fillColor("#111827")
        .font("Helvetica-Bold")
        .fontSize(10);

    doc.text("Fee Description", left + 10, y + 9);
    doc.text("Amount (INR)", amountX, y + 9, {
        width: 105,
        align: "right",
    });

    y += 28;

    doc.font("Helvetica").fontSize(10);

    for (const item of receipt.items) {
        const description =
            item.className === "School-wide"
                ? item.feeType
                : `${item.feeType} - Class ${item.className}`;

        doc
            .moveTo(left, y)
            .lineTo(right, y)
            .strokeColor("#D1D5DB")
            .stroke();

        doc
            .fillColor("#111827")
            .text(description, left + 10, y + 10, {
                width: 320,
            });

        doc.text(
            item.amount.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }),
            amountX,
            y + 10,
            {
                width: 105,
                align: "right",
            }
        );

        y += 35;
    }

    doc
        .moveTo(left, y)
        .lineTo(right, y)
        .strokeColor("#D1D5DB")
        .stroke();

    y += 12;

    doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .text("Total Paid", left + 10, y);

    doc.text(
        `Rs. ${receipt.totalAmount.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`,
        amountX,
        y,
        {
            width: 105,
            align: "right",
        }
    );

    doc.moveDown(3);

    doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#4B5563")
        .text(
            "This receipt confirms that the payment listed above was successfully received.",
            {
                align: "center",
            }
        );

    doc.moveDown(0.5);

    doc.text("Please retain this receipt for your records.", {
        align: "center",
    });

    doc.end();
};

export const downloadFeeReceipt = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.userId;

        const paymentIdParam = req.params.paymentId;
        const paymentId = Array.isArray(paymentIdParam)
            ? paymentIdParam[0]
            : paymentIdParam;

        if (!userId) {
            return res.status(401).json({
                message: "Authentication required",
            });
        }

        if (
            !paymentId ||
            !mongoose.Types.ObjectId.isValid(paymentId)
        ) {
            return res.status(400).json({
                message: "Invalid payment ID",
            });
        }

        const student = await Student.findOne({
            userId,
            isDeleted: false,
        }).populate("userId", "name uid");

        if (!student) {
            return res.status(404).json({
                message: "Student record not found",
            });
        }

        const payment = await FeePayment.findOne({
            _id: new mongoose.Types.ObjectId(paymentId),
            studentId: student._id,
            combinedPaymentId: { $exists: false },
            status: "success",
        }).populate("feeId", "feeType class");

        if (!payment) {
            return res.status(404).json({
                message: "Successful individual payment not found",
            });
        }

        const fee = payment.feeId as unknown as {
            feeType: string;
            class: string | null;
        } | null;

        const studentUser = student.userId as unknown as {
            name?: string;
            uid?: string;
        } | null;

        if (!fee) {
            return res.status(404).json({
                message: "Fee record not found",
            });
        }

        if (!payment.receiptNumber) {
            return res.status(409).json({
                message: "Receipt number is not available",
            });
        }

        generateFeeReceipt(res, {
            receiptNumber: payment.receiptNumber,

            student: {
                name: studentUser?.name ?? "Student",
                uid: studentUser?.uid ?? "N/A",
                className: student.class,
            },

            items: [
                {
                    feeType: fee.feeType,
                    className: fee.class ?? "School-wide",
                    amount: payment.amount,
                },
            ],

            totalAmount: payment.amount,
            paymentId:
                payment.razorpayPaymentId ??
                payment._id.toString(),

            paymentDate:
                payment.createdAt ??
                payment.updatedAt ??
                new Date(),
        });
    } catch (error) {
        next(error);
    }
};

export const downloadCombinedFeeReceipt = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.userId;
        const combinedPaymentIdParam = req.params.combinedPaymentId;

        const combinedPaymentId = Array.isArray(
            combinedPaymentIdParam
        )
            ? combinedPaymentIdParam[0]
            : combinedPaymentIdParam;

        if (!userId) {
            return res.status(401).json({
                message: "Authentication required",
            });
        }

        if (
            !combinedPaymentId ||
            !mongoose.Types.ObjectId.isValid(combinedPaymentId)
        ) {
            return res.status(400).json({
                message: "Invalid combined payment ID",
            });
        }

        const student = await Student.findOne({
            userId,
            isDeleted: false,
        }).populate("userId", "name uid");

        if (!student) {
            return res.status(404).json({
                message: "Student record not found",
            });
        }

        const combinedPayment =
            await CombinedFeePayment.findOne({
                _id: new mongoose.Types.ObjectId(
                    combinedPaymentId
                ),
                studentId: student._id,
                status: "success",
            }).populate({
                path: "allocations.feeId",
                select: "feeType class",
            });

        if (!combinedPayment) {
            return res.status(404).json({
                message:
                    "Successful combined payment not found",
            });
        }

        if (!combinedPayment.receiptNumber) {
            return res.status(409).json({
                message: "Receipt number is not available",
            });
        }

        const studentUser = student.userId as unknown as {
            name?: string;
            uid?: string;
        };

        const items: ReceiptItem[] =
            combinedPayment.allocations.map((allocation) => {
                const fee = allocation.feeId as unknown as {
                    feeType: string;
                    class: string | null;
                };

                return {
                    feeType: fee.feeType,
                    className: fee.class ?? "School-wide",
                    amount: allocation.amount,
                };
            });

        generateFeeReceipt(res, {
            receiptNumber: combinedPayment.receiptNumber,

            student: {
                name: studentUser.name ?? "Student",
                uid: studentUser.uid ?? "N/A",
                className: student.class,
            },

            items,
            totalAmount: combinedPayment.totalAmount,

            paymentId:
                combinedPayment.razorpayPaymentId ??
                combinedPayment._id.toString(),

            paymentDate: combinedPayment.updatedAt,
        });
    } catch (error) {
        next(error);
    }
};

export const getStudentFeeStatuses = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const {
            class: classFilter = "All",
            search = "",
            page = "1",
            limit = "10",
            sortBy = "Student Name",
            order = "asc",
        } = req.query;

        const currentPage = Math.max(Number(page) || 1, 1);
        const pageLimit = Math.max(Number(limit) || 10, 1);
        const skip = (currentPage - 1) * pageLimit;

        const searchValue = String(search).trim();

        const match: Record<string, any> = {
            $or: [
                { isDeleted: false },
                { isDeleted: { $exists: false } },
            ],
        };

        if (classFilter !== "All") {
            if (
                typeof classFilter !== "string" ||
                !VALID_CLASSES.includes(
                    classFilter as (typeof VALID_CLASSES)[number]
                )
            ) {
                return res.status(400).json({
                    message: "Invalid class filter.",
                });
            }

            match.class = classFilter;
        }

        const pipeline: mongoose.PipelineStage[] = [
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user",
                },
            },
            {
                $unwind: "$user",
            },
            {
                $match: match,
            },
        ];

        if (searchValue) {
            const escapedSearch = searchValue.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );

            pipeline.push({
                $match: {
                    $or: [
                        {
                            "user.name": {
                                $regex: escapedSearch,
                                $options: "i",
                            },
                        },
                        {
                            "user.uid": {
                                $regex: escapedSearch,
                                $options: "i",
                            },
                        },
                    ],
                },
            });
        }

        if (sortBy === "Class") {
            pipeline.push(
                {
                    $addFields: {
                        classSortOrder: {
                            $switch: {
                                branches: VALID_CLASSES.map((className, index) => ({
                                    case: { $eq: ["$class", className] },
                                    then: index + 1,
                                })),
                                default: 0,
                            },
                        },
                    },
                },
                {
                    $sort: {
                        classSortOrder: order === "desc" ? -1 : 1,
                        rollNumber: 1,
                    },
                }
            );
        } else if (sortBy === "Roll no") {
            pipeline.push({
                $sort: {
                    rollNumber: order === "desc" ? -1 : 1,
                },
            });
        } else {
            pipeline.push({
                $sort: {
                    "user.name": order === "desc" ? -1 : 1,
                },
            });
        }

        pipeline.push({
            $facet: {
                students: [
                    { $skip: skip },
                    { $limit: pageLimit },
                    {
                        $project: {
                            _id: 1,
                            class: 1,
                            section: 1,
                            rollNumber: 1,
                            name: "$user.name",
                            uid: "$user.uid",
                        },
                    },
                ],
                total: [{ $count: "count" }],
            },
        });

        const [result] = await Student.aggregate(pipeline);

        const students = result?.students ?? [];
        const totalStudents = result?.total?.[0]?.count ?? 0;
        const totalPages = Math.ceil(
            totalStudents / pageLimit
        );

        // Fetch the current fee configurations.
        const fees = await Fee.find({
            $or: [
                { feeType: "Examination Fee" },
                {
                    feeType: "Tuition Fee",
                    class: {
                        $in: [...VALID_CLASSES],
                    },
                },
            ],
        }).lean();

        const tuitionFeesByClass = new Map<
            string,
            { _id: mongoose.Types.ObjectId; amount: number }
        >();

        let examinationFee: {
            _id: mongoose.Types.ObjectId;
            amount: number;
        } | null = null;

        for (const fee of fees) {
            if (fee.feeType === "Tuition Fee" && fee.class) {
                tuitionFeesByClass.set(fee.class, {
                    _id: fee._id,
                    amount: fee.amount,
                });
            }

            if (fee.feeType === "Examination Fee") {
                examinationFee = {
                    _id: fee._id,
                    amount: fee.amount,
                };
            }
        }

        // Calculate payments only for the students on this page.
        const studentIds = students.map(
            (student: { _id: mongoose.Types.ObjectId }) =>
                student._id
        );

        const feeIds = fees.map((fee) => fee._id);

        const paymentTotals =
            studentIds.length > 0 && feeIds.length > 0
                ? await FeePayment.aggregate([
                    {
                        $match: {
                            studentId: { $in: studentIds },
                            feeId: { $in: feeIds },
                            status: "success",
                        },
                    },
                    {
                        $group: {
                            _id: {
                                studentId: "$studentId",
                                feeId: "$feeId",
                            },
                            paid: { $sum: "$amount" },
                        },
                    },
                ])
                : [];

        const paidByStudentAndFee = new Map<string, number>();

        for (const payment of paymentTotals) {
            const key =
                `${payment._id.studentId.toString()}:` +
                payment._id.feeId.toString();

            paidByStudentAndFee.set(key, payment.paid);
        }

        const getFeeDetails = (
            studentId: mongoose.Types.ObjectId,
            fee:
                | {
                    _id: mongoose.Types.ObjectId;
                    amount: number;
                }
                | null
        ) => {
            if (!fee) {
                return {
                    configured: false,
                    amount: null,
                    paid: 0,
                    balance: null,
                    status: "Not Configured" as const,
                };
            }

            const key =
                `${studentId.toString()}:` +
                fee._id.toString();

            const paid = Math.round(
                (paidByStudentAndFee.get(key) ?? 0) * 100
            ) / 100;

            const balance = Math.max(
                0,
                Math.round((fee.amount - paid) * 100) / 100
            );

            let status:
                | "Unpaid"
                | "Partially Paid"
                | "Paid";

            if (balance === 0) {
                status = "Paid";
            } else if (paid > 0) {
                status = "Partially Paid";
            } else {
                status = "Unpaid";
            }

            return {
                configured: true,
                amount: fee.amount,
                paid,
                balance,
                status,
            };
        };

        const studentsWithFeeStatus = students.map(
            (student: {
                _id: mongoose.Types.ObjectId;
                class: string;
                name: string;
                uid: string;
                rollNumber: number;
                section?: string;
            }) => ({
                ...student,
                tuitionFee: getFeeDetails(
                    student._id,
                    tuitionFeesByClass.get(student.class) ?? null
                ),
                examinationFee: getFeeDetails(
                    student._id,
                    examinationFee
                ),
            })
        );

        return res.status(200).json({
            message: "Student fee statuses retrieved successfully.",
            students: studentsWithFeeStatus,
            totalStudents,
            totalPages,
            currentPage,
            limit: pageLimit,
        });
    } catch (error) {
        next(error);
    }
};