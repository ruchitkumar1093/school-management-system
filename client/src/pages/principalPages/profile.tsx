import NavBar from "../../components/navBar";
import Breadcrumb from "../../components/breadcrumb";

function PrincipalProfile() {

    const user = JSON.parse(localStorage.getItem("user") || "{}");

    return (
        <div className="flex flex-col min-h-screen font-fredoka">
            <NavBar />
            <div className="flex flex-1 bg-purple-100">
                <div>
                    <Breadcrumb />
                    <div className="flex flex-col pt-12 pl-20">
                        <h1 className="text-3xl mb-10">Principal Profile:</h1>
                        <div className="p-7 bg-purple-200 rounded-lg mb-10 flex flex-col gap-2">
                            <h2 className="flex gap-3">
                                <span>Name:</span>
                                <span>{user.name}</span>
                            </h2>
                            <h2 className="flex gap-3">
                                <span>UID:</span>
                                <span>{user.uid.toUpperCase()}</span>
                            </h2>
                            <h2 className="flex gap-3">
                                <span>Role:</span>
                                <span className="capitalize">{user.role}</span>
                            </h2>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default PrincipalProfile;