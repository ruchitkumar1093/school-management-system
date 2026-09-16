import {Routes, Route} from "react-router-dom";
import TeacherHome from "../pages/teacherPages/home";
import TeacherProfile from "../pages/teacherPages/profile";
import TeacherViewStudents from "../pages/teacherPages/viewStudents";
import TeacherViewSubjects from "../pages/teacherPages/viewSubjects";
import TeacherViewMarks from "../pages/teacherPages/viewMarks";
import TeacherViewExams from "../pages/teacherPages/viewExams";
import TeacherChangePassword from "../pages/teacherPages/changePassword";
import StudentForm from "../pages/teacherPages/studentForm";
import StudentMarks from "../pages/teacherPages/marksForm";
import TeacherAttendance from "../pages/teacherPages/attendance";
import TeacherViewAttendance from "../pages/teacherPages/viewAttendance";

function TeacherRoutes() {
    return(
        <Routes>
            <Route path="/" element= {<TeacherHome />} />
            <Route path="/profile" element= {<TeacherProfile />} />
            <Route path="/viewStudents" element= {<TeacherViewStudents />} />
            <Route path="/attendance" element= {<TeacherAttendance />} />
            <Route path="/viewSubjects" element= {<TeacherViewSubjects />} />
            <Route path="/viewMarks" element= {<TeacherViewMarks />} />
            <Route path="/viewExams" element={<TeacherViewExams />} />
            <Route path="/changePassword" element= {<TeacherChangePassword />} />

            <Route path="/attendance/viewAttendance" element= {<TeacherViewAttendance />} />
            <Route path="viewStudents/studentForm" element={<StudentForm />} />
            <Route path="viewMarks/marksForm" element={<StudentMarks />} />
        </Routes>
    );
}

export default TeacherRoutes;