import { useEffect, useState } from "react";

import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import Breadcrumb from "../../components/breadcrumb";
import HolidayCalendar from "../../components/holidayCalendar";

import {
    getHolidays
} from "../../services/teacherApi";

type Holiday = {
    id: string;
    date: string;
    name: string;
};

function Holidays() {

    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        const fetchHolidays = async () => {

            try {

                const response = await getHolidays();

                const formattedHolidays = response.data.map(
                    (holiday: {
                        _id: string;
                        date: string;
                        name: string;
                    }) => ({
                        id: holiday._id,
                        date: holiday.date.split("T")[0],
                        name: holiday.name
                    })
                );

                setHolidays(formattedHolidays);

            }
            catch (error) {

                console.error(
                    "Failed to fetch holidays:",
                    error
                );

            }
            finally {

                setLoading(false);

            }
        };

        fetchHolidays();

    }, []);


    return (
        <div className="flex min-h-screen flex-col font-fredoka">

            <NavBar />

            <div className="flex flex-1 bg-purple-100">

                <SideBar />

                <div className="flex min-w-0 flex-1 flex-col">

                    <Breadcrumb />

                    <div className="flex flex-1 flex-col px-16 pt-10 pb-12">

                        {/* Header */}
                        <div className="mb-8">

                            <h1 className="text-3xl font-medium text-gray-900">
                                Holidays
                            </h1>

                            <p className="mt-1 text-sm text-gray-600">
                                View school holidays and important dates
                            </p>

                        </div>


                        {/* Calendar */}
                        {loading ? (

                            <p className="text-gray-600">
                                Loading holidays...
                            </p>

                        ) : (

                            <HolidayCalendar
                                holidays={holidays}
                                editable={false}
                            />

                        )}

                    </div>

                </div>

            </div>

        </div>
    );
}

export default Holidays;