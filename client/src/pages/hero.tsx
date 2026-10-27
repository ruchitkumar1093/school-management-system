
import logo from "../assets/logo.png";
import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";

type TokenPayload = {
    role: "principal" | "teacher" | "student";
    exp?: number;
};

function Hero() {
    const navigate = useNavigate();

    const [dashboardPath, setDashboardPath] =
        useState<string | null>(null);

    useEffect(() => {
        const updateDashboardPath = () => {
            const token = localStorage.getItem("token");

            if (!token) {
                setDashboardPath(null);
                return;
            }

            try {
                const decoded = jwtDecode<TokenPayload>(token);

                if (decoded.exp && decoded.exp * 1000 <= Date.now()) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    setDashboardPath(null);
                    return;
                }

                const routes: Record<string, string> = {
                    principal: "/principal",
                    teacher: "/teacher",
                    student: "/student",
                };

                setDashboardPath(routes[decoded.role] ?? null);
            } catch {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                setDashboardPath(null);
            }
        };

        updateDashboardPath();

        window.addEventListener("login", updateDashboardPath);
        window.addEventListener("logout", updateDashboardPath);

        return () => {
            window.removeEventListener("login", updateDashboardPath);
            window.removeEventListener("logout", updateDashboardPath);
        };
    }, []);

    return (
        <div className="flex min-h-screen flex-col font-fredoka bg-purple-100">

            {/* Navbar */}
            <nav className="z-10 flex items-center justify-between bg-purple-300 px-8 py-4 shadow-sm">
                <Link to="/" className="flex cursor-pointer items-center">
                    <div className="flex items-center gap-3">
                        <img
                            src={logo}
                            alt="school logo"
                            className="h-10 w-auto"
                        />

                        <h1 className="text-3xl font-medium text-gray-900">
                            GPS
                        </h1>
                    </div>
                </Link>


                <div className="flex items-center gap-3">
                    {dashboardPath && (
                        <button
                            className="rounded-lg border-2 border-purple-800 px-5 py-2.5 font-medium text-purple-800
                            transition-all duration-200
                            hover:bg-purple-200
                            cursor-pointer"
                            type="button"
                            onClick={() => navigate(dashboardPath)}
                        >
                            Back to Dashboard
                        </button>
                    )}

                    <button
                        className="rounded-lg bg-purple-800 px-5 py-2.5 font-medium text-white
                        shadow-[0_2px_1px_rgba(0,0,0,0.15)]
                        transition-all duration-200
                        hover:bg-purple-900
                        cursor-pointer"
                        type="button"
                        onClick={() => navigate("/login")}
                    >
                        Login
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex flex-1 flex-col px-8 py-14 md:px-16 lg:px-24">

                {/* Hero Section */}
                <section className="flex flex-1 items-center">
                    <div className="w-full">
                        <div className="max-w-4xl">
                            <p className="mb-3 text-sm font-medium uppercase tracking-widest text-purple-800">
                                Welcome to
                            </p>

                            <h1 className="text-4xl font-medium leading-tight text-gray-900 md:text-5xl">
                                Green Valley Public School
                            </h1>

                            <div className="mt-5 h-1 w-20 rounded-full bg-purple-800"></div>

                            <h2 className="mt-6 text-2xl font-medium text-gray-800">
                                Empowering Students. Enabling Better Education.
                            </h2>

                            <p className="mt-4 max-w-3xl text-lg leading-8 text-gray-600">
                                Welcome to Green Valley Public School — where education,
                                growth, and technology come together to create a better
                                learning experience.
                            </p>

                            <div className="mt-8 flex flex-wrap gap-4">
                                <button
                                    onClick={() => navigate("/admission")}
                                    type="button"
                                    className="rounded-lg bg-purple-800 px-6 py-3 font-medium text-white
                                    shadow-[0_2px_1px_rgba(0,0,0,0.15)]
                                    transition-all duration-200
                                    hover:bg-purple-900
                                    cursor-pointer"
                                >
                                    Apply for Admission
                                </button>

                                <button
                                    onClick={() => navigate("/login")}
                                    type="button"
                                    className="rounded-lg border-2 border-purple-800 px-6 py-3
                                    font-medium text-purple-800
                                    transition-all duration-200
                                    hover:bg-purple-200
                                    cursor-pointer"
                                >
                                    Access Portal
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Portal Section */}
                <section className="mt-16">
                    <div className="rounded-2xl bg-purple-300 p-7 shadow-sm md:p-8">
                        <div className="max-w-4xl">
                            <p className="mb-2 text-sm font-medium uppercase tracking-wide text-purple-800">
                                School Management Portal
                            </p>

                            <h2 className="text-2xl font-medium text-gray-900">
                                Everything you need in one place
                            </h2>

                            <p className="mt-3 text-base leading-7 text-gray-700">
                                Students, teachers, and administrators can access their
                                academic and school-related information through our
                                management portal.
                            </p>

                            <Link
                                to="/login"
                                className="mt-4 inline-block font-medium text-purple-800
                                transition-colors hover:text-purple-950"
                            >
                                Click here to login →
                            </Link>
                        </div>
                    </div>
                </section>

            </main>
        </div>
    );
}

export default Hero;
