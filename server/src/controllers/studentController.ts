import { Request, Response, NextFunction } from "express";
import Subject from "../models/Subject";
import Student from "../models/Student";
import Mark from "../models/Mark";
import Teacher from "../models/Teacher";
import Attendance from "../models/Attendance";
import Leave from "../models/Leave";

//Leaves
export const applyLeave = async (
    req: Request,
    res: Response
) => {
    try {

        const userId = req.user?.userId;

        const {
            startDate,
            endDate,
            reason
        } = req.body;

        if (
            !startDate ||
            !endDate ||
            !reason?.trim()
        ) {
            return res.status(400).json({
                message:
                    "Start date, end date and reason are required"
            });
        }

        if (endDate < startDate) {
            return res.status(400).json({
                message:
                    "End date cannot be before start date"
            });
        }

        const student = await Student.findOne({
            userId
        });

        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        const leave = await Leave.create({
            studentId: student._id,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            reason: reason.trim(),
            status: "Pending"
        });

        return res.status(201).json(leave);

    }
    catch (error) {

        console.error(
            "Apply leave error:",
            error
        );

        return res.status(500).json({
            message: "Failed to apply for leave"
        });
    }
};

export const getMyLeaves = async (
    req: Request,
    res: Response
) => {
    try {

        const userId = req.user?.userId;

        const student = await Student.findOne({
            userId
        });

        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        const leaves = await Leave.find({
            studentId: student._id
        }).sort({
            createdAt: -1
        });

        return res.status(200).json(leaves);

    }
    catch (error) {

        console.error(
            "Get student leaves error:",
            error
        );

        return res.status(500).json({
            message: "Failed to get leave applications"
        });
    }
};


export const getStudentHome = async (
    req: Request,
    res: Response
) => {
    try {
        const userId = req.user?.userId;

        const student = await Student.findOne({
            userId
        });

        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        const [totalSubjects, totalAttendance, presentAttendance] =
            await Promise.all([
                Subject.countDocuments({
                    class: student.class
                }),

                Attendance.countDocuments({
                    studentId: student._id
                }),

                Attendance.countDocuments({
                    studentId: student._id,
                    status: "Present"
                })
            ]);

        const attendancePercentage =
            totalAttendance === 0
                ? 0
                : Math.round(
                    (presentAttendance / totalAttendance) * 100
                );

        return res.status(200).json({
            class: student.class,
            rollNumber: student.rollNumber,
            attendancePercentage,
            totalSubjects
        });
    }
    catch (error) {
        console.error("Get student home error:", error);

        return res.status(500).json({
            message: "Failed to get student home information"
        });
    }
};

export const getSubjects = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const student = await Student.findOne({
            userId: req.user?.userId
        });

        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        const subjects = await Subject.find({
            class: student.class
        });

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
        const student = await Student.findOne({
            userId: req.user?.userId
        });

        if (!student) {
            return res.status(404).json({
                message: "student not found"
            });
        }

        const marks = await Mark.find({
            studentId: student._id
        }).populate("subjectId", "name")
            .populate({
                path: "teacherId",
                populate: {
                    path: "userId",
                    select: "name"
                }
            });
        res.status(200).json(marks);
    }
    catch (error) {
        next(error);
    }
}

export const getStudents = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const student = await Student.findOne({
            userId: req.user?.userId
        });

        if (!student) {
            return res.status(404).json({
                message: "student not found"
            });
        }

        res.status(200).json(student);
    }

    catch (error) {
        next(error);
    }
}

export const getAttendance = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const student = await Student.findOne({
            userId: req.user?.userId
        }).populate({
            path: "userId",
            select: "name uid"
        });

        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        const attendance = await Attendance.find({
            studentId: student._id
        }).sort({
            date: 1
        });

        const approvedLeaves = await Leave.find({
            studentId: student._id,
            status: "Approved"
        }).sort({
            startDate: 1
        });

        const leaveRecords: any[] = [];

        for (const leave of approvedLeaves) {
            const currentDate = new Date(
                leave.startDate
            );

            const endDate = new Date(
                leave.endDate
            );

            while (currentDate <= endDate) {
                const dateString =
                    currentDate
                        .toISOString()
                        .split("T")[0];

                leaveRecords.push({
                    _id: `${leave._id}-${dateString}`,
                    date: new Date(currentDate),
                    status: "Leave"
                });

                currentDate.setUTCDate(
                    currentDate.getUTCDate() + 1
                );
            }
        }

        const attendanceDates = new Set(
            attendance.map(record =>
                new Date(record.date)
                    .toISOString()
                    .split("T")[0]
            )
        );

        const filteredLeaveRecords =
            leaveRecords.filter(record => {
                const dateString =
                    new Date(record.date)
                        .toISOString()
                        .split("T")[0];

                return !attendanceDates.has(
                    dateString
                );
            });

        const result = [
            ...attendance,
            ...filteredLeaveRecords
        ];

        result.sort(
            (a, b) =>
                new Date(a.date).getTime() -
                new Date(b.date).getTime()
        );

        res.status(200).json({
            student: {
                name: (student.userId as any).name,
                uid: (student.userId as any).uid,
                class: student.class,
                rollNumber: student.rollNumber
            },
            attendance: result
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
};