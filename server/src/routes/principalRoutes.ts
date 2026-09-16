import express from "express";
const router = express.Router();
import {
    getSubjects, getStudents, getTeachers, createTeacher, getTotal, getMarks, 
    updateTeacher, getTeacherById, deleteTeacher, updateStudent, deleteStudent, 
    getStudentById, getSubjectById, createSubject, updateSubject, deleteSubject, getMarkById,
    createMark, updateMark, deleteMark, getExamResults, getAttendanceSummary, getStudentsForAttendance,
    getStudentAttendance, getAttendance
} from "../controllers/principalController";

//GET all:
router.get("/teachers", getTeachers);
router.get("/students", getStudents);
router.get("/subjects", getSubjects);
router.get("/total", getTotal);
router.get("/marks", getMarks);

//Exam:
router.get("/examResults", getExamResults);

//Attendance:
router.get("/attendance/summary", getAttendanceSummary);
router.get("/attendance/students", getStudentsForAttendance);
router.get("/attendance/student", getStudentAttendance);
router.get("/attendance", getAttendance);

//CRUD teacher
router.get("/teacher/:id", getTeacherById);
router.post("/teachers/addTeacher", createTeacher);
router.put("/updateTeacher/:id", updateTeacher);
router.delete("/deleteTeacher/:id", deleteTeacher);

//CRUD student
router.get("/student/:id", getStudentById);
router.put("/updateStudent/:id", updateStudent);
router.delete("/deleteStudent/:id", deleteStudent);

//CRUD subject
router.get("/subject/:id", getSubjectById);
router.post("/subjects/addSubject", createSubject);
router.put("/updateSubject/:id", updateSubject);
router.delete("/deleteSubject/:id", deleteSubject);

//CRUD marks
router.get("/mark/:id", getMarkById);
router.post("/marks/addMark", createMark);
router.put("/updateMark/:id", updateMark);
router.delete("/deleteMark/:id", deleteMark);

export default router;