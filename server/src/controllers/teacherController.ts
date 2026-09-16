import { Request, Response, NextFunction } from "express";
import Subject from "../models/Subject";
import Mark from "../models/Mark";
import Student from "../models/Student";
import Teacher from "../models/Teacher";
import User from "../models/User";
import Attendance from "../models/Attendance";
import mongoose from "mongoose";


// GET all:
export const getSubjects = async (req: Request, res: Response, next: NextFunction) => {
    try {

        const teacher = await Teacher.findOne({
            userId: req.user?.userId
        });

        if (!teacher) {
            return res.status(404).json({
                message: "teacher not found"
            });
        }

        const subjects = await Subject.find({
            class: teacher.classAssigned
        });
        res.status(200).json(subjects);
    }

    catch (error) {
        next(error);
    }
}

export const getTeacher = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const teacher = await Teacher.findOne({
            userId: req.user?.userId
        });

        if (!teacher) {
            return res.status(404).json({
                message: "teacher not found"
            });
        }

        res.status(200).json(teacher);
    }
    catch (error) {
        next(error);
    }
}

export const getMarks = async (req: Request, res: Response, next: NextFunction) => {
    try {

        const teacher = await Teacher.findOne({
            userId: req.user?.userId
        });

        if (!teacher) {
            return res.status(404).json({
                message: "teacher not found"
            });
        }

        const students = await Student.find({
            class: teacher.classAssigned
        });

        if (students.length === 0) {
            return res.status(404).json({
                message: "student not found"
            });
        }

        const studentIds = students.map(student => student._id);

        const marks = await Mark.find({
            studentId: { $in: studentIds }
        }).populate({
            path: "studentId",
            select: "class userId",
            populate: {
                path: "userId",
                select: "name uid"
            }
        })
            .populate("subjectId");
        res.status(200).json(marks);
    }

    catch (error) {
        next(error);
    }
}

export const getStudents = async (req: Request, res: Response, next: NextFunction) => {
    try {

        const teacher = await Teacher.findOne({
            userId: req.user?.userId
        });

        if (!teacher) {
            return res.status(404).json({
                message: "teacher not found"
            });
        }

        const students = await Student.find({
            class: teacher.classAssigned
        }).populate("userId", "name uid");
        res.status(200).json(students);
    }

    catch (error) {
        next(error);
    }
}


//Student CRUD

export const updateStudent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const {
            name,
            uid,
            rollNumber
        } = req.body;

        const student = await Student.findById(id);

        const teacher = await Teacher.findOne({
            userId: req.user?.userId
        });

        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        await User.findByIdAndUpdate(
            student.userId,
            {
                name,
                uid
            }
        );

        await Student.findByIdAndUpdate(
            id,
            {
                class: teacher?.classAssigned,
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

export const createStudent = async (req: Request, res: Response, next: NextFunction) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const {
            name,
            uid,
            password,
            rollNumber
        } = req.body;

        const teacher = await Teacher.findOne({
            userId: req.user?.userId
        });

        const user = await User.create([{
            name,
            uid,
            password,
            role: "student"
        }], { session });

        await Student.create([{
            userId: user[0]._id,
            class: teacher?.classAssigned,
            rollNumber
        }], { session });

        await session.commitTransaction();

        res.status(200).json({
            message: "student created successfully"
        });
    }
    catch (error) {
        await session.abortTransaction();
        console.log(error);
        next(error);
    }
    finally {
        session.endSession();
    }
}

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

export const getStudentById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const student = await Student.findById(req.params.id).populate("userId", "name uid");

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

