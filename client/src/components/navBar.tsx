import logo from "../assets/logo.png";
import { FiChevronDown } from "react-icons/fi";
import { useState, useEffect, useRef } from "react";
import { useContext } from "react";
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
            <nav className="z-10 flex justify-between p-3 font-fredoka bg-purple-300 shadow-sm">
                <Link to={homePath} className="flex items-center cursor-pointer">
                    <img src={logo} alt="school logo" className="h-10" />
                    <h1 className="text-3xl">SMS</h1>
                </Link>

                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="flex gap-3 p-1 items-center text-left cursor-pointer"
                    >
                        <div className="flex flex-col">
                            <span className="font-[450]">
                                {user.name.toUpperCase()}
                            </span>
                            <span className="text-[15px] text-gray-700">
                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </span>
                        </div>

                        <div className="p-1 hover:bg-purple-400 hover:rounded-lg cursor-pointer">
                            <FiChevronDown className="text-lg" />
                        </div>
                    </button>

                    {isOpen && (
                        <div className="absolute right-0 top-full mt-2 flex flex-col bg-white rounded-lg p-3 shadow-lg">
                            {paths.map((path) => {
                                return (
                                    <Link
                                        onClick={() => setIsOpen(false)}
                                        className="hover:bg-purple-900 hover:text-white rounded-md p-2 text-left whitespace-nowrap"
                                        key={path.path}
                                        to={path.path}
                                    >
                                        {path.label}
                                    </Link>
                                );
                            })}

                            <button
                                onClick={logOut}
                                className="hover:bg-red-700 hover:text-white rounded-md p-2 text-left whitespace-nowrap"
                            >
                                LogOut
                            </button>
                        </div>
                    )}
                </div>
            </nav>
        </div>
    );
}

export default NavBar;