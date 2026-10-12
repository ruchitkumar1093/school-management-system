import { useEffect, useRef, useState } from "react";

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

type HolidayResponse = {
    _id?: string;
    id?: string;
    date: string;
    name: string;
};

function Holidays() {
    const today = new Date();

    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [loading, setLoading] = useState(true);

    const [currentMonth, setCurrentMonth] = useState(() => ({
        year: today.getFullYear(),
        month: today.getMonth() + 1
    }));

    const holidaysCache = useRef<Record<number, Holiday[]>>({});

    useEffect(() => {
        let cancelled = false;

        const fetchYearHolidays = async () => {
            setLoading(true);

            try {
                const { year } = currentMonth;
                let yearHolidays = holidaysCache.current[year];

                if (!yearHolidays) {
                    const response = await getHolidays(year);

                    const data: HolidayResponse[] = Array.isArray(response.data)
                        ? response.data
                        : response.data.holidays ?? [];

                    yearHolidays = data.map((holiday) => ({
                        id: holiday._id ?? holiday.id ?? holiday.date,
                        date: holiday.date.split("T")[0],
                        name: holiday.name
                    }));

                    holidaysCache.current[year] = yearHolidays;
                }

                if (!cancelled) {
                    setHolidays(yearHolidays);
                }
            } catch (error) {
                console.error("Failed to fetch holiday data:", error);

                if (!cancelled) {
                    setHolidays([]);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void fetchYearHolidays();

        return () => {
            cancelled = true;
        };
    }, [currentMonth.year]);

    const handleMonthChange = (year: number, month: number) => {
        setCurrentMonth({ year, month });
    };

    const handleAddHoliday = async (date: string, name: string) => {
        try {
            const response = await addHoliday({ date, name });

            const newHoliday: Holiday = {
                id: response.data._id,
                date: response.data.date.split("T")[0],
                name: response.data.name
            };

            setHolidays((previous) => {
                const updated = [...previous, newHoliday];
                holidaysCache.current[currentMonth.year] = updated;
                return updated;
            });
        } catch (error: any) {
            console.error("Failed to add holiday:", error);

            throw new Error(
                error.response?.data?.message || "Failed to add holiday"
            );
        }
    };

    const handleUpdateHoliday = async (
        id: string,
        date: string,
        name: string
    ) => {
        try {
            const response = await updateHoliday(id, { date, name });

            const updatedHoliday: Holiday = {
                id: response.data._id,
                date: response.data.date.split("T")[0],
                name: response.data.name
            };

            setHolidays((previous) => {
                const updated = previous.map((holiday) =>
                    holiday.id === id ? updatedHoliday : holiday
                );

                holidaysCache.current[currentMonth.year] = updated;
                return updated;
            });
        } catch (error: any) {
            console.error("Failed to update holiday:", error);

            throw new Error(
                error.response?.data?.message || "Failed to update holiday"
            );
        }
    };

    const handleDeleteHoliday = async (id: string) => {
        try {
            await deleteHoliday(id);

            setHolidays((previous) => {
                const updated = previous.filter(
                    (holiday) => holiday.id !== id
                );

                holidaysCache.current[currentMonth.year] = updated;
                return updated;
            });
        } catch (error: any) {
            console.error("Failed to delete holiday:", error);

            throw new Error(
                error.response?.data?.message || "Failed to delete holiday"
            );
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
                        <div className="mb-8">
                            <h1 className="text-3xl font-medium text-gray-900">
                                Holidays
                            </h1>

                            <p className="mt-1 text-sm text-gray-600">
                                Manage school holidays and important dates
                            </p>
                        </div>

                        {loading ? (
                            <p className="text-gray-600">
                                Loading holidays...
                            </p>
                        ) : (
                            <HolidayCalendar
                                holidays={holidays}
                                editable={true}
                                currentMonth={new Date(
                                    currentMonth.year,
                                    currentMonth.month - 1,
                                    1
                                )}
                                onMonthChange={handleMonthChange}
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