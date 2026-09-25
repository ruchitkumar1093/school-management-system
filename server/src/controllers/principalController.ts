import { Request, Response, NextFunction } from "express";
import User from "../models/User";
import Student from "../models/Student";
import Teacher from "../models/Teacher";
import Subject from "../models/Subject";
import Mark from "../models/Mark";
import Attendance from "../models/Attendance";
import Class from "../models/Class";
import mongoose from "mongoose";
import bcrypt from "bcrypt";

export const getTotal = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const totalStudents = await Student.countDocuments();
        const totalTeachers = await Teacher.countDocuments();
        const totalSubjects = await Subject.countDocuments();
        const totalClasses = (await Student.distinct("class")).length;

        res.status(200).json({
            totalStudents,
            totalTeachers,
            totalSubjects,
            totalClasses
        });
    }

    catch (error) {
        next(error);
    }
}

//GET all
export const getStudents = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await Student.find().populate("userId", "name uid");
        res.status(200).json(data);
    }

    catch (error) {
        next(error);
    }
}

export const getTeachers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await Teacher.find().populate("userId", "name");
        res.status(200).json(data);
    }
    catch (error) {
        next(error);
    }
}

export const getSubjects = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const subjects = await Subject.find();

        const data = await Promise.all(
            subjects.map(async (subject) => {

                const teacher = await Teacher.findOne({
                    department: subject.name,
                    classAssigned: subject.class
                }).populate({
                    path: "userId",
                    select: "name"
                });

                return {
                    ...subject.toObject(),
                    teacherName: teacher
                        ? (teacher.userId as any).name
                        : "Not Assigned"
                };
            })
        );

        res.status(200).json(data);
    }
    catch (error) {
        next(error);
    }
};

export const getMarks = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const marks = await Mark.find().populate({
            path: "studentId",
            select: "class userId",
            populate: {
                path: "userId",
                select: "name uid"
            }
        })
            .populate({
                path: "teacherId",
                select: "userId",
                populate: {
                    path: "userId",
                    select: "name"
                }
            })
            .populate("subjectId");
        res.status(200).json(marks);
    }

    catch (error) {
        next(error);
    }
}

type StudentClass =
    | "1st"
    | "2nd"
    | "3rd"
    | "4th"
    | "5th"
    | "6th"
    | "7th"
    | "8th"
    | "9th"
    | "10th"
    | "11th"
    | "12th";

type ExamType =
    | "class test"
    | "mid term"
    | "final";

export const getExamResults = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const studentClass = req.query.class as StudentClass;
        const exam = req.query.exam as ExamType;

        if (!studentClass || !exam) {
            return res.status(400).json({
                message: "Class and exam are required"
            });
        }

        const students = await Student.find({
            class: studentClass
        }).populate({
            path: "userId",
            select: "name uid"
        });

        const subjects = await Subject.find({
            class: studentClass
        }).select("name subjectCode");

        const marks = await Mark.find({
            studentId: {
                $in: students.map(student => student._id)
            },
            exam
        }).populate({
            path: "subjectId",
            select: "name subjectCode"
        });

        const results = students.map(student => {

            const studentMarks = marks.filter(
                mark =>
                    mark.studentId.toString() ===
                    student._id.toString()
            );

            // Store marks by subject name
            const subjectMarks: Record<
                string,
                {
                    obtained: number;
                    total: number;
                }
            > = {};

            studentMarks.forEach(mark => {
                if (!mark.subjectId) {
                    return;
                }

                const subject = mark.subjectId as any;

                subjectMarks[subject.name] = {
                    obtained: mark.marksObtained,
                    total: mark.totalMarks
                };
            });

            // Subject values for the table
            const science = subjectMarks["Science"] ?? null;

            const mathematics =
                subjectMarks["Mathematics"] ?? null;

            const english =
                subjectMarks["English"] ?? null;

            const socialScience =
                subjectMarks["Social Science"] ?? null;

            const hindi =
                subjectMarks["Hindi"] ?? null;


            /*
             * Only subjects that actually exist
             * for this class are considered required.
             */
            const requiredSubjects = subjects.map(
                subject => subject.name
            );

            let obtainedMarks = 0;
            let totalMarks = 0;

            let hasMissingMarks = false;
            let hasFailedSubject = false;
            let hasAnyMarks = false;

            requiredSubjects.forEach(subjectName => {

                const mark = subjectMarks[subjectName];

                if (!mark) {
                    hasMissingMarks = true;
                    return;
                }

                hasAnyMarks = true;

                obtainedMarks += mark.obtained;
                totalMarks += mark.total;

                const percentage =
                    (mark.obtained / mark.total) * 100;

                if (percentage < 33) {
                    hasFailedSubject = true;
                }
            });


            let percentage: number | null = null;
            let result: string;

            if (!hasAnyMarks) {

                result = "Not Assessed";

            } else if (hasMissingMarks) {

                result = "Incomplete";

            } else {

                percentage =
                    totalMarks > 0
                        ? Number(
                            (
                                (obtainedMarks / totalMarks) *
                                100
                            ).toFixed(2)
                        )
                        : null;

                result = hasFailedSubject
                    ? "Fail"
                    : "Pass";
            }


            return {
                studentName:
                    (student.userId as any)?.name ??
                    "Student Deleted",

                uid:
                    (student.userId as any)?.uid ??
                    "",

                class: student.class,

                science,
                mathematics,
                english,
                socialScience,
                hindi,

                total:
                    hasAnyMarks
                        ? {
                            obtained: obtainedMarks,
                            total: totalMarks
                        }
                        : null,

                percentage,

                result
            };
        });

        res.status(200).json(results);

    } catch (error) {
        console.log(error);
        next(error);
    }
};

