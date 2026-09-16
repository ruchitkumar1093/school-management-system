import express from "express";
const router = express.Router();
import { getSubjects, getStudents, getMarks, getAttendance } from "../controllers/studentController";

router.get("/subjects", getSubjects);

router.get("/marks", getMarks);

router.get("/student", getStudents);

router.get("/attendance", getAttendance);

export default router;