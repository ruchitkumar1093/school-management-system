import bcrypt from "bcrypt";
import User from "../src/models/User";
import Teacher from "../src/models/Teacher";
import Student from "../src/models/Student";
import Subject from "../src/models/Subject";
import Mark from "../src/models/Mark";
import Attendance from "../src/models/Attendance";
import AdmissionRequest from "../src/models/AdmissionRequest";

export const up = async () => {
    const hashedPassword = await bcrypt.hash("12345", 10);

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
    ];

    const subjects = [
        {
            name: "Science",
            prefix: "SCI"
        },
        {
            name: "Mathematics",
            prefix: "MTH"
        },
        {
            name: "English",
            prefix: "ENG"
        },
        {
            name: "Social Science",
            prefix: "SSC"
        },
        {
            name: "Hindi",
            prefix: "HND"
        }
    ];

    const firstNames = [
        "Amit",
        "Priya",
        "Neha",
        "Rahul",
        "Pooja",
        "Ankit",
        "Ritu",
        "Vikas",
        "Sneha",
        "Manish",
        "Kavita",
        "Suresh"
    ];

    const lastNames = [
        "Sharma",
        "Verma",
        "Gupta",
        "Mehta",
        "Singh",
        "Kumar",
        "Malhotra",
        "Yadav",
        "Kapoor",
        "Joshi",
        "Rao",
        "Patel"
    ];

    const studentFirstNames = [
        "Aarav",
        "Vivaan",
        "Aditya",
        "Arjun",
        "Kabir",
        "Anaya",
        "Diya",
        "Myra",
        "Ishita",
        "Anika",
        "Riya",
        "Meera",
        "Vihaan",
        "Reyansh",
        "Aadhya"
    ];

    const studentLastNames = [
        "Sharma",
        "Verma",
        "Gupta",
        "Mehta",
        "Singh",
        "Kumar",
        "Malhotra",
        "Yadav",
        "Kapoor",
        "Joshi",
        "Rao",
        "Patel",
        "Bansal",
        "Chopra",
        "Sethi"
    ];

    const principal = await User.create({
        name: "Rajesh Kumar",
        uid: "pri0001",
        password: hashedPassword,
        role: "principal"
    });

    const teachersData: {
        uid: string;
        employeeID: string;
        name: string;
        department: string;
        classAssigned: string;
    }[] = [];

    let teacherNumber = 1;

    classes.forEach((studentClass, classIndex) => {
        subjects.forEach((subject, subjectIndex) => {
            teachersData.push({
                uid: `tch${String(teacherNumber).padStart(4, "0")}`,
                employeeID: `EMP${String(teacherNumber).padStart(4, "0")}`,
                name: `${firstNames[(classIndex + subjectIndex) % firstNames.length]} ${lastNames[(classIndex + subjectIndex) % lastNames.length]}`,
                department: subject.name,
                classAssigned: studentClass
            });

            teacherNumber++;
        });
    });

    const teacherUsers = await User.insertMany(
        teachersData.map((teacher) => ({
            name: teacher.name,
            uid: teacher.uid,
            password: hashedPassword,
            role: "teacher"
        }))
    );

    const teachers = await Teacher.insertMany(
        teachersData.map((teacher, index) => ({
            userId: teacherUsers[index]._id,
            employeeID: teacher.employeeID,
            department: teacher.department,
            classAssigned: teacher.classAssigned
        }))
    );

    const studentsData: {
        name: string;
        uid: string;
        class: string;
        section: "A" | "B" | "C" | "D";
        rollNumber: number;
    }[] = [];

    let studentNumber = 1;

    classes.forEach((studentClass) => {
        for (let rollNumber = 1; rollNumber <= 5; rollNumber++) {
            const nameIndex = (studentNumber - 1) % studentFirstNames.length;

            studentsData.push({
                name: `${studentFirstNames[nameIndex]} ${studentLastNames[nameIndex]}`,
                uid: `stu${String(studentNumber).padStart(4, "0")}`,
                class: studentClass,
                section: ["A", "B", "C", "D"][(rollNumber - 1) % 4] as "A" | "B" | "C" | "D",
                rollNumber
            });

            studentNumber++;
        }
    });

    const studentUsers = await User.insertMany(
        studentsData.map((student) => ({
            name: student.name,
            uid: student.uid,
            password: hashedPassword,
            role: "student"
        }))
    );

    const students = await Student.insertMany(
        studentsData.map((student, index) => ({
            userId: studentUsers[index]._id,
            class: student.class,
            section: student.section,
            rollNumber: student.rollNumber
        }))
    );

    const subjectsData: {
        name: string;
        subjectCode: string;
        class: string;
    }[] = [];

    classes.forEach((studentClass, classIndex) => {
        const classNumber = String(classIndex + 1).padStart(2, "0");

        subjects.forEach((subject) => {
            subjectsData.push({
                name: subject.name,
                subjectCode: `${subject.prefix}${classNumber}`,
                class: studentClass
            });
        });
    });

    const createdSubjects = await Subject.insertMany(subjectsData);

    const teacherForSubject = new Map<string, typeof teachers[0]>();

    teachers.forEach((teacher, index) => {
        const teacherData = teachersData[index];

        teacherForSubject.set(
            `${teacherData.classAssigned}-${teacherData.department}`,
            teacher
        );
    });

    const marksData: {
        studentId: typeof students[0]["_id"];
        teacherId: typeof teachers[0]["_id"];
        subjectId: typeof createdSubjects[0]["_id"];
        exam: string;
        marksObtained: number;
        totalMarks: number;
    }[] = [];

    const examTypes = [
        "class test",
        "mid term",
        "final"
    ];

    for (let studentIndex = 0; studentIndex < students.length; studentIndex++) {
        const student = students[studentIndex];

        const studentSubjects = createdSubjects.filter(
            (subject) => subject.class === student.class
        );

        for (let subjectIndex = 0; subjectIndex < studentSubjects.length; subjectIndex++) {
            const subject = studentSubjects[subjectIndex];

            const teacher = teacherForSubject.get(
                `${student.class}-${subject.name}`
            );

            if (!teacher) {
                continue;
            }

            for (let examIndex = 0; examIndex < examTypes.length; examIndex++) {
                const exam = examTypes[examIndex];

                if (
                    studentIndex === 0 &&
                    exam === "final"
                ) {
                    marksData.push({
                        studentId: student._id,
                        teacherId: teacher._id,
                        subjectId: subject._id,
                        exam,
                        marksObtained: 80 - subjectIndex * 2,
                        totalMarks: 100
                    });

                    continue;
                }

                if (
                    studentIndex === 1 &&
                    exam === "final"
                ) {
                    marksData.push({
                        studentId: student._id,
                        teacherId: teacher._id,
                        subjectId: subject._id,
                        exam,
                        marksObtained:
                            subjectIndex === 1
                                ? 25
                                : 75 - subjectIndex,
                        totalMarks: 100
                    });

                    continue;
                }

                if (
                    studentIndex === 2 &&
                    exam === "final" &&
                    subjectIndex >= 2
                ) {
                    continue;
                }

                if (
                    studentIndex === 3 &&
                    exam === "final"
                ) {
                    continue;
                }

                const marksObtained =
                    55 +
                    ((studentIndex + subjectIndex + examIndex) % 35);

                marksData.push({
                    studentId: student._id,
                    teacherId: teacher._id,
                    subjectId: subject._id,
                    exam,
                    marksObtained,
                    totalMarks: 100
                });
            }
        }
    }

    await Mark.insertMany(marksData);

    const attendanceDates = [
        new Date("2026-09-01"),
        new Date("2026-09-02"),
        new Date("2026-09-03"),
        new Date("2026-09-04"),
        new Date("2026-09-05"),
        new Date("2026-09-08"),
        new Date("2026-09-09"),
        new Date("2026-09-10"),
        new Date("2026-09-11"),
        new Date("2026-09-12")
    ];

    const teacherForClass = new Map<string, typeof teachers[0]>();

    teachers.forEach((teacher, index) => {
        const teacherData = teachersData[index];

        if (!teacherForClass.has(teacherData.classAssigned)) {
            teacherForClass.set(
                teacherData.classAssigned,
                teacher
            );
        }
    });

    const attendanceData: {
        studentId: typeof students[0]["_id"];
        teacherId: typeof teachers[0]["_id"];
        date: Date;
        status: "Present" | "Absent";
    }[] = [];

    students.forEach((student, studentIndex) => {
        const teacher = teacherForClass.get(student.class);

        if (!teacher) {
            return;
        }

        attendanceDates.forEach((date, dateIndex) => {
            const isAbsent =
                (studentIndex + dateIndex) % 5 === 0 ||
                (studentIndex === 1 && dateIndex === 3);

            attendanceData.push({
                studentId: student._id,
                teacherId: teacher._id,
                date,
                status: isAbsent ? "Absent" : "Present"
            });
        });
    });

    await Attendance.insertMany(attendanceData);

    const admissionRequests = [
        {
            studentName: "Arnav Sharma",
            dateOfBirth: new Date("2013-04-15"),
            gender: "Male",
            classApplyingFor: "8th",
            previousClass: "7th",
            fatherName: "Rakesh Sharma",
            motherName: "Sunita Sharma",
            phone: "9876543210",
            email: "arnav.sharma@example.com",
            address: "Model Town",
            city: "Panipat",
            state: "Haryana",
            pinCode: "132103",
            bloodGroup: "B+",
            aadhaarNumber: "123456789012",
            academicYear: "2026-27",
            status: "pending"
        },
        {
            studentName: "Ananya Verma",
            dateOfBirth: new Date("2012-08-21"),
            gender: "Female",
            classApplyingFor: "9th",
            previousClass: "8th",
            fatherName: "Sanjay Verma",
            motherName: "Kiran Verma",
            phone: "9876501234",
            email: "ananya.verma@example.com",
            address: "Sector 12",
            city: "Panipat",
            state: "Haryana",
            pinCode: "132103",
            bloodGroup: "A+",
            aadhaarNumber: "234567890123",
            academicYear: "2026-27",
            status: "pending"
        },
        {
            studentName: "Devansh Gupta",
            dateOfBirth: new Date("2014-01-12"),
            gender: "Male",
            classApplyingFor: "7th",
            previousClass: "6th",
            fatherName: "Amit Gupta",
            motherName: "Poonam Gupta",
            phone: "9812345678",
            email: "devansh.gupta@example.com",
            address: "GT Road",
            city: "Panipat",
            state: "Haryana",
            pinCode: "132103",
            bloodGroup: "O+",
            aadhaarNumber: "345678901234",
            academicYear: "2026-27",
            status: "pending"
        },
        {
            studentName: "Simran Kaur",
            dateOfBirth: new Date("2011-06-10"),
            gender: "Female",
            classApplyingFor: "10th",
            previousClass: "9th",
            fatherName: "Harpreet Singh",
            motherName: "Manpreet Kaur",
            phone: "9898989898",
            email: "simran.kaur@example.com",
            address: "Urban Estate",
            city: "Panipat",
            state: "Haryana",
            pinCode: "132103",
            bloodGroup: "AB+",
            aadhaarNumber: "456789012345",
            academicYear: "2026-27",
            status: "rejected"
        },
        {
            studentName: "Yash Malhotra",
            dateOfBirth: new Date("2013-11-03"),
            gender: "Male",
            classApplyingFor: "8th",
            previousClass: "7th",
            fatherName: "Vivek Malhotra",
            motherName: "Neelam Malhotra",
            phone: "9765432109",
            email: "yash.malhotra@example.com",
            address: "Ashok Vihar",
            city: "Panipat",
            state: "Haryana",
            pinCode: "132103",
            bloodGroup: "O-",
            aadhaarNumber: "567890123456",
            academicYear: "2026-27",
            status: "rejected"
        }
    ];

    await AdmissionRequest.insertMany(admissionRequests);

    console.log("Demo data seeded successfully");
    console.log(`Principal: ${principal.uid}`);
    console.log(`Teachers: ${teachers.length}`);
    console.log(`Students: ${students.length}`);
    console.log(`Subjects: ${createdSubjects.length}`);
    console.log(`Marks: ${marksData.length}`);
    console.log(`Attendance: ${attendanceData.length}`);
    console.log(`Admission Requests: ${admissionRequests.length}`);
    console.log("Default password for all users: 12345");
};