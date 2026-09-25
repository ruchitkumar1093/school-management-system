import Class from "../src/models/Class";
import Teacher from "../src/models/Teacher";

export const up = async () => {
    const classes: (
        "1st" |
        "2nd" |
        "3rd" |
        "4th" |
        "5th" |
        "6th" |
        "7th" |
        "8th" |
        "9th" |
        "10th" |
        "11th" |
        "12th"
    )[] = [
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
        ];

    const classData = [];

    for (const studentClass of classes) {
        const teachers = await Teacher.find({
            classAssigned: studentClass
        });

        if (teachers.length === 0) {
            throw new Error(
                `No teacher found for class ${studentClass}`
            );
        }

        const randomTeacher =
            teachers[Math.floor(Math.random() * teachers.length)];

        classData.push({
            class: studentClass,
            teacherId: randomTeacher._id
        });
    }

    await Class.insertMany(classData);

    console.log("Classes seeded successfully");
    console.log(`Classes: ${classData.length}`);
};