// Subject CRUD

export const getSubjectById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const subject = await Subject.findById(req.params.id);

        if (!subject) {
            return res.status(404).json({
                message: "Subject not found"
            });
        }

        res.status(200).json(subject);
    }
    catch (error) {
        next(error);
    }
}

export const createSubject = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {
            name,
            subjectCode,
            class: subjectClass
        } = req.body;

        const existingSubject = await Subject.findOne({
            name,
            class: subjectClass
        });

        if (existingSubject) {
            return res.status(400).json({
                message: "A subject with this name already exists for this class"
            });
        }

        await Subject.create({
            name,
            subjectCode,
            class: subjectClass
        });

        res.status(200).json({
            message: "subject created successfully"
        });
    }
    catch (error) {
        console.log(error);
        next(error);
    }
}

export const updateSubject = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const {
            name,
            subjectCode,
            class: subjectClass
        } = req.body;

        const existingSubject = await Subject.findOne({
            name,
            class: subjectClass,
            _id: { $ne: id }
        });

        if (existingSubject) {
            return res.status(400).json({
                message: "A subject with this name already exists for this class"
            });
        }

        const subject = await Subject.findById(id);

        if (!subject) {
            return res.status(404).json({
                message: "Subject not found"
            });
        }

        await Subject.findByIdAndUpdate(
            id,
            {
                name,
                subjectCode,
                class: subjectClass
            },
            {
                runValidators: true
            }
        );

        res.status(200).json({
            message: "Subject updated successfully"
        });
    }
    catch (error) {
        next(error);
    }
};

export const deleteSubject = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const subject = await Subject.findById(req.params.id);

        if (!subject) {
            return res.status(404).json({
                message: "Subject not found"
            });
        }

        await Subject.findByIdAndDelete(req.params.id);

        res.status(200).json({
            message: "subject Deleted"
        });
    }
    catch (error) {
        next(error);
    }
}

// Teacher CRUD

export const createTeacher = async (req: Request, res: Response, next: NextFunction) => {
    const session = await mongoose.startSession();

    try {
        const {
            name,
            password,
            department,
            classAssigned
        } = req.body;

        const existingTeacher = await Teacher.findOne({
            department,
            classAssigned
        }).session(session);

        if (existingTeacher) {
            return res.status(400).json({
                message: "A teacher is already assigned to this department and class"
            });
        }

        session.startTransaction();

        const teacherUsers = await User.find({
            role: "teacher",
            uid: /^TCH\d+$/i
        })
            .select("uid")
            .session(session);

        let uidNumber = 1;

        for (const teacherUser of teacherUsers) {
            const number = parseInt(
                teacherUser.uid.toUpperCase().replace("TCH", ""),
                10
            );

            if (number >= uidNumber) {
                uidNumber = number + 1;
            }
        }

        const uid = `TCH${String(uidNumber).padStart(4, "0")}`;

        const lastTeacher = await Teacher.findOne()
            .sort({ employeeID: -1 })
            .session(session);

        let employeeNumber = 1;

        if (lastTeacher) {
            employeeNumber =
                parseInt(lastTeacher.employeeID.replace("EMP", ""), 10) + 1;
        }

        const employeeID = `EMP${String(employeeNumber).padStart(4, "0")}`;

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create(
            [
                {
                    name,
                    uid,
                    password: hashedPassword,
                    role: "teacher"
                }
            ],
            { session }
        );

        await Teacher.create(
            [
                {
                    userId: user[0]._id,
                    employeeID,
                    department,
                    classAssigned
                }
            ],
            { session }
        );

        await session.commitTransaction();

        res.status(200).json({
            message: "Teacher created successfully"
        });

    } catch (error) {
        await session.abortTransaction();

        console.log(error);
        next(error);

    } finally {
        await session.endSession();
    }
};

