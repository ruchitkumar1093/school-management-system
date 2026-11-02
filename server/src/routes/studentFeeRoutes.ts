import express from "express";
const router = express.Router();

import {
    getMyFees,
    getMyFeeById,
    createPaymentOrder,
    createCombinedPaymentOrder,
    verifyCombinedPayment,
    verifyPayment,
    getMyPaymentHistory,
    downloadFeeReceipt,
    downloadCombinedFeeReceipt,
} from "../controllers/feeController";

// View all fees assigned to the logged-in student
router.get("/", getMyFees);

// View details of a specific fee
router.get("/:feeId", getMyFeeById);

// Create a Razorpay payment order
router.post("/:feeId/create-order", createPaymentOrder);

// Verify a Razorpay payment
router.post("/verify-payment", verifyPayment);

// View payment history
router.get("/payments/history", getMyPaymentHistory);

// Create one Razorpay order for all outstanding fees
router.post("/create-combined-order", createCombinedPaymentOrder);

router.post("/verify-combined-payment", verifyCombinedPayment);

// Download receipt for an individual fee payment
router.get("/payments/:paymentId/receipt", downloadFeeReceipt);

// Download receipt for a combined fee payment
router.get("/combined-payments/:combinedPaymentId/receipt", downloadCombinedFeeReceipt);

export default router;