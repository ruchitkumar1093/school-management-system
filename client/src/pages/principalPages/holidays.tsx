import { useEffect, useState } from "react";

import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import Breadcrumb from "../../components/breadcrumb";
import HolidayCalendar from "../../components/holidayCalendar";

import {
    getHolidays,
    addHoliday,
    updateHoliday,
    deleteHoliday
} from "../../services/principalApi";

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

                console.error("Failed to fetch holidays:", error);

            }
            finally {

                setLoading(false);

            }
        };

        fetchHolidays();

    }, []);


    const handleAddHoliday = async (
        date: string,
        name: string
    ) => {

        try {

            const response = await addHoliday({
                date,
                name
            });

            const newHoliday: Holiday = {
                id: response.data._id,
                date: response.data.date.split("T")[0],
                name: response.data.name
            };

            setHolidays((previous) => [
                ...previous,
                newHoliday
            ]);

        }
        catch (error) {

            console.error("Failed to add holiday:", error);

        }

    };


    const handleUpdateHoliday = async (
        id: string,
        date: string,
        name: string
    ) => {

        try {

            const response = await updateHoliday(id, {
                date,
                name
            });

            const updatedHoliday: Holiday = {
                id: response.data._id,
                date: response.data.date.split("T")[0],
                name: response.data.name
            };

            setHolidays((previous) =>
                previous.map((holiday) =>
                    holiday.id === id
                        ? updatedHoliday
                        : holiday
                )
            );

        }
        catch (error) {

            console.error("Failed to update holiday:", error);

        }

    };


    const handleDeleteHoliday = async (id: string) => {

        try {

            await deleteHoliday(id);

            setHolidays((previous) =>
                previous.filter(
                    (holiday) => holiday.id !== id
                )
            );

        }
        catch (error) {

            console.error("Failed to delete holiday:", error);

        }

    };


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
                                Manage school holidays and important dates
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
                                editable={true}
                                onAddHoliday={handleAddHoliday}
                                onUpdateHoliday={handleUpdateHoliday}
                                onDeleteHoliday={handleDeleteHoliday}
                            />

                        )}

                    </div>

                </div>

            </div>

        </div>
    );
}

export default Holidays;