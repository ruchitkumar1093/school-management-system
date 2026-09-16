import { Request, Response, NextFunction } from "express";
import Subject from "../models/Subject";
import Student from "../models/Student";
import Mark from "../models/Mark";
import Teacher from "../models/Teacher";
import Attendance from "../models/Attendance";

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

        res.status(200).json({
            student: {
                name: (student.userId as any).name,
                uid: (student.userId as any).uid,
                class: student.class,
                rollNumber: student.rollNumber
            },
            attendance
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
};