import express from "express";
const router = express.Router();
import { getHolidays } from "../controllers/holidayController";
import {
    getSubjects, getStudents, getMarks, getAttendance, getStudentHome,
    applyLeave, getMyLeaves, getMonthlyAttendance
} from "../controllers/studentController";

//Leave
router.post("/applyLeave", applyLeave);
router.get("/getMyLeaves", getMyLeaves);

//Holidays
router.get("/holidays", getHolidays);

//Subjects
router.get("/subjects", getSubjects);

//Marks
router.get("/marks", getMarks);

//Students
router.get("/student", getStudents);

//Attendance
router.get("/attendance", getAttendance);
router.get("/attendance/month", getMonthlyAttendance);

//Home
router.get("/home", getStudentHome);

export default router;