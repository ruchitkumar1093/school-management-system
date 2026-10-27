import Mark from "../src/models/Mark";

type ExamType = "class test" | "mid term" | "final";

export const up = async () => {
    const examMaxMarks: Record<ExamType, number> = {
        "class test": 40,
        "mid term": 80,
        "final": 100
    };

    const exams: ExamType[] = ["class test", "mid term", "final"];

    for (const exam of exams) {
        const newTotalMarks = examMaxMarks[exam];
        const marks = await Mark.find({ exam });

        let updatedCount = 0;

        for (const mark of marks) {
            const oldTotalMarks = mark.totalMarks;

            if (oldTotalMarks <= 0) {
                console.warn(
                    `Skipping mark ${mark._id}: invalid totalMarks`
                );
                continue;
            }

            const marksObtained = Math.round(
                (mark.marksObtained / oldTotalMarks) * newTotalMarks
            );

            await Mark.updateOne(
                { _id: mark._id },
                {
                    $set: {
                        totalMarks: newTotalMarks,
                        marksObtained: Math.min(
                            marksObtained,
                            newTotalMarks
                        )
                    }
                }
            );

            updatedCount++;
        }

        console.log(
            `${exam}: Updated ${updatedCount} records. Maximum marks: ${newTotalMarks}`
        );
    }

    console.log("Migration 009 completed successfully.");
};