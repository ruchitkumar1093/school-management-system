import mongoose from "mongoose";
import User from "../src/models/User";
import Teacher from "../src/models/Teacher";
import Subject from "../src/models/Subject";
import Class from "../src/models/Class";
import TeacherAssignment from "../src/models/TeacherAssignment";

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

const subjectNames = [
    "Science",
    "Mathematics",
    "English",
    "Social Science",
    "Hindi"
] as const;

export const up = async () => {
    const classDocuments = await Class.find();
    const subjectDocuments = await Subject.find();

    const users = await User.find({
        role: "teacher",
        uid: {
            $in: Array.from({ length: 60 }, (_, index) =>
                `tch${String(index + 1).padStart(4, "0")}`
            )
        }
    });

    const teachers = await Teacher.find({
        userId: { $in: users.map(user => user._id) }
    });

    if (classDocuments.length < classes.length) {
        throw new Error(
            "Some classes are missing. Run 002_seedClasses first."
        );
    }

    if (teachers.length < 60) {
        throw new Error(
            "Expected 60 demo teachers. Check 001_seedDemoData."
        );
    }

    const classByName = new Map(
        classDocuments.map(item => [item.class, item])
    );

    const subjectByClassAndName = new Map(
        subjectDocuments.map(subject => [
            `${subject.class}-${subject.name}`,
            subject
        ])
    );

    const userById = new Map(
        users.map(user => [user._id.toString(), user])
    );

    const teacherByUID = new Map(
        teachers.map(teacher => {
            const user = userById.get(teacher.userId.toString());

            if (!user) {
                throw new Error(
                    `User not found for teacher ${teacher._id}`
                );
            }

            return [user.uid, teacher] as const;
        })
    );

    const requiredUIDs = ["tch0001", "tch0059", "tch0060"];

    for (const uid of requiredUIDs) {
        if (!teacherByUID.has(uid)) {
            throw new Error(`Teacher ${uid} was not found.`);
        }
    }

    const mainTeacher = teacherByUID.get("tch0001")!;
    const teacher59 = teacherByUID.get("tch0059")!;
    const teacher60 = teacherByUID.get("tch0060")!;

    const assignmentOperations = [];

    let teacherNumber = 1;

    for (const studentClass of classes) {
        const classDocument = classByName.get(studentClass);

        if (!classDocument) {
            throw new Error(`Class ${studentClass} was not found.`);
        }

        for (const subjectName of subjectNames) {
            const teacherUID =
                `tch${String(teacherNumber).padStart(4, "0")}`;

            const teacher = teacherByUID.get(teacherUID);

            const subject = subjectByClassAndName.get(
                `${studentClass}-${subjectName}`
            );

            if (!teacher) {
                throw new Error(`Teacher ${teacherUID} was not found.`);
            }

            if (!subject) {
                throw new Error(
                    `Subject ${subjectName} for class ${studentClass} was not found.`
                );
            }

            assignmentOperations.push({
                updateOne: {
                    filter: {
                        subjectId: subject._id,
                        classId: classDocument._id
                    },
                    update: {
                        $setOnInsert: {
                            teacherId: teacher._id,
                            subjectId: subject._id,
                            classId: classDocument._id
                        }
                    },
                    upsert: true
                }
            });

            // Preserve the existing Class.teacherId design:
            // the first teacher assigned to the class is its class teacher.
            if (subjectName === subjectNames[0]) {
                await Class.updateOne(
                    { _id: classDocument._id },
                    { $set: { teacherId: teacher._id } }
                );
            }

            teacherNumber++;
        }
    }

    if (assignmentOperations.length > 0) {
        await TeacherAssignment.bulkWrite(assignmentOperations);
    }

    // Transfer the assignments of tch0059 and tch0060 to tch0001.
    // Keep the subject/class pair unchanged.
    const transferred = await TeacherAssignment.updateMany(
        {
            teacherId: {
                $in: [teacher59._id, teacher60._id]
            }
        },
        {
            $set: {
                teacherId: mainTeacher._id
            }
        }
    );

    console.log("Teacher assignments seeded successfully.");
    console.log(`Base assignments processed: ${assignmentOperations.length}`);
    console.log(
        `Assignments transferred to tch0001: ${transferred.modifiedCount}`
    );
    console.log(
        "Class teacher references updated successfully."
    );
};