//MARKS CRUD:
export const updateMark = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const {
            uid,
            subjectName,
            exam,
            marksObtained,
            totalMarks
        } = req.body;

        const teacher = await Teacher.findOne({
            userId: req.user?.userId
        });

        if (!teacher) {
            return res.status(404).json({
                message: "Teacher not found"
            });
        }

        const user = await User.findOne({ uid });

        if (!user) {
            return res.status(404).json({
                message: "Student user not found"
            });
        }

        const student = await Student.findOne({
            userId: user._id
        });

        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        const subject = await Subject.findOne({
            name: subjectName,
            class: student.class
        });

        if (!subject) {
            return res.status(404).json({
                message: "Subject not found for this student's class"
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

    } catch (error) {
        console.log(error);
        next(error);
    }
};

export const createMark = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {
            uid,
            subjectName,
            exam,
            marksObtained,
            totalMarks
        } = req.body;

        const teacher = await Teacher.findOne({
            userId: req.user?.userId
        });

        if (!teacher) {
            return res.status(404).json({
                message: "Teacher not found"
            });
        }

        const user = await User.findOne({ uid });

        if (!user) {
            return res.status(404).json({
                message: "Student user not found"
            });
        }

        const student = await Student.findOne({
            userId: user._id
        });

        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        const subject = await Subject.findOne({
            name: subjectName,
            class: student.class
        });

        if (!subject) {
            return res.status(404).json({
                message: "Subject not found for this student's class"
            });
        }

        const mark = await Mark.create({
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
}

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
        const teacher = await Teacher.findOne({
            userId: req.user?.userId
        });

        if (!teacher) {
            return res.status(404).json({
                message: "Teacher not found"
            });
        }

        const studentClass = teacher.classAssigned;
        const exam = req.query.exam as ExamType;

        if (!studentClass || !exam) {
            return res.status(400).json({
                message: "Class and exam are required"
            });
        }

        // Get all students of the selected class
        const students = await Student.find({
            class: studentClass
        }).populate({
            path: "userId",
            select: "name uid"
        });

        // Get all subjects available for the selected class
        const subjects = await Subject.find({
            class: studentClass
        }).select("name subjectCode");

        // Get marks for the selected class and exam
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

//Attendance:
export const getStudentsForAttendance = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const teacher = await Teacher.findOne({
            userId: req.user?.userId
        });

        if (!teacher) {
            return res.status(404).json({
                message: "Teacher not found"
            });
        }

        const students = await Student.find({
            class: teacher.classAssigned
        }).populate({
            path: "userId",
            select: "name uid"
        });

        res.status(200).json(students);

    } catch (error) {
        console.log(error);
        next(error);
    }
};

export const createAttendance = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { date, attendance } = req.body;

        // Find the logged-in teacher
        const teacher = await Teacher.findOne({
            userId: req.user?.userId
        });

        if (!teacher) {
            return res.status(404).json({
                message: "Teacher not found"
            });
        }

        // Get all students belonging to the teacher's assigned class
        const students = await Student.find({
            class: teacher.classAssigned
        }).select("_id");

        const studentIds = students.map(student =>
            student._id.toString()
        );

        // Check that all submitted students belong to this teacher's class
        const invalidStudent = attendance.some(
            (record: { studentId: string; status: string }) =>
                !studentIds.includes(record.studentId)
        );

        if (invalidStudent) {
            return res.status(403).json({
                message: "You can only mark attendance for students in your assigned class"
            });
        }

        // Check if attendance has already been submitted for this date
        const existingAttendance = await Attendance.findOne({
            studentId: { $in: studentIds },
            date: new Date(date)
        });

        if (existingAttendance) {
            return res.status(400).json({
                message: "Attendance has already been marked for this date"
            });
        }

        // Prepare attendance records
        const attendanceRecords = attendance.map(
            (record: {
                studentId: string;
                status: "Present" | "Absent";
            }) => ({
                studentId: record.studentId,
                teacherId: teacher._id,
                date: new Date(date),
                status: record.status
            })
        );

        // Save all attendance records
        await Attendance.insertMany(attendanceRecords);

        res.status(201).json({
            message: "Attendance marked successfully"
        });

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

        const teacher = await Teacher.findOne({
            userId: req.user?.userId
        });

        if (!teacher) {
            return res.status(404).json({
                message: "Teacher not found"
            });
        }

        const students = await Student.find({
            class: teacher.classAssigned
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

        const teacher = await Teacher.findOne({
            userId: req.user?.userId
        });

        if (!teacher) {
            return res.status(404).json({
                message: "Teacher not found"
            });
        }

        const student = await Student.findById(studentId);

        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        // Make sure teacher can only view
        // students from their assigned class
        if (student.class !== teacher.classAssigned) {
            return res.status(403).json({
                message: "You can only view attendance for students in your assigned class"
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