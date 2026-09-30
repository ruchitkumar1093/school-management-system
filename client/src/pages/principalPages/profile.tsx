import NavBar from "../../components/navBar";
import Breadcrumb from "../../components/breadcrumb";

import principal1 from "../../assets/profiles/profile1.png";

function PrincipalProfile() {
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    return (
        <div className="flex min-h-screen flex-col font-fredoka">
            <NavBar />

            <div className="flex flex-1 bg-purple-100">
                <div className="flex-1">
                    <Breadcrumb />

                    <main className="px-8 py-8 lg:px-12 xl:px-16">
                        <div className="mb-8">
                            <h1 className="text-3xl font-semibold text-purple-950">
                                Principal Profile
                            </h1>
                            <p className="mt-1 text-gray-600">
                                View your account and professional information.
                            </p>
                        </div>

                        <div className="rounded-lg bg-purple-200 p-6 shadow-md">
                            <div className="flex flex-col gap-8 md:flex-row md:items-center">
                                <div className="flex flex-col items-center md:min-w-40">
                                    <img
                                        src={principal1}
                                        alt="Principal profile"
                                        className="h-32 w-32 rounded-full object-cover shadow-md"
                                    />

                                    <h2 className="mt-4 text-xl font-semibold text-purple-950">
                                        {user.name}
                                    </h2>

                                    <span className="mt-1 text-sm text-gray-600">
                                        Principal
                                    </span>
                                </div>

                                <div className="hidden h-32 w-px bg-purple-300 md:block" />

                                <div className="grid flex-1 grid-cols-1 gap-x-12 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">
                                            UID
                                        </p>
                                        <p className="mt-1 font-medium text-gray-900">
                                            {user.uid?.toUpperCase()}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-gray-500">
                                            Role
                                        </p>
                                        <p className="mt-1 font-medium capitalize text-gray-900">
                                            {user.role}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-7">
                            <section className="rounded-lg bg-purple-200 p-6 shadow-md">
                                <div className="mb-6 border-b border-purple-300 pb-4">
                                    <h2 className="text-xl font-semibold text-purple-950">
                                        Account Information
                                    </h2>
                                </div>

                                <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">
                                            Name
                                        </p>
                                        <p className="mt-1 font-medium text-gray-900">
                                            {user.name}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-gray-500">
                                            UID
                                        </p>
                                        <p className="mt-1 font-medium text-gray-900">
                                            {user.uid?.toUpperCase()}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-gray-500">
                                            Role
                                        </p>
                                        <p className="mt-1 font-medium capitalize text-gray-900">
                                            {user.role}
                                        </p>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}

export default PrincipalProfile;