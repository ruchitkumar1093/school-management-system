import { Routes, Route } from "react-router-dom";
import PrincipalRoutes from "./routes/principalRoutes";
import StudentRoutes from "./routes/studentRoutes";
import TeacherRoutes from "./routes/teacherRoutes";
import LoginRoutes from "./routes/loginRoutes";
import ProtectedRoutes from "./components/protectedRoutes";
import Hero from "./pages/hero";
import AdmissionForm from "./pages/admissionForm";

function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Hero />} />
        <Route path="/admission" element={<AdmissionForm />} />
        <Route path="/*" element={<LoginRoutes />} />
        <Route path="/principal/*" element={
          <ProtectedRoutes allowedRole={"principal"}>
            <PrincipalRoutes />
          </ProtectedRoutes>} />
        <Route path="/student/*" element={
          <ProtectedRoutes allowedRole={"student"}>
            <StudentRoutes />
          </ProtectedRoutes>} />
        <Route path="/teacher/*" element={
          <ProtectedRoutes allowedRole={"teacher"}>
            <TeacherRoutes />
          </ProtectedRoutes>} />
      </Routes>
    </div>
  );
}

export default App;