export const deleteTeacher = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const teacher = await Teacher.findById(req.params.id);

        if (!teacher) {
            return res.status(404).json({
                message: "Teacher not found"
            });
        }

        await User.findByIdAndDelete(teacher.userId);
        await Teacher.findByIdAndDelete(req.params.id);

        res.status(200).json({
            message: "teacher Deleted"
        });
    }
    catch (error) {
        next(error);
    }
}

export const getTeacherById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const teacher = await Teacher.findById(req.params.id).populate("userId", "name uid role");

        if (!teacher) {
            return res.status(404).json({
                message: "Teacher not found"
            });
        }

        res.status(200).json(teacher);
    }
    catch (error) {
        next(error);
    }
}

export const updateTeacher = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const {
            name,
            uid,
            password,
            employeeID,
            department,
            classAssigned
        } = req.body;

        const teacher = await Teacher.findById(id);

        if (!teacher) {
            return res.status(404).json({
                message: "Teacher not found"
            });
        }

        const existingTeacher = await Teacher.findOne({
            department,
            classAssigned,
            _id: { $ne: id }
        });

        if (existingTeacher) {
            return res.status(400).json({
                message: "A teacher is already assigned to this department and class"
            });
        }

        const userUpdate: {
            name: string;
            uid: string;
            password?: string;
        } = {
            name,
            uid
        };

        if (password) {
            userUpdate.password = await bcrypt.hash(password, 10);
        }

        await User.findByIdAndUpdate(
            teacher.userId,
            userUpdate
        );

        await Teacher.findByIdAndUpdate(
            id,
            {
                employeeID,
                department,
                classAssigned
            },
            {
                runValidators: true
            }
        );

        res.status(200).json({
            message: "Teacher updated successfully"
        });
    }
    catch (error) {
        next(error);
    }
};

// Students CRUD


export const getStudentById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const student = await Student.findById(req.params.id).populate("userId", "name uid role");

        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        res.status(200).json(student);
    }
    catch (error) {
        next(error);
    }
}

export const updateStudent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const {
            name,
            uid,
            password,
            class: studentClass,
            rollNumber
        } = req.body;

        const student = await Student.findById(id);

        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        const userUpdate: {
            name: string;
            uid: string;
            password?: string;
        } = {
            name,
            uid
        };

        if (password) {
            userUpdate.password = await bcrypt.hash(password, 10);
        }

        await User.findByIdAndUpdate(
            student.userId,
            userUpdate
        );

        await Student.findByIdAndUpdate(
            id,
            {
                class: studentClass,
                rollNumber
            }
        );

        res.status(200).json({
            message: "Student updated successfully"
        });
    }
    catch (error) {
        next(error);
    }
};

export const deleteStudent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const student = await Student.findById(req.params.id);

        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        await User.findByIdAndDelete(student.userId);
        await Student.findByIdAndDelete(req.params.id);

        res.status(200).json({
            message: "student Deleted"
        });
    }
    catch (error) {
        next(error);
    }
}

//Marks CRUD

