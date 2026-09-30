import { useState } from "react";
import { login } from "../services/authApi";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function Login() {
    const navigate = useNavigate();

    const [uid, setUid] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        try {
            e.preventDefault();
            setLoading(true);
            setError("");

            const response = await login({
                uid,
                password
            });

            const token = response.data.token;

            type TokenPayload = {
                userId: string;
                role: "principal" | "teacher" | "student";
            };

            const decoded = jwtDecode<TokenPayload>(token);

            localStorage.setItem("token", response.data.token);
            localStorage.setItem("user", JSON.stringify(response.data.user));
            window.dispatchEvent(new Event("login"));

            if (decoded.role === "principal") {
                navigate("/principal");
            }

            if (decoded.role === "teacher") {
                navigate("/teacher");
            }

            if (decoded.role === "student") {
                navigate("/student");
            }
        }
        catch (error) {
            console.log(error);
            setError("Invalid Credentials");
        }
        finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-purple-100 px-5 font-fredoka">
            <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-purple-300/40 blur-3xl" />
            <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-violet-300/40 blur-3xl" />

            <div className="relative w-full max-w-md">
                <div className="mb-8 text-center">

                    <h1 className="text-3xl font-semibold text-purple-950">
                        School Management System
                    </h1>

                    <p className="mt-2 text-gray-600">
                        Sign in to access your dashboard
                    </p>
                </div>

                <div className="rounded-2xl bg-purple-200 p-8 shadow-xl sm:p-10">
                    <div className="mb-7">
                        <h2 className="text-2xl font-semibold text-purple-950">
                            Welcome Back
                        </h2>

                        <p className="mt-1 text-sm text-gray-600">
                            Enter your credentials to continue
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <label
                                htmlFor="uid"
                                className="text-sm font-medium text-gray-800"
                            >
                                UID
                            </label>

                            <input
                                required
                                className="w-full rounded-lg border border-purple-300 bg-white p-3 text-gray-900 shadow-sm outline-none transition-colors duration-200 placeholder:text-gray-400 focus:border-purple-700 focus:ring-2 focus:ring-purple-300"
                                type="text"
                                id="uid"
                                placeholder="Enter your UID"
                                name="uid"
                                value={uid}
                                onChange={(e) => setUid(e.target.value)}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label
                                htmlFor="password"
                                className="text-sm font-medium text-gray-800"
                            >
                                Password
                            </label>

                            <input
                                required
                                className="w-full rounded-lg border border-purple-300 bg-white p-3 text-gray-900 shadow-sm outline-none transition-colors duration-200 placeholder:text-gray-400 focus:border-purple-700 focus:ring-2 focus:ring-purple-300"
                                type="password"
                                id="password"
                                placeholder="Enter your password"
                                name="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        {error && (
                            <p className="rounded-lg bg-red-100 p-3 text-center text-sm font-medium text-red-600">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-lg bg-purple-800 p-3 font-medium text-white shadow-md transition-colors duration-200 hover:bg-purple-900 disabled:cursor-not-allowed disabled:bg-purple-400"
                        >
                            {loading ? "Please wait..." : "Login"}
                        </button>
                    </form>
                </div>

                <p className="mt-6 text-center text-sm text-gray-500">
                    School Management System
                </p>
            </div>
        </div>
    );
}

export default Login;