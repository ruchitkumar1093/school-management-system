import express from "express";
const router = express.Router();
import { getStudents, getSubjects, getMarks, createStudent, getTeacher, getStudentById,
    updateStudent, deleteStudent, getMarkById, createMark, updateMark, deleteMark, getExamResults,
    getStudentsForAttendance, createAttendance, getAttendance, getStudentAttendance
 } 
from "../controllers/teacherController";


//GET all:
router.get("/students", getStudents);
router.get("/subjects", getSubjects);
router.get("/marks", getMarks);
router.get("/teacher", getTeacher);

//Exam:
router.get("/examResults", getExamResults);

//Attendance:
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