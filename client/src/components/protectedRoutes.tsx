import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

type Props = {
    children: React.ReactNode;
    allowedRole: "principal" | "teacher" | "student";
};

type TokenPayload = {
    userId: string;
    role: "principal" | "teacher" | "student";
    exp?: number;
};

function ProtectedRoutes({ children, allowedRole }: Props) {
    const token = localStorage.getItem("token");

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    try {
        const decoded = jwtDecode<TokenPayload>(token);

        // Check whether the token has expired.
        if (decoded.exp && decoded.exp * 1000 <= Date.now()) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");

            return <Navigate to="/login" replace />;
        }

        // Check whether the user has the correct role.
        if (decoded.role !== allowedRole) {
            return <Navigate to={`/${decoded.role}`} replace />;
        }

        return children;
    } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        return <Navigate to="/login" replace />;
    }
}

export default ProtectedRoutes;