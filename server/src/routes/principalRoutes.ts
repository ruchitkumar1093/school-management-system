import express from "express";
const router = express.Router();
import { getHolidays, addHoliday, updateHoliday, deleteHoliday} from "../controllers/holidayController";
import {
    getSubjects, getStudents, getTeachers, createTeacher, getMarks, 
    updateTeacher, getTeacherById, deleteTeacher, updateStudent, deleteStudent, 
    getStudentById, getSubjectById, createSubject, updateSubject, deleteSubject, getMarkById,
    createMark, updateMark, deleteMark, getExamResults, getAttendanceSummary, getStudentsForAttendance,
    getStudentAttendance, getAttendance, getClassOverview, getPrincipalHome, getLeaveApplications,
    approveLeave, rejectLeave, assignClassTeacher, getMarkTeachers, getDeletedStudents,
    restoreStudent, getDeletedTeachers, restoreTeacher, deactivateStudent, activateStudent,
    deactivateTeacher, activateTeacher, getTeacherLeaveApplications, approveTeacherLeave,
    rejectTeacherLeave, getAttendanceDates
} from "../controllers/principalController";

router.get("/marks/teachers", getMarkTeachers);
router.get("/home", getPrincipalHome);
router.get("/teachers", getTeachers);
router.get("/students", getStudents);
router.get("/subjects", getSubjects);
router.get("/marks", getMarks);
router.get("/examResults", getExamResults);
router.get("/class-overview/:class", getClassOverview);
router.put("/class-overview/:class/teacher", assignClassTeacher);
router.get("/deleted-students", getDeletedStudents);
router.patch("/restoreStudent/:id", restoreStudent);
router.get("/deleted-teachers", getDeletedTeachers);
router.patch("/restoreTeacher/:id", restoreTeacher);
router.patch("/deactivateStudent/:id", deactivateStudent);
router.patch("/activateStudent/:id", activateStudent);
router.patch("/deactivateTeacher/:id", deactivateTeacher);
router.patch("/activateTeacher/:id", activateTeacher);

//Teacher Leaves:
router.get("/teacher-leave", getTeacherLeaveApplications);
router.patch("/teacher-leave/:id/approve", approveTeacherLeave);
router.patch("/teacher-leave/:id/reject", rejectTeacherLeave);

//Leaves:
router.get("/leaves", getLeaveApplications);
router.patch("/leaves/:id/approve", approveLeave);
router.patch("/leaves/:id/reject", rejectLeave);

//Holidays:
router.get("/getHolidays", getHolidays);
router.post("/addHolidays", addHoliday);
router.patch("/updateHolidays/:id", updateHoliday);
router.delete("/deleteHolidays/:id", deleteHoliday);

//Attendance:
router.get("/attendance/summary", getAttendanceSummary);
router.get("/attendance/students", getStudentsForAttendance);
router.get("/attendance/student", getStudentAttendance);
router.get("/attendance", getAttendance);
router.get("/attendance-dates", getAttendanceDates);

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