export const updateMark = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const {
            class: studentClass,
            studentId,
            teacherId,
            subjectName,
            exam,
            marksObtained,
            totalMarks
        } = req.body;


        const student = await Student.findOne({
            _id: studentId,
            class: studentClass
        });

        if (!student) {
            return res.status(404).json({
                message: "Student not found in this class"
            });
        }


        const teacher = await Teacher.findOne({
            _id: teacherId,
            classAssigned: studentClass
        });

        if (!teacher) {
            return res.status(404).json({
                message: "Teacher not found for this class"
            });
        }


        const subject = await Subject.findOne({
            name: subjectName,
            class: studentClass
        });

        if (!subject) {
            return res.status(404).json({
                message: "Subject not found for this class"
            });
        }


        const existingMark = await Mark.findOne({
            studentId: student._id,
            subjectId: subject._id,
            exam,
            _id: { $ne: id }
        });

        if (existingMark) {
            return res.status(400).json({
                message: "Marks for this student, subject and exam already exist"
            });
        }


        const mark = await Mark.findByIdAndUpdate(
            id,
            {
                studentId: student._id,
                teacherId: teacher._id,
                subjectId: subject._id,
                exam,
                marksObtained,
                totalMarks
            },
            {
                new: true,
                runValidators: true
            }
        );


        if (!mark) {
            return res.status(404).json({
                message: "Mark not found"
            });
        }


        res.status(200).json({
            message: "Mark updated successfully",
            mark
        });

    }
    catch (error) {
        console.log(error);
        next(error);
    }
};

export const createMark = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {
            class: studentClass,
            studentId,
            teacherId,
            subjectName,
            exam,
            marksObtained,
            totalMarks
        } = req.body;


        const student = await Student.findOne({
            _id: studentId,
            class: studentClass
        });

        if (!student) {
            return res.status(404).json({
                message: "Student not found in this class"
            });
        }


        const teacher = await Teacher.findOne({
            _id: teacherId,
            classAssigned: studentClass
        });

        if (!teacher) {
            return res.status(404).json({
                message: "Teacher not found for this class"
            });
        }


        const subject = await Subject.findOne({
            name: subjectName,
            class: studentClass
        });

        if (!subject) {
            return res.status(404).json({
                message: "Subject not found for this class"
            });
        }


        const existingMark = await Mark.findOne({
            studentId: student._id,
            subjectId: subject._id,
            exam
        });

        if (existingMark) {
            return res.status(400).json({
                message: "Marks for this student, subject and exam already exist"
            });
        }


        await Mark.create({
            studentId: student._id,
            teacherId: teacher._id,
            subjectId: subject._id,
            exam,
            marksObtained,
            totalMarks
        });


        res.status(201).json({
            message: "mark created successfully"
        });
    }
    catch (error) {
        console.log(error);
        next(error);
    }
};

export const deleteMark = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const mark = await Mark.findByIdAndDelete(id);

        if (!mark) {
            return res.status(404).json({
                message: "Mark not found"
            });
        }

        res.status(200).json({
            message: "Mark deleted successfully"
        });

    } catch (error) {
        console.log(error);
        next(error);
    }
};

export const getMarkById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const mark = await Mark.findById(id)
            .populate({
                path: "studentId",
                populate: {
                    path: "userId",
                    select: "name uid"
                }
            })
            .populate({
                path: "teacherId",
                populate: {
                    path: "userId",
                    select: "name uid"
                }
            })
            .populate("subjectId");

        if (!mark) {
            return res.status(404).json({
                message: "Mark not found"
            });
        }

        res.status(200).json(mark);

    } catch (error) {
        next(error);
    }
};

//Attendance:

export const getAttendanceSummary = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { date } = req.query;

        if (!date || typeof date !== "string") {
            return res.status(400).json({
                message: "Date is required"
            });
        }

        const selectedDate = new Date(date);

        if (isNaN(selectedDate.getTime())) {
            return res.status(400).json({
                message: "Invalid date"
            });
        }

        const students = await Student.find().select("_id class");

        const attendance = await Attendance.find({
            date: selectedDate
        }).select("studentId status");

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

        const summary = classes.map((studentClass) => {
            const classStudents = students.filter(
                (student) => student.class === studentClass
            );

            const classStudentIds = new Set(
                classStudents.map((student) =>
                    student._id.toString()
                )
            );

            const classAttendance = attendance.filter(
                (record) =>
                    classStudentIds.has(
                        record.studentId.toString()
                    )
            );

            const present = classAttendance.filter(
                (record) => record.status === "Present"
            ).length;

            const absent = classAttendance.filter(
                (record) => record.status === "Absent"
            ).length;

            const total = present + absent;

            const percentage =
                total > 0
                    ? (present / total) * 100
                    : 0;

            return {
                class: studentClass,
                present,
                absent,
                percentage
            };
        });

        res.status(200).json(summary);

    } catch (error) {
        console.log(error);
        next(error);
    }
};

