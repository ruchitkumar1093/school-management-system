import express from "express";
const router = express.Router();
import { getHolidays } from "../controllers/holidayController";
import { getStudents, getSubjects, getMarks, createStudent, getStudentById,
    updateStudent, deleteStudent, getMarkById, createMark, updateMark, deleteMark, getExamResults,
    getStudentsForAttendance, createAttendance, getAttendance, getStudentAttendance, getTeacherHome,
    getTeacher, getLeaveApplications, approveLeave, rejectLeave, getAttendanceStudents
 } 
from "../controllers/teacherController";

router.get("/home", getTeacherHome);
router.get("/holidays", getHolidays);
router.get("/students", getStudents);
router.get("/subjects", getSubjects);
router.get("/marks", getMarks);
router.get("/teacher", getTeacher);
router.get("/examResults", getExamResults);

//Leaves:
router.get("/leaves", getLeaveApplications);
router.patch("/leaves/:id/approve", approveLeave);
router.patch("/leaves/:id/reject", rejectLeave);

//Attendance:
router.get("/attendance/students", getAttendanceStudents);
router.get("/getStudentsForAttendance", getStudentsForAttendance);
router.post("/createAttendance", createAttendance);
router.get("/attendance", getAttendance);
router.get("/attendance/student", getStudentAttendance);

//CRUD student
router.get("/student/:id", getStudentById);
router.post("/students/addStudent", createStudent);
router.put("/updateStudent/:id", updateStudent);
router.delete("/deleteStudent/:id", deleteStudent);

//CRUD marks
router.get("/mark/:id", getMarkById);
router.post("/marks/addMark", createMark);
router.put("/updateMark/:id", updateMark);
router.delete("/deleteMark/:id", deleteMark);

export default router;