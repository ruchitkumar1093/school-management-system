import NavBar from "../../components/navBar";
import Breadcrumb from "../../components/breadcrumb";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { changePassword } from "../../services/authApi";

function PrincipalChangePassword() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (formData.newPassword !== formData.confirmPassword) {
            alert("New passwords do not match");
            return;
        }

        try {
            await changePassword({
                oldPassword: formData.oldPassword,
                newPassword: formData.newPassword
            });

            alert("Password changed successfully");

            setFormData({
                oldPassword: "",
                newPassword: "",
                confirmPassword: ""
            });

        }
        catch (error: any) {
            console.log(error);
            alert(error.response?.data?.message || "Failed to change password");
        }
    };

    return (
        <div className="flex flex-col min-h-screen font-fredoka">
            <NavBar />

            <div className="flex flex-1 bg-purple-100">
                <div>
                    <Breadcrumb />

                    <form
                        onSubmit={handleSubmit}
                        className="flex flex-col gap-7 p-15"
                    >
                        <div className="flex flex-col gap-2">
                            <label htmlFor="oldPassword">
                                Old Password:
                            </label>

                            <input
                                required
                                value={formData.oldPassword}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    oldPassword: e.target.value
                                })}
                                className="w-sm border-2 border-gray-500 rounded-sm p-2 focus:outline-none focus:border-gray-900 transition-colors duration-300 ease-in-out"
                                type="password"
                                id="oldPassword"
                                placeholder="Enter Old Password"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label htmlFor="newPassword">
                                New Password:
                            </label>

                            <input
                                required
                                value={formData.newPassword}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    newPassword: e.target.value
                                })}
                                className="w-sm border-2 border-gray-500 rounded-sm p-2 focus:outline-none focus:border-gray-900 transition-colors duration-300 ease-in-out"
                                type="password"
                                id="newPassword"
                                placeholder="Enter New Password"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label htmlFor="confirmPassword">
                                Confirm New Password:
                            </label>

                            <input
                                required
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    confirmPassword: e.target.value
                                })}
                                className="w-sm border-2 border-gray-500 rounded-sm p-2 focus:outline-none focus:border-gray-900 transition-colors duration-300 ease-in-out"
                                type="password"
                                id="confirmPassword"
                                placeholder="Confirm New Password"
                            />
                        </div>

                        <div className="flex gap-5">
                            <button
                                type="submit"
                                className="p-2 bg-purple-300 rounded-lg shadow-[0_2px_3px] hover:bg-violet-300 cursor-pointer"
                            >
                                Change Password
                            </button>

                            <button
                                onClick={() => navigate(-1)}
                                type="button"
                                className="p-2 bg-purple-300 rounded-lg shadow-[0_2px_3px] hover:bg-violet-300 cursor-pointer"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default PrincipalChangePassword;