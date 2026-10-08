import { useState } from "react";

import {
    FiChevronLeft,
    FiChevronRight,
    FiX
} from "react-icons/fi";

type Holiday = {
    id: string;
    date: string;
    name: string;
};

type HolidayCalendarProps = {
    holidays: Holiday[];
    attendanceDates?: string[];
    editable?: boolean;
    onAddHoliday?: (date: string, name: string) => Promise<void>;
    onUpdateHoliday?: (
        id: string,
        date: string,
        name: string
    ) => Promise<void>;
    onDeleteHoliday?: (id: string) => Promise<void>;
};

function HolidayCalendar({
    holidays,
    attendanceDates = [],
    editable = true,
    onAddHoliday,
    onUpdateHoliday,
    onDeleteHoliday
}: HolidayCalendarProps) {

    const today = new Date();

    const [currentMonth, setCurrentMonth] = useState(
        new Date(today.getFullYear(), today.getMonth(), 1)
    );

    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [holidayName, setHolidayName] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const year = currentMonth.getFullYear();

    const weekdays = [
        "Sun",
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat"
    ];

    function formatDate(date: Date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    function getCalendarDays() {
        const firstDay = new Date(
            year,
            currentMonth.getMonth(),
            1
        ).getDay();

        const daysInMonth = new Date(
            year,
            currentMonth.getMonth() + 1,
            0
        ).getDate();

        const previousMonthDays = new Date(
            year,
            currentMonth.getMonth(),
            0
        ).getDate();

        const days = [];

        for (let i = firstDay - 1; i >= 0; i--) {
            const day = previousMonthDays - i;

            days.push({
                date: new Date(
                    year,
                    currentMonth.getMonth() - 1,
                    day
                ),
                currentMonth: false
            });
        }

        for (
            let day = 1;
            day <= daysInMonth;
            day++
        ) {
            days.push({
                date: new Date(
                    year,
                    currentMonth.getMonth(),
                    day
                ),
                currentMonth: true
            });
        }

        let nextDay = 1;

        while (days.length < 42) {
            days.push({
                date: new Date(
                    year,
                    currentMonth.getMonth() + 1,
                    nextDay
                ),
                currentMonth: false
            });

            nextDay++;
        }

        return days;
    }

    function previousMonth() {
        setCurrentMonth(
            new Date(
                year,
                currentMonth.getMonth() - 1,
                1
            )
        );
    }

    function nextMonth() {
        setCurrentMonth(
            new Date(
                year,
                currentMonth.getMonth() + 1,
                1
            )
        );
    }

    function hasAttendance(date: string) {
        return attendanceDates.includes(date);
    }

    function openDate(date: Date) {
        if (!editable) {
            return;
        }

        const formattedDate = formatDate(date);

        const existingHoliday = holidays.find(
            (holiday) =>
                holiday.date === formattedDate
        );

        setSelectedDate(formattedDate);
        setErrorMessage("");

        if (hasAttendance(formattedDate)) {
            setHolidayName("");
            setIsModalOpen(true);
            return;
        }

        setHolidayName(
            existingHoliday
                ? existingHoliday.name
                : ""
        );

        setIsModalOpen(true);
    }

    function closeModal() {
        if (saving) {
            return;
        }

        setIsModalOpen(false);
        setSelectedDate(null);
        setHolidayName("");
        setErrorMessage("");
    }

    async function saveHoliday() {
        if (
            !selectedDate ||
            !holidayName.trim() ||
            saving
        ) {
            return;
        }

        if (hasAttendance(selectedDate)) {
            setErrorMessage(
                "A holiday cannot be added because attendance has already been marked for this date"
            );
            return;
        }

        setErrorMessage("");

        const existingHoliday = holidays.find(
            (holiday) =>
                holiday.date === selectedDate
        );

        try {
            setSaving(true);

            if (existingHoliday) {
                if (onUpdateHoliday) {
                    await onUpdateHoliday(
                        existingHoliday.id,
                        selectedDate,
                        holidayName.trim()
                    );
                }
            } else {
                if (onAddHoliday) {
                    await onAddHoliday(
                        selectedDate,
                        holidayName.trim()
                    );
                }
            }

            setIsModalOpen(false);
            setSelectedDate(null);
            setHolidayName("");
            setErrorMessage("");
        }
        catch (error: any) {
            console.error(
                "Failed to save holiday:",
                error
            );

            setErrorMessage(
                error?.message ||
                "Failed to save holiday"
            );
        }
        finally {
            setSaving(false);
        }
    }

    async function deleteHoliday() {
        if (!selectedDate || saving) {
            return;
        }

        const existingHoliday = holidays.find(
            (holiday) =>
                holiday.date === selectedDate
        );

        if (!existingHoliday) {
            return;
        }

        setErrorMessage("");

        try {
            setSaving(true);

            if (onDeleteHoliday) {
                await onDeleteHoliday(
                    existingHoliday.id
                );
            }

            setIsModalOpen(false);
            setSelectedDate(null);
            setHolidayName("");
            setErrorMessage("");
        }
        catch (error: any) {
            console.error(
                "Failed to delete holiday:",
                error
            );

            setErrorMessage(
                error?.message ||
                "Failed to delete holiday"
            );
        }
        finally {
            setSaving(false);
        }
    }

    function getHoliday(date: Date) {
        return holidays.find(
            (holiday) =>
                holiday.date === formatDate(date)
        );
    }

    function isToday(date: Date) {
        return (
            formatDate(date) ===
            formatDate(today)
        );
    }

    const calendarDays = getCalendarDays();

    const existingSelectedHoliday = selectedDate
        ? holidays.some(
            (holiday) =>
                holiday.date === selectedDate
        )
        : false;

    const selectedDateHasAttendance = selectedDate
        ? hasAttendance(selectedDate)
        : false;

    return (
        <>
            <div className="w-full max-w-3xl rounded-2xl bg-purple-200 p-6 shadow-sm">

                <div className="mb-6 flex items-center justify-between">

                    <button
                        type="button"
                        onClick={previousMonth}
                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-purple-300"
                    >
                        <FiChevronLeft className="text-xl" />
                    </button>

                    <div className="flex flex-col items-center">

                        <div className="mb-3 flex items-center gap-2">

                            <select
                                value={currentMonth.getMonth()}
                                onChange={(e) => {
                                    setCurrentMonth(
                                        new Date(
                                            currentMonth.getFullYear(),
                                            Number(e.target.value),
                                            1
                                        )
                                    );
                                }}
                                className="cursor-pointer rounded-lg bg-purple-100 px-3 py-1.5 text-lg font-medium text-gray-900 outline-none transition-colors"
                            >
                                {[
                                    "January",
                                    "February",
                                    "March",
                                    "April",
                                    "May",
                                    "June",
                                    "July",
                                    "August",
                                    "September",
                                    "October",
                                    "November",
                                    "December"
                                ].map((month, index) => (
                                    <option
                                        key={month}
                                        value={index}
                                    >
                                        {month}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={
                                    currentMonth.getFullYear()
                                }
                                onChange={(e) => {
                                    setCurrentMonth(
                                        new Date(
                                            Number(e.target.value),
                                            currentMonth.getMonth(),
                                            1
                                        )
                                    );
                                }}
                                className="cursor-pointer rounded-lg bg-purple-100 px-3 py-1.5 text-lg font-medium text-gray-900 outline-none transition-colors"
                            >
                                {Array.from(
                                    { length: 21 },
                                    (_, index) =>
                                        today.getFullYear() -
                                        10 +
                                        index
                                ).map(
                                    (yearOption) => (
                                        <option
                                            key={yearOption}
                                            value={yearOption}
                                        >
                                            {yearOption}
                                        </option>
                                    )
                                )}
                            </select>

                        </div>

                        {editable && (
                            <p className="mt-1 text-xs text-gray-600">
                                Select a date to mark a holiday
                            </p>
                        )}

                    </div>

                    <button
                        type="button"
                        onClick={nextMonth}
                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-purple-300"
                    >
                        <FiChevronRight className="text-xl" />
                    </button>

                </div>

                <div className="grid grid-cols-7 border-b border-white">

                    {weekdays.map((day) => (
                        <div
                            key={day}
                            className="py-3 text-center text-sm font-medium text-purple-900"
                        >
                            {day}
                        </div>
                    ))}

                </div>

                <div className="grid grid-cols-7 border-l border-white">

                    {calendarDays.map(
                        (
                            {
                                date,
                                currentMonth
                            },
                            index
                        ) => {

                            const holiday =
                                getHoliday(date);

                            const todayDate =
                                isToday(date);

                            const isSunday =
                                date.getDay() === 0;

                            return (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() =>
                                        openDate(date)
                                    }
                                    disabled={!editable}
                                    className={`relative min-h-24 border-b border-r border-white p-2 text-left transition-colors
                                    ${currentMonth
                                            ? "text-gray-900"
                                            : "text-gray-400"
                                        }
                                    ${editable
                                            ? "cursor-pointer hover:bg-purple-300"
                                            : "cursor-default"
                                        }`}
                                >

                                    <div className="flex items-start justify-between">

                                        <span
                                            className={`flex h-7 w-7 items-center justify-center rounded-full text-sm
                                            ${todayDate
                                                    ? "bg-purple-800 font-medium text-white"
                                                    : ""
                                                }`}
                                        >
                                            {date.getDate()}
                                        </span>

                                        {holiday && (
                                            <span
                                                className="mt-2 mr-1 h-2 w-2 rounded-full bg-purple-800"
                                            />
                                        )}

                                    </div>

                                    {holiday && (
                                        <p
                                            className="mt-2 truncate rounded-md bg-purple-300 px-2 py-1 text-xs font-medium text-purple-900"
                                            title={holiday.name}
                                        >
                                            {holiday.name}
                                        </p>
                                    )}

                                    {editable &&
                                        isSunday &&
                                        !holiday && (
                                            <p className="mt-2 text-xs text-gray-500">
                                                Sunday
                                            </p>
                                        )}

                                </button>
                            );
                        }
                    )}

                </div>

                {editable && (
                    <div className="mt-5 flex flex-wrap gap-5 text-xs text-gray-700">

                        <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-purple-800" />
                            Holiday
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-gray-400" />
                            Sunday
                        </div>

                    </div>
                )}

            </div>

            {isModalOpen && selectedDate && (

                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">

                    <div className="w-full max-w-md rounded-2xl bg-purple-200 p-6 shadow-xl">

                        {selectedDateHasAttendance ? (

                            <>
                                <div className="mb-6 flex items-center justify-between">

                                    <div>

                                        <h2 className="text-xl font-medium text-gray-900">
                                            Cannot Add Holiday
                                        </h2>

                                        <p className="mt-1 text-sm text-gray-600">
                                            {new Date(
                                                selectedDate +
                                                "T00:00:00"
                                            ).toLocaleDateString(
                                                "en-IN",
                                                {
                                                    day: "numeric",
                                                    month: "long",
                                                    year: "numeric"
                                                }
                                            )}
                                        </p>

                                    </div>

                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        disabled={saving}
                                        className="cursor-pointer rounded-lg p-2 transition-colors hover:bg-purple-300 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <FiX className="text-lg" />
                                    </button>

                                </div>

                                <div className="rounded-lg border border-red-300 bg-red-100 px-4 py-3 text-sm text-red-700">
                                    Attendance has already been marked for this date. A holiday cannot be added to this date.
                                </div>

                                <div className="mt-6 flex justify-end">

                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="cursor-pointer rounded-lg bg-purple-800 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-900"
                                    >
                                        Close
                                    </button>

                                </div>
                            </>

                        ) : (

                            <>
                                <div className="mb-6 flex items-center justify-between">

                                    <div>

                                        <h2 className="text-xl font-medium text-gray-900">

                                            {existingSelectedHoliday
                                                ? "Edit Holiday"
                                                : "Mark Holiday"
                                            }

                                        </h2>

                                        <p className="mt-1 text-sm text-gray-600">

                                            {new Date(
                                                selectedDate +
                                                "T00:00:00"
                                            ).toLocaleDateString(
                                                "en-IN",
                                                {
                                                    day: "numeric",
                                                    month: "long",
                                                    year: "numeric"
                                                }
                                            )}

                                        </p>

                                    </div>

                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        disabled={saving}
                                        className="cursor-pointer rounded-lg p-2 transition-colors hover:bg-purple-300 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <FiX className="text-lg" />
                                    </button>

                                </div>

                                <div className="flex flex-col gap-2">

                                    <label
                                        htmlFor="holidayName"
                                        className="text-sm font-medium text-gray-800"
                                    >
                                        Holiday Name
                                    </label>

                                    <input
                                        id="holidayName"
                                        type="text"
                                        value={holidayName}
                                        onChange={(e) =>
                                            setHolidayName(
                                                e.target.value
                                            )
                                        }
                                        placeholder="Enter holiday name"
                                        disabled={saving}
                                        className="w-full rounded-lg border-2 border-purple-400 bg-purple-100 px-4 py-3 text-gray-900 outline-none transition-colors focus:border-purple-800 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                                    />

                                </div>

                                {errorMessage && (
                                    <div className="mt-4 rounded-lg border border-red-300 bg-red-100 px-4 py-3 text-sm text-red-700">
                                        {errorMessage}
                                    </div>
                                )}

                                <div className="mt-6 flex items-center justify-between">

                                    <div>

                                        {existingSelectedHoliday && (
                                            <button
                                                type="button"
                                                onClick={
                                                    deleteHoliday
                                                }
                                                disabled={saving}
                                                className="cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {saving
                                                    ? "Please wait..."
                                                    : "Delete"
                                                }
                                            </button>
                                        )}

                                    </div>

                                    <div className="flex gap-3">

                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            disabled={saving}
                                            className="cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-purple-300 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>

                                        <button
                                            type="button"
                                            onClick={saveHoliday}
                                            disabled={
                                                !holidayName.trim() ||
                                                saving
                                            }
                                            className="cursor-pointer rounded-lg bg-purple-800 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-900 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {saving
                                                ? "Saving..."
                                                : existingSelectedHoliday
                                                    ? "Update Holiday"
                                                    : "Save Holiday"
                                            }
                                        </button>

                                    </div>

                                </div>

                            </>

                        )}

                    </div>

                </div>

            )}

        </>
    );
}

export default HolidayCalendar;