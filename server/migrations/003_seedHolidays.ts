import mongoose from "mongoose";
import Holiday from "../src/models/Holiday";

export async function up() {
    const holidays = [
        // 2026
        {
            date: new Date("2026-01-26"),
            name: "Republic Day"
        },
        {
            date: new Date("2026-03-04"),
            name: "Holi"
        },
        {
            date: new Date("2026-04-14"),
            name: "Ambedkar Jayanti"
        },
        {
            date: new Date("2026-05-01"),
            name: "Labour Day"
        },
        {
            date: new Date("2026-08-15"),
            name: "Independence Day"
        },
        {
            date: new Date("2026-08-28"),
            name: "Janmashtami"
        },
        {
            date: new Date("2026-10-02"),
            name: "Gandhi Jayanti"
        },
        {
            date: new Date("2026-10-20"),
            name: "Dussehra"
        },
        {
            date: new Date("2026-11-08"),
            name: "Diwali"
        },
        {
            date: new Date("2026-11-09"),
            name: "Diwali Holiday"
        },
        {
            date: new Date("2026-11-24"),
            name: "Guru Nanak Jayanti"
        },
        {
            date: new Date("2026-12-25"),
            name: "Christmas"
        },

        // 2027
        {
            date: new Date("2027-01-01"),
            name: "New Year's Day"
        },
        {
            date: new Date("2027-01-26"),
            name: "Republic Day"
        },
        {
            date: new Date("2027-03-22"),
            name: "Holi"
        },
        {
            date: new Date("2027-04-14"),
            name: "Ambedkar Jayanti"
        },
        {
            date: new Date("2027-05-01"),
            name: "Labour Day"
        },
        {
            date: new Date("2027-08-15"),
            name: "Independence Day"
        },
        {
            date: new Date("2027-09-03"),
            name: "Janmashtami"
        },
        {
            date: new Date("2027-10-02"),
            name: "Gandhi Jayanti"
        },
        {
            date: new Date("2027-10-08"),
            name: "Dussehra"
        },
        {
            date: new Date("2027-10-29"),
            name: "Diwali"
        },
        {
            date: new Date("2027-11-24"),
            name: "Guru Nanak Jayanti"
        },
        {
            date: new Date("2027-12-25"),
            name: "Christmas"
        }
    ];

    await Holiday.deleteMany({});

    await Holiday.insertMany(holidays);

    console.log(
        `003_seedHolidays: inserted ${holidays.length} holidays`
    );
}