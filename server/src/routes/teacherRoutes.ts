import express from "express";
const router = express.Router();
import { getHolidays } from "../controllers/holidayController";
import {
    getStudents, getSubjects, getMarks, createStudent, getStudentById,
    updateStudent, deleteStudent, getMarkById, createMark, updateMark, deleteMark, getExamResults,
    getStudentsForAttendance, createAttendance, getAttendance, getStudentAttendance, getTeacherHome,
    getTeacher, getLeaveApplications, approveLeave, rejectLeave, applyLeave, getMyLeaves,
    getStudentMonthlyAttendance, getMyAttendance, getMyMonthlyAttendance,
    deleteStudents, restoreStudent, permanentlyDeleteStudent, getTeacherSubjects
}
    from "../controllers/teacherController";

//Home
router.get("/home", getTeacherHome);

//Teacher
router.get("/teacher", getTeacher);

//Student Leaves:
router.get("/leaves", getLeaveApplications);
router.patch("/leaves/:id/approve", approveLeave);
router.patch("/leaves/:id/reject", rejectLeave);

//Apply Leave:
router.post("/leave", applyLeave);
router.get("/getLeave", getMyLeaves);

//Attendance:
router.get("/getStudentsForAttendance", getStudentsForAttendance);
router.post("/createAttendance", createAttendance);
router.get("/attendance", getAttendance);
router.get("/attendance/student", getStudentAttendance);
router.get("/attendance/student/month", getStudentMonthlyAttendance);
router.get("/my-attendance", getMyAttendance);
router.get("/attendance/my/month", getMyMonthlyAttendance);

//Student
router.get("/student/:id", getStudentById);
router.post("/students/addStudent", createStudent);
router.put("/updateStudent/:id", updateStudent);
router.patch("/deleteStudent/:id", deleteStudent);
router.patch("/deleteStudents", deleteStudents);
router.patch("/restoreStudent/:id", restoreStudent);
router.delete("/permanentlyDeleteStudent/:id", permanentlyDeleteStudent);
router.get("/students", getStudents);

//Marks
router.get("/marks", getMarks);
router.get("/mark/:id", getMarkById);
router.post("/marks/addMark", createMark);
router.put("/updateMark/:id", updateMark);
router.delete("/deleteMark/:id", deleteMark);

//Subjects
router.get("/subjects", getSubjects);
router.get("/subjects/assigned", getTeacherSubjects);

//Exam
router.get("/examResults", getExamResults);

//Holidays
router.get("/holidays", getHolidays);

export default router;