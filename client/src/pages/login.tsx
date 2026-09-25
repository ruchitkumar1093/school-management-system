import { useState } from "react";
import { login } from "../services/authApi";
import { useNavigate } from "react-router-dom";
import {jwtDecode} from "jwt-decode";

function Login() {
    const navigate = useNavigate();

    const [uid, setUid] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        try {
            e.preventDefault();
            const response = await login({
                uid,
                password
            });

            const token = response.data.token;

            type TokenPayload = {
                userId: string;
                role: "principal" | "teacher" | "student";
            }
            const decoded = jwtDecode<TokenPayload>(token);

            localStorage.setItem("token", response.data.token);
            localStorage.setItem("user", JSON.stringify(response.data.user));
            window.dispatchEvent(new Event("login"));

            if(decoded.role === "principal"){
                navigate("/principal");
            }
            if(decoded.role === "teacher"){
                navigate("/teacher");
            }
            if(decoded.role === "student"){
                navigate("/student");
            }

        }
        catch(error){
            console.log(error);
            setError("Invalid Credentials");
        }
    }

    return (
        <div className="flex justify-center bg-purple-100 h-screen items-center font-fredoka">
            <div className="flex flex-col items-center">
                <h1 className="text-2xl font-medium">School Management System</h1>
                <div className="flex flex-col gap-10 bg-purple-300 p-10 rounded-xl m-15
            shadow-lg">
                    <h1 className="text-2xl flex justify-center font-medium">LogIn</h1>
                    <form onSubmit={handleLogin} className="flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="uid">UID:</label>
                            <input className="w-sm border-2 border-gray-500 rounded-sm p-2
                    focus:outline-none focus:border-gray-900 transition-colors duration-300 ease-in-out"
                                type="text"
                                id="uid"
                                placeholder="Enter your UID"
                                name="uid"
                                value={uid}
                                onChange={(e) => setUid(e.target.value)} />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="password">Password:</label>
                            <input className="w-sm border-2 border-gray-500 rounded-sm p-2
                    focus:outline-none focus:border-gray-900 transition-colors duration-300 ease-in-out"
                                type="password"
                                id="password"
                                placeholder="Enter your Password"
                                name="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)} />
                        </div>
                        <button type="submit" className="bg-gray-800 hover:bg-gray-700 transition-colors
                    duration-300 ease-in-out text-white p-3 rounded-sm">Login</button>
                    {error? <p className="text-red-600 text-center">{error}</p> : null}
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Login;