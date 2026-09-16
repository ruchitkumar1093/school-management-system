import { createContext } from "react";
import { useNavigate } from "react-router-dom";

type AuthContextType = {
    logOut: () => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {

    const navigate = useNavigate();

    const logOut = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    return (
        <AuthContext.Provider value={{ logOut }}>
            {children}
        </AuthContext.Provider>
    );
};