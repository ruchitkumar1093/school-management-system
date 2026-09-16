import express from "express";
const router = express.Router();
import { createAdmission, getAdmissions, getAdmissionById, rejectAdmission, deleteRejectedAdmissions,
    approveAdmission
 } from "../controllers/admissionController";

router.post("/createAdmission", createAdmission);

router.get("/getAdmissions", getAdmissions);

router.get("/getAdmissions/:id", getAdmissionById);

router.patch("/rejectAdmissions/:id", rejectAdmission);

router.delete("/deleteRejectAdmissions", deleteRejectedAdmissions);

router.post("/approveAdmission/:id", approveAdmission);

export default router;