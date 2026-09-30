import logo from "../assets/logo.png";
import { FiChevronDown, FiUser, FiLogOut } from "react-icons/fi";
import { useState, useEffect, useRef, useContext } from "react";
import { AuthContext } from "../context/authContext";
import { Link } from "react-router-dom";

type Path = {
    label: string;
    path: string;
};

type Role = "principal" | "teacher" | "student";

type User = {
    name: string;
    uid: string;
    role: Role;
};

function NavBar() {
    const dropdownRef = useRef<HTMLDivElement>(null);
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("NavBar must be used inside AuthProvider");
    }

    const { logOut } = context;
    const [isOpen, setIsOpen] = useState(false);

    const user: User = JSON.parse(
        localStorage.getItem("user") || "{}"
    );

    const principalPaths: Path[] = [
        { label: "Profile", path: "/principal/profile" },
        { label: "Change Password", path: "/principal/changePassword" }
    ];

    const teacherPaths: Path[] = [
        { label: "Profile", path: "/teacher/profile" },
        { label: "Change Password", path: "/teacher/changePassword" }
    ];

    const studentPaths: Path[] = [
        { label: "Profile", path: "/student/profile" },
        { label: "Change Password", path: "/student/changePassword" }
    ];

    const pathsByRole: Record<Role, Path[]> = {
        principal: principalPaths,
        teacher: teacherPaths,
        student: studentPaths
    };

    const paths = pathsByRole[user.role];

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const homePath =
        user.role === "principal"
            ? "/principal"
            : user.role === "teacher"
                ? "/teacher"
                : "/student";

    return (
        <div>
            <nav className="z-10 flex justify-between bg-purple-300 p-3 font-fredoka shadow-sm">
                <Link to={homePath} className="flex cursor-pointer items-center">
                    <img src={logo} alt="school logo" className="h-10" />
                    <h1 className="text-3xl font-medium text-gray-900">GPS</h1>
                </Link>

                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="flex cursor-pointer items-center gap-3 rounded-lg p-1.5 text-left transition-colors"
                    >
                        <div className="flex flex-col">
                            <span className="font-[450]">
                                {user.name.toUpperCase()}
                            </span>
                            <span className="text-[15px] text-gray-700">
                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </span>
                        </div>

                        <div className={`rounded-lg p-1 transition-transform duration-200 ${isOpen ? "bg-purple-400 rotate-180" : ""}`}>
                            <FiChevronDown className="text-lg hover:bg-purple-400/60 rounded-md" />
                        </div>
                    </button>

                    {isOpen && (
                        <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-purple-300 bg-white shadow-lg">
                            <div className="border-b border-purple-200 bg-purple-100 px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-800 text-white">
                                        <FiUser className="text-lg" />
                                    </div>

                                    <div className="min-w-0">
                                        <p className="truncate font-medium text-purple-950">
                                            {user.name}
                                        </p>
                                        <p className="text-sm capitalize text-gray-600">
                                            {user.role}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-2">
                                {paths.map((path) => {
                                    return (
                                        <Link
                                            onClick={() => setIsOpen(false)}
                                            className="block rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-purple-100 hover:text-purple-900"
                                            key={path.path}
                                            to={path.path}
                                        >
                                            {path.label}
                                        </Link>
                                    );
                                })}

                                <div className="my-1 border-t border-gray-200" />

                                <button
                                    onClick={logOut}
                                    className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
                                >
                                    <FiLogOut className="text-base" />
                                    LogOut
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </nav>
        </div>
    );
}

export default NavBar;