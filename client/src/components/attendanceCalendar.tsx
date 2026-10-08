import { useState } from "react";
import {
    FiChevronLeft,
    FiChevronRight
} from "react-icons/fi";

type AttendanceDay = {
    date: string;
    status: "Present" | "Absent" | "Leave";
};

type Holiday = {
    id: string;
    date: string;
    name: string;
};

type AttendanceCalendarProps = {
    attendance: AttendanceDay[];
    holidays: Holiday[];
};

function AttendanceCalendar({
    attendance,
    holidays
}: AttendanceCalendarProps) {
    const today = new Date();
console.log(attendance);

    const [currentMonth, setCurrentMonth] = useState(
        new Date(
            today.getFullYear(),
            today.getMonth(),
            1
        )
    );

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

    const months = [
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
    ];

    function formatDate(date: Date) {
        const year = date.getFullYear();

        const month = String(
            date.getMonth() + 1
        ).padStart(2, "0");

        const day = String(
            date.getDate()
        ).padStart(2, "0");

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

    function getAttendance(date: Date) {
        const formattedDate = formatDate(date);

        return attendance.find(
            (record) =>
                record.date === formattedDate
        );
    }

    function getHoliday(date: Date) {
        const formattedDate = formatDate(date);

        return holidays.find(
            (holiday) =>
                holiday.date === formattedDate
        );
    }

    function isSunday(date: Date) {
        return date.getDay() === 0;
    }

    function isToday(date: Date) {
        return (
            formatDate(date) ===
            formatDate(today)
        );
    }

    function getStatusClass(
        status: AttendanceDay["status"]
    ) {
        if (status === "Present") {
            return "bg-green-200 text-green-800";
        }

        if (status === "Absent") {
            return "bg-red-200 text-red-800";
        }

        return "bg-yellow-200 text-yellow-800";
    }

    const calendarDays = getCalendarDays();

    return (
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
                            {months.map(
                                (month, index) => (
                                    <option
                                        key={month}
                                        value={index}
                                    >
                                        {month}
                                    </option>
                                )
                            )}
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

                    <p className="mt-1 text-xs text-gray-600">
                        Attendance record
                    </p>
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
                        const attendanceRecord =
                            getAttendance(date);

                        const holiday =
                            getHoliday(date);

                        const sunday =
                            isSunday(date);

                        const todayDate =
                            isToday(date);

                        return (
                            <div
                                key={index}
                                className={`relative min-h-24 border-b border-r border-white p-2 text-left ${
                                    currentMonth
                                        ? "text-gray-900"
                                        : "text-gray-400"
                                }`}
                            >
                                <div className="flex items-start justify-between">
                                    <span
                                        className={`flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                                            todayDate
                                                ? "bg-purple-800 font-medium text-white"
                                                : ""
                                        }`}
                                    >
                                        {date.getDate()}
                                    </span>
                                </div>

                                {currentMonth && sunday ? (
                                    <div className="mt-3 rounded-md bg-gray-200 px-2 py-1 text-center text-xs font-medium text-gray-600">
                                        Sunday
                                    </div>
                                ) : currentMonth && holiday ? (
                                    <div
                                        className="mt-3 rounded-md bg-purple-300 px-2 py-1 text-center text-xs font-medium text-purple-900"
                                        title={holiday.name}
                                    >
                                        <div>Holiday</div>
                                        <div className="truncate">
                                            {holiday.name}
                                        </div>
                                    </div>
                                ) : currentMonth && attendanceRecord ? (
                                    <div
                                        className={`mt-3 rounded-md px-2 py-1 text-center text-xs font-medium ${getStatusClass(
                                            attendanceRecord.status
                                        )}`}
                                    >
                                        {attendanceRecord.status}
                                    </div>
                                ) : null}
                            </div>
                        );
                    }
                )}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-5">
                <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-green-500" />
                    <span className="text-xs text-gray-700">
                        Present
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-red-500" />
                    <span className="text-xs text-gray-700">
                        Absent
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-yellow-500" />
                    <span className="text-xs text-gray-700">
                        Leave
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-purple-600" />
                    <span className="text-xs text-gray-700">
                        Holiday
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-gray-400" />
                    <span className="text-xs text-gray-700">
                        Sunday
                    </span>
                </div>
            </div>
        </div>
    );
}

export default AttendanceCalendar;