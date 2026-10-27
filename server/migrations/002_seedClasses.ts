import Class from "../src/models/Class";

const classes = [
    "1st",
    "2nd",
    "3rd",
    "4th",
    "5th",
    "6th",
    "7th",
    "8th",
    "9th",
    "10th",
    "11th",
    "12th"
] as const;

export const up = async () => {
    for (const studentClass of classes) {
        await Class.updateOne(
            { class: studentClass },
            {
                $setOnInsert: {
                    class: studentClass,
                    teacherId: null
                }
            },
            { upsert: true }
        );
    }

    console.log("Classes seeded successfully");
    console.log(`Classes processed: ${classes.length}`);
};