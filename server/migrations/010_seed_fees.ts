
import mongoose from "mongoose";
import Fee from "../src/models/Fee";
import User from "../src/models/User";

const tuitionFees = [
    { class: "1st", amount: 18000 },
    { class: "2nd", amount: 19200 },
    { class: "3rd", amount: 20400 },
    { class: "4th", amount: 21600 },
    { class: "5th", amount: 22800 },
    { class: "6th", amount: 25200 },
    { class: "7th", amount: 26400 },
    { class: "8th", amount: 27600 },
    { class: "9th", amount: 31200 },
    { class: "10th", amount: 33600 },
    { class: "11th", amount: 38400 },
    { class: "12th", amount: 42000 },
] as const;

const examinationFee = 2000;
const dueDate = new Date("2027-03-31T00:00:00.000Z");

export const up = async () => {
    try {
        // Ensure the Fee collection and its indexes are initialized
        // before performing any fee inserts.
        await Fee.init();

        console.log("Fee collection and indexes initialized.");

        // Find an existing principal to use as createdBy.
        const principal = await User.findOne({
            role: "principal",
        });

        if (!principal) {
            throw new Error(
                "No principal user found. Create a principal before running this migration."
            );
        }

        // Seed tuition fees.
        for (const tuition of tuitionFees) {
            await Fee.updateOne(
                {
                    feeType: "Tuition Fee",
                    class: tuition.class,
                },
                {
                    $setOnInsert: {
                        feeType: "Tuition Fee",
                        class: tuition.class,
                        amount: tuition.amount,
                        dueDate,
                        createdBy: principal._id,
                    },
                },
                {
                    upsert: true,
                }
            );

            console.log(
                `Tuition fee configured for ${tuition.class} class.`
            );
        }

        // Seed the single school-wide examination fee.
        await Fee.updateOne(
            {
                feeType: "Examination Fee",
            },
            {
                $setOnInsert: {
                    feeType: "Examination Fee",
                    class: null,
                    amount: examinationFee,
                    dueDate,
                    createdBy: principal._id,
                },
            },
            {
                upsert: true,
            }
        );

        console.log(
            "Examination fee configured successfully."
        );

        // Verify the final fee configuration count.
        const tuitionCount = await Fee.countDocuments({
            feeType: "Tuition Fee",
        });

        const examinationCount = await Fee.countDocuments({
            feeType: "Examination Fee",
        });

        console.log("--------------------------------");
        console.log("Fee migration completed successfully.");
        console.log(`Tuition fee configurations: ${tuitionCount}`);
        console.log(`Examination fee configurations: ${examinationCount}`);
        console.log(`Total fee configurations: ${tuitionCount + examinationCount}`);
        console.log("--------------------------------");

    } catch (error) {
        console.error("Migration 0010_seed_fees failed:", error);
        throw error;
    }
};
