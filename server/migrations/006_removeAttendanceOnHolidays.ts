import Attendance from "../src/models/Attendance";
import Holiday from "../src/models/Holiday";

export async function up() {
    const holidays = await Holiday.find().select("date");

    if (holidays.length === 0) {
        console.log(
            "006_removeAttendanceOnHolidays: no holidays found"
        );
        return;
    }

    const holidayDates = holidays.map(
        (holiday) => holiday.date
    );

    const result = await Attendance.deleteMany({
        date: {
            $in: holidayDates
        }
    });

    console.log(
        `006_removeAttendanceOnHolidays: deleted ${result.deletedCount} attendance records`
    );
}