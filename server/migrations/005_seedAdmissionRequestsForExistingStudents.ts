import Student from "../src/models/Student";
import AdmissionRequest from "../src/models/AdmissionRequest";
import "../src/models/User";

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

const cities = [
    "Chandigarh",
    "Mohali",
    "Panchkula",
    "Delhi",
    "Ambala",
    "Ludhiana",
    "Patiala",
    "Panipat"
];

const states = [
    "Punjab",
    "Haryana",
    "Himachal Pradesh",
    "Delhi"
];

const bloodGroups = [
    "A+",
    "A-",
    "B+",
    "B-",
    "AB+",
    "AB-",
    "O+",
    "O-"
] as const;

const genders = [
    "Male",
    "Female",
    "Other"
] as const;

const getPreviousClass = (
    studentClass: typeof classes[number]
) => {
    const index = classes.indexOf(studentClass);

    if (index <= 0) {
        return "1st";
    }

    return classes[index - 1];
};

const getRandomItem = <T>(items: readonly T[]) => {
    return items[Math.floor(Math.random() * items.length)];
};

const getRandomDateOfBirth = () => {
    const start = new Date(2008, 0, 1).getTime();
    const end = new Date(2018, 11, 31).getTime();
    return new Date(start + Math.random() * (end - start));
};

const getRandomPhone = (index: number) => {
    return `98${String(index).padStart(8, "0")}`;
};

const getRandomAadhaar = (index: number) => {
    return `${String(100000000000 + index).slice(0, 12)}`;
};

export async function up() {
    const students = await Student.find().populate("userId", "name uid");

    let createdCount = 0;
    let skippedCount = 0;

    for (let index = 0; index < students.length; index++) {
        const student = students[index];

        if (!student.userId || typeof student.userId !== "object") {
            skippedCount++;
            continue;
        }

        const user = student.userId as unknown as {
            _id: string;
            name: string;
            uid: string;
        };

        const existingAdmission = await AdmissionRequest.findOne({
            studentId: student._id
        });

        if (existingAdmission) {
            skippedCount++;
            continue;
        }

        const studentClass =
            student.class as typeof classes[number];
        const city = getRandomItem(cities);
        const state = getRandomItem(states);
        const gender = getRandomItem(genders);
        const bloodGroup = getRandomItem(bloodGroups);

        await AdmissionRequest.create({
            studentName: user.name,
            dateOfBirth: getRandomDateOfBirth(),
            gender,
            classApplyingFor: studentClass,
            previousClass: getPreviousClass(studentClass),
            fatherName: `Father of ${user.name}`,
            motherName: `Mother of ${user.name}`,
            phone: getRandomPhone(index + 1),
            email: `${user.uid}@example.com`,
            address: `${Math.floor(Math.random() * 900) + 100}, Main Street`,
            city,
            state,
            pinCode: String(Math.floor(100000 + Math.random() * 900000)),
            bloodGroup,
            aadhaarNumber: getRandomAadhaar(index + 1),
            academicYear: "2026-27",
            status: "approved",
            userId: user._id,
            studentId: student._id
        });

        createdCount++;
    }

    console.log(`Student admission requests created: ${createdCount}`);
    console.log(`Students skipped: ${skippedCount}`);
}