export const getStudentsForAttendance = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const studentClass = req.query.class as
            | "1st"
            | "2nd"
            | "3rd"
            | "4th"
            | "5th"
            | "6th"
            | "7th"
            | "8th"
            | "9th"
            | "10th"
            | "11th"
            | "12th";

        if (!studentClass) {
            return res.status(400).json({
                message: "Class is required"
            });
        }

        const students = await Student.find({
            class: studentClass
        })
            .populate({
                path: "userId",
                select: "name uid"
            })
            .sort({
                rollNumber: 1
            });

        res.status(200).json(students);

    } catch (error) {
        console.log(error);
        next(error);
    }
};

export const getStudentAttendance = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { studentId } = req.query;

        if (!studentId || typeof studentId !== "string") {
            return res.status(400).json({
                message: "Student ID is required"
            });
        }

        const student = await Student.findById(studentId);

        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        const attendance = await Attendance.find({
            studentId: student._id
        })
            .populate({
                path: "studentId",
                select: "class rollNumber userId",
                populate: {
                    path: "userId",
                    select: "name uid"
                }
            })
            .sort({
                date: 1
            });

        res.status(200).json(attendance);

    } catch (error) {
        console.log(error);
        next(error);
    }
};

export const getAttendance = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const studentClass = req.query.class as
            | "1st"
            | "2nd"
            | "3rd"
            | "4th"
            | "5th"
            | "6th"
            | "7th"
            | "8th"
            | "9th"
            | "10th"
            | "11th"
            | "12th";
        const date = req.query.date;

        if (!studentClass || typeof studentClass !== "string") {
            return res.status(400).json({
                message: "Class is required"
            });
        }

        if (!date || typeof date !== "string") {
            return res.status(400).json({
                message: "Date is required"
            });
        }

        const selectedDate = new Date(date);

        if (isNaN(selectedDate.getTime())) {
            return res.status(400).json({
                message: "Invalid date"
            });
        }

        const students = await Student.find({
            class: studentClass
        }).select("_id");

        const studentIds = students.map(
            (student) => student._id
        );

        const attendance = await Attendance.find({
            studentId: {
                $in: studentIds
            },
            date: selectedDate
        })
            .populate({
                path: "studentId",
                select: "class rollNumber userId",
                populate: {
                    path: "userId",
                    select: "name uid"
                }
            });

        res.status(200).json(attendance);
    } catch (error) {
        console.log(error);
        next(error);
    }
};

export const getClassOverview = async (req: Request, res: Response) => {
    try {
        const studentClass = req.params.class as
            | "1st"
            | "2nd"
            | "3rd"
            | "4th"
            | "5th"
            | "6th"
            | "7th"
            | "8th"
            | "9th"
            | "10th"
            | "11th"
            | "12th";

        const classData = await Class.findOne({
            class: studentClass
        });

        if (!classData) {
            return res.status(404).json({
                message: "Class not found"
            });
        }

        const classTeacher = await Teacher.findById(
            classData.teacherId
        );

        if (!classTeacher) {
            return res.status(404).json({
                message: "Class teacher not found"
            });
        }

        const classTeacherUser = await User.findById(
            classTeacher.userId
        ).select("name uid");

        const students = await Student.find({
            class: studentClass
        }).select("_id");

        const studentIds = students.map(
            (student) => student._id
        );

        const studentCount = students.length;

        const teacherCount = await Teacher.countDocuments({
            classAssigned: studentClass
        });

        const subjectCount = await Subject.countDocuments({
            class: studentClass
        });

        const attendanceRecords = await Attendance.find({
            studentId: {
                $in: studentIds
            }
        }).select("status");

        const totalAttendance = attendanceRecords.length;

        const presentAttendance = attendanceRecords.filter(
            (attendance) =>
                attendance.status === "Present"
        ).length;

        const overallAttendance =
            totalAttendance === 0
                ? 0
                : Math.round(
                    (presentAttendance / totalAttendance) * 100
                );

        return res.status(200).json({
            class: studentClass,

            classTeacher: {
                name: classTeacherUser?.name ?? "N/A",
                employeeID: classTeacher.employeeID,
                uid: classTeacherUser?.uid ?? "N/A"
            },

            students: studentCount,

            teachers: teacherCount,

            subjects: subjectCount,

            overallAttendance
        });
    }
    catch (error) {
        console.error(
            "Get class overview error:",
            error
        );

        return res.status(500).json({
            message: "Failed to get class overview"
        });
    }
};