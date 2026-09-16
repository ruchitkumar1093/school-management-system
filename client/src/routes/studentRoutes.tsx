import {Routes, Route} from "react-router-dom";
import StudentViewSubjects from "../pages/studentPages/viewSubjects";
import StudentHome from "../pages/studentPages/home";
import StudentViewMarks from "../pages/studentPages/viewMarks";
import StudentProfile from "../pages/studentPages/profile";
import StudentChangePassword from "../pages/studentPages/changePassword";
import StudentAttendance from "../pages/studentPages/attendance";


function StudentRoutes() {
    return(
        <Routes>
            <Route path="/viewSubjects" element= {<StudentViewSubjects />} />
            <Route path="/" element= {<StudentHome />} />
            <Route path="/viewMarks" element= {<StudentViewMarks />} />  
            <Route path="/profile" element= {<StudentProfile />} />
            <Route path="/attendance" element= {<StudentAttendance />} />
            <Route path="/changePassword" element= {<StudentChangePassword />} />
        </Routes>
    );
}

export default StudentRoutes;