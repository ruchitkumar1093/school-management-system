import express from "express";
const router = express.Router();
import {
    getSubjects, getStudents, getMarks, getAttendance, getStudentHome,
    applyLeave, getMyLeaves
} from "../controllers/studentController";
import { getHolidays } from "../controllers/holidayController";

router.post("/applyLeave", applyLeave);
router.get("/getMyLeaves", getMyLeaves);

router.get("/holidays", getHolidays);

router.get("/subjects", getSubjects);

router.get("/marks", getMarks);

router.get("/student", getStudents);

router.get("/attendance", getAttendance);

router.get("/home", getStudentHome);

export default router;