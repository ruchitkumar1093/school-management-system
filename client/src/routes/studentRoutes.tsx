import {Routes, Route} from "react-router-dom";
import StudentViewSubjects from "../pages/studentPages/viewSubjects";
import StudentHome from "../pages/studentPages/home";
import StudentViewMarks from "../pages/studentPages/viewMarks";
import StudentProfile from "../pages/studentPages/profile";
import StudentChangePassword from "../pages/studentPages/changePassword";
import StudentAttendance from "../pages/studentPages/attendance";
import Holidays from "../pages/studentPages/holidays";
import LeaveApplications from "../pages/studentPages/leaves";
import NotFound from "../pages/notFound";


function StudentRoutes() {
    return(
        <Routes>
            <Route path="/viewSubjects" element= {<StudentViewSubjects />} />
            <Route path="/" element= {<StudentHome />} />
            <Route path="/viewMarks" element= {<StudentViewMarks />} />  
            <Route path="/profile" element= {<StudentProfile />} />
            <Route path="/attendance" element= {<StudentAttendance />} />
            <Route path="/viewHolidays" element={<Holidays />} />
            <Route path="/viewLeaves" element={<LeaveApplications />} />
            <Route path="/changePassword" element= {<StudentChangePassword />} />
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}

export default StudentRoutes;