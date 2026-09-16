import logo from "../assets/logo.png";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

function Hero() {

    const navigate = useNavigate();

    return (
        <div className="flex flex-col min-h-screen font-fredoka">
            <nav className="z-10 flex justify-between p-4 font-fredoka bg-purple-300 shadow-sm">
                <div className="flex items-center">
                    <img src={logo} alt="school logo" className="h-10" />
                    <h1 className="text-3xl">GPS</h1>
                </div>

                <button className="bg-purple-900 text-white rounded-md p-3 hover:bg-purple-950"
                    type="button" onClick={() => navigate("/login")}>Login</button>

            </nav>
            <div className="flex flex-col flex-1 bg-purple-100">
                <div className="flex flex-col pt-12 pl-20 pr-20 w-full">
                    <h1 className="w-full text-3xl mb-5 font-medium">GREEN VALLEY PUBLIC SCHOOL</h1>
                    <div>
                        <h2 className="text-xl font-thin mb-2">Empowering Students. Enabling Better Education.</h2>
                        <p className="text-xl font-thin mb-7">Welcome to Green Valley Public School — where education, growth, and technology come together to create a better learning experience.</p>
                        <div>
                            <button onClick={() => navigate("/admission")} type="button" className="bg-purple-900 text-white rounded-md p-3 hover:bg-purple-950">Apply for Admission</button>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col pt-12 pl-20 pr-20 w-full">
                    <h1 className="w-full text-xl mb-3 font-medium">School Management Portal:</h1>
                    <div>
                        <p className="text-xl font-thin mb-10">Students, teachers, and administrators can access their academic and school-related information through our management portal.
                            <Link to="/login" className="text-purple-700 font-normal hover:text-purple-900"
                            > Click here to login.</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Hero;