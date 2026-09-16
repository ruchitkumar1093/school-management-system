import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

type Props = {
    children: React.ReactNode;
    allowedRole: "principal" | "teacher" | "student";
}

type TokenPayload = {
    userId: string;
    role: "principal" | "teacher" | "student";
}

function ProtectedRoutes({ children, allowedRole }: Props) {
    const token = localStorage.getItem("token");

    if (!token) {
            return <Navigate to="/login" replace />;
        }

    try {
        const decoded = jwtDecode<TokenPayload>(token);
        if (decoded.role !== allowedRole) {
            return <Navigate to={`/${decoded.role}`} replace />;
        }

        return children;
    }
    catch(error){
        localStorage.removeItem("token");
        return <Navigate to="/login" replace />;
    }
}

export default ProtectedRoutes;