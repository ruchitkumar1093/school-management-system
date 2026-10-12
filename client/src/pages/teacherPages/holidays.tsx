import { useEffect, useRef, useState } from "react";

import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import Breadcrumb from "../../components/breadcrumb";
import HolidayCalendar from "../../components/holidayCalendar";

import { getHolidays } from "../../services/teacherApi";

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
                console.error("Failed to fetch holidays:", error);

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
                                View school holidays and important dates
                            </p>
                        </div>

                        {loading ? (
                            <p className="text-gray-600">
                                Loading holidays...
                            </p>
                        ) : (
                            <HolidayCalendar
                                holidays={holidays}
                                editable={false}
                                currentMonth={
                                    new Date(
                                        currentMonth.year,
                                        currentMonth.month - 1,
                                        1
                                    )
                                }
                                onMonthChange={handleMonthChange}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Holidays;