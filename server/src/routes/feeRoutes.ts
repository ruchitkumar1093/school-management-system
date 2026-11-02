import express from "express";
const router = express.Router();

import {
    createFee,
    getFees,
    getFeeById,
    updateFee,
    deleteFee,
    getStudentFeeStatuses
} from "../controllers/feeController";

// Create a fee for a student
router.post("/", createFee);

// Get all fees
router.get("/", getFees);

router.get("/student-status", getStudentFeeStatuses);

// Get a specific fee
router.get("/:feeId", getFeeById);

// Update a fee
router.put("/:feeId", updateFee);

// Delete a fee
router.delete("/:feeId", deleteFee);

export default router;