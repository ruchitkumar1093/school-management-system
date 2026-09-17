import { Routes, Route } from "react-router-dom";
import PrincipalHome from "../pages/principalPages/home";
import PrincipalViewTeachers from "../pages/principalPages/viewTeachers";
import TeacherProfile from "../pages/principalPages/teacherProfile";
import StudentProfile from "../pages/principalPages/studentProfile";
import PrincipalViewStudents from "../pages/principalPages/viewStudents";
import PrincipalViewSubjects from "../pages/principalPages/viewSubjects";
import PrincipalViewMarks from "../pages/principalPages/viewMarks";
import PrincipalViewExams from "../pages/principalPages/viewExams";
import PrincipalProfile from "../pages/principalPages/profile";
import PrincipalChangePassword from "../pages/principalPages/changePassword";
import TeacherForm from "../pages/principalPages/teacherForm";
import StudentForm from "../pages/principalPages/studentForm";
import SubjectForm from "../pages/principalPages/subjectForm";
import MarksForm from "../pages/principalPages/marksForm";
import AdmissionRequest from "../pages/principalPages/admissionRequest";
import ViewAdmissionRequest from "../pages/principalPages/viewAdmissionRequest";
import PrincipalAttendance from "../pages/principalPages/attendance";
import PrincipalViewAttendance from "../pages/principalPages/viewAttendance";

function PrincipalRoutes() {
    return (
        <Routes>
            <Route path="/" element={<PrincipalHome />} />
            <Route path="/viewTeachers" element={<PrincipalViewTeachers />} />
            <Route path="/viewStudents" element={<PrincipalViewStudents />} />
            <Route path="/attendance" element={<PrincipalAttendance />} />
            <Route path="/admissionRequests" element={<AdmissionRequest />} />
            <Route path="/viewSubjects" element={<PrincipalViewSubjects />} />
            <Route path="/viewMarks" element={<PrincipalViewMarks />} />
            <Route path="/viewExams" element={<PrincipalViewExams />} />
            <Route path="/profile" element={<PrincipalProfile />} />
            <Route path="/changePassword" element={<PrincipalChangePassword />} />

            <Route path="/attendance/viewAttendance" element={<PrincipalViewAttendance />} />
            <Route path="admissionRequests/viewRequest" element={<ViewAdmissionRequest />} />
            <Route path="viewTeachers/teacherForm" element={<TeacherForm />} />
            <Route path="viewTeachers/teacherProfile" element={<TeacherProfile />} />
            <Route path="viewStudents/studentForm" element={<StudentForm />} />
            <Route path="viewStudents/studentProfile" element={<StudentProfile />} />
            <Route path="viewSubjects/subjectForm" element={<SubjectForm />} />
            <Route path="viewMarks/marksForm" element={<MarksForm />} />
        </Routes>
    );
}

export default PrincipalRoutes;