import express from "express";
const router = express.Router();
import { getHolidays, addHoliday, updateHoliday, deleteHoliday} from "../controllers/holidayController";
import {
    getSubjects, getStudents, getTeachers, createTeacher, getMarks, 
    updateTeacher, getTeacherById, deleteTeacher, updateStudent, deleteStudent, 
    getStudentById, getSubjectById, createSubject, updateSubject, deleteSubject, getMarkById,
    createMark, updateMark, deleteMark, getExamResults, getAttendanceSummary,
    getStudentAttendance, getAttendance, getClassOverview, getPrincipalHome, getLeaveApplications,
    approveLeave, rejectLeave, assignClassTeacher, getMarkTeachers, getDeletedStudents,
    restoreStudent, getDeletedTeachers, restoreTeacher, deactivateStudent, activateStudent,
    deactivateTeacher, activateTeacher, getTeacherLeaveApplications, approveTeacherLeave,
    rejectTeacherLeave, permanentlyDeleteTeacher, permanentlyDeleteStudent,
    deleteTeachers, deleteStudents, getStudentAttendanceDetails, getStudentMonthlyAttendance,
    getTeachersForAttendance, createTeacherAttendance, getTeacherAttendance, getTeacherAttendanceDetails,
    getTeacherMonthlyAttendance, updateStudentProfile, updateTeacherProfile, getMarkFormOptions,
    getTeachersForArrangement, createArrangement, getMarkSubjects
} from "../controllers/principalController";

//home
router.get("/home", getPrincipalHome);

//Teacher Leaves:
router.get("/teacher-leave", getTeacherLeaveApplications);
router.patch("/teacher-leave/:id/approve", approveTeacherLeave);
router.patch("/teacher-leave/:id/reject", rejectTeacherLeave);

//Student Leaves:
router.get("/leaves", getLeaveApplications);
router.patch("/leaves/:id/approve", approveLeave);
router.patch("/leaves/:id/reject", rejectLeave);

//Holidays:
router.get("/holidays", getHolidays);
router.post("/addHolidays", addHoliday);
router.patch("/updateHolidays/:id", updateHoliday);
router.delete("/deleteHolidays/:id", deleteHoliday);

//Student Attendance:
router.get("/attendance/summary", getAttendanceSummary);
router.get("/attendance/student", getStudentAttendance);
router.get("/attendance", getAttendance);
router.get("/attendance/student/details", getStudentAttendanceDetails);
router.get("/attendance/student/month", getStudentMonthlyAttendance);

//Teacher attendance
router.get("/teachersForAttendance", getTeachersForAttendance);
router.post("/createTeacherAttendance", createTeacherAttendance);
router.get("/teacherAttendance", getTeacherAttendance);
router.get("/teacher-attendance/details", getTeacherAttendanceDetails);
router.get("/teacher-attendance/month", getTeacherMonthlyAttendance);

//Teacher
router.get("/teachers", getTeachers);
router.get("/teacher/:id", getTeacherById);
router.post("/teachers/addTeacher", createTeacher);
router.put("/updateTeacher/:id", updateTeacher);
router.delete("/deleteTeacher/:id", deleteTeacher);
router.delete("/teachers/:id/permanent", permanentlyDeleteTeacher);
router.delete("/teachers", deleteTeachers);
router.patch("/deactivateTeacher/:id", deactivateTeacher);
router.patch("/activateTeacher/:id", activateTeacher);
router.get("/deleted-teachers", getDeletedTeachers);
router.patch("/restoreTeacher/:id", restoreTeacher);
router.patch("/teachers/:id", updateTeacherProfile);

//Student
router.get("/students", getStudents);
router.get("/student/:id", getStudentById);
router.put("/updateStudent/:id", updateStudent);
router.delete("/deleteStudent/:id", deleteStudent);
router.delete("/students/:id/permanent", permanentlyDeleteStudent);
router.delete("/students", deleteStudents);
router.patch("/deactivateStudent/:id", deactivateStudent);
router.patch("/activateStudent/:id", activateStudent);
router.get("/deleted-students", getDeletedStudents);
router.patch("/restoreStudent/:id", restoreStudent);
router.patch("/students/:id", updateStudentProfile);

//Subject
router.get("/subject/:id", getSubjectById);
router.post("/subjects/addSubject", createSubject);
router.put("/updateSubject/:id", updateSubject);
router.delete("/deleteSubject/:id", deleteSubject);
router.get("/subjects", getSubjects);
router.get("/marks/subjects/all", getMarkSubjects);

//Marks
router.get("/marks", getMarks);
router.get("/mark/:id", getMarkById);
router.post("/marks/addMark", createMark);
router.put("/updateMark/:id", updateMark);
router.delete("/deleteMark/:id", deleteMark);
router.get("/marks/teachers", getMarkTeachers);
router.get("/markFormOptions", getMarkFormOptions);

//Exam
router.get("/examResults", getExamResults);

//Class Overview
router.get("/class-overview/:class", getClassOverview);
router.put("/class-overview/:class/teacher", assignClassTeacher);

//Arrangement
router.get("/arrangement/teachers", getTeachersForArrangement);

router.post("/arrangement", createArrangement);

export default router;