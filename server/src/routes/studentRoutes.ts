import express from "express";
const router = express.Router();
import { getHolidays } from "../controllers/holidayController";
import {
    getSubjects, getStudents, getMarks, getAttendance, getStudentHome,
    applyLeave, getMyLeaves, getMonthlyAttendance
} from "../controllers/studentController";

router.post("/applyLeave", applyLeave);
router.get("/getMyLeaves", getMyLeaves);

router.get("/holidays", getHolidays);

router.get("/subjects", getSubjects);

router.get("/marks", getMarks);

router.get("/student", getStudents);

router.get("/attendance", getAttendance);
router.get("/attendance/month", getMonthlyAttendance);

router.get("/home", getStudentHome);

export default router;