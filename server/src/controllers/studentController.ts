import { Request, Response, NextFunction } from "express";
import Subject from "../models/Subject";
import Student from "../models/Student";
import User from "../models/User";
import Class from "../models/Class";
import Mark from "../models/Mark";
import Teacher from "../models/Teacher";
import Attendance from "../models/Attendance";
import Leave from "../models/Leave";
import AdmissionRequest from "../models/AdmissionRequest";

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

        const currentPage = Math.max(
            Number(req.query.page) || 1,
            1
        );

        const pageLimit = Math.max(
            Number(req.query.limit) || 5,
            1
        );

        const totalLeaves = await Leave.countDocuments({
            studentId: student._id
        });

        const skip =
            (currentPage - 1) * pageLimit;

        const leaves = await Leave.find({
            studentId: student._id
        })
            .sort({
                createdAt: -1
            })
            .skip(skip)
            .limit(pageLimit);

        const totalPages = Math.ceil(
            totalLeaves / pageLimit
        );

        return res.status(200).json({
            leaves,
            totalLeaves,
            totalPages,
            currentPage,
            limit: pageLimit
        });
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

        const classData = await Class.findOne({
            class: student.class
        });

        let classTeacher = null;

        if (classData?.teacherId) {
            const teacher = await Teacher.findById(
                classData.teacherId
            );

            if (teacher) {
                const teacherUser = await User.findById(
                    teacher.userId
                ).select("name");

                classTeacher = teacherUser?.name ?? null;
            }
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
            totalSubjects,
            classTeacher
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

        const search =
            req.query.search?.toString().trim() || "";

        const order =
            req.query.order?.toString() || "asc";

        const currentPage = Math.max(
            Number(req.query.page) || 1,
            1
        );

        const pageLimit = Math.max(
            Number(req.query.limit) || 5,
            1
        );

        const match: any = {
            class: student.class
        };

        if (search !== "") {
            match.name = {
                $regex: search,
                $options: "i"
            };
        }

        const sortOrder =
            order === "desc" ? -1 : 1;

        const totalSubjects =
            await Subject.countDocuments(match);

        const subjects = await Subject.find(match)
            .sort({
                name: sortOrder
            })
            .skip(
                (currentPage - 1) * pageLimit
            )
            .limit(pageLimit);

        const data = await Promise.all(
            subjects.map(async subject => {

                const teacher =
                    await Teacher.findOne({
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

        const totalPages =
            Math.ceil(
                totalSubjects / pageLimit
            );

        return res.status(200).json({
            subjects: data,
            totalSubjects,
            totalPages,
            currentPage,
            limit: pageLimit
        });
    }
    catch (error) {
        next(error);
    }
};

export const getMarks = async (
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
                message: "student not found"
            });
        }

        const exam =
            req.query.exam?.toString() || "All";

        const search =
            req.query.search?.toString().trim() || "";

        const sortBy =
            req.query.sortBy?.toString() || "None";

        const order =
            req.query.order?.toString() || "asc";

        const currentPage = Math.max(
            Number(req.query.page) || 1,
            1
        );

        const pageLimit = Math.max(
            Number(req.query.limit) || 5,
            1
        );

        const filter: any = {
            studentId: student._id
        };

        if (exam !== "All") {
            filter.exam = exam;
        }

        const marks = await Mark.find(filter)
            .populate("subjectId", "name")
            .populate({
                path: "teacherId",
                populate: {
                    path: "userId",
                    select: "name"
                }
            });

        let filteredMarks = marks;

        if (search !== "") {
            const searchValue = search.toLowerCase();

            filteredMarks = filteredMarks.filter(
                (mark: any) =>
                    mark.subjectId?.name
                        ?.toLowerCase()
                        .includes(searchValue)
            );
        }

        if (sortBy === "Subject Name") {
            filteredMarks.sort((a: any, b: any) => {
                const subjectA = a.subjectId?.name || "";
                const subjectB = b.subjectId?.name || "";

                return subjectA.localeCompare(subjectB);
            });
        }
        else if (sortBy === "Marks Obtained") {
            filteredMarks.sort(
                (a: any, b: any) =>
                    a.marksObtained - b.marksObtained
            );
        }

        if (
            sortBy !== "None" &&
            order === "desc"
        ) {
            filteredMarks.reverse();
        }

        const totalMarks =
            filteredMarks.length;

        const totalPages =
            Math.ceil(totalMarks / pageLimit);

        const skip =
            (currentPage - 1) * pageLimit;

        const paginatedMarks =
            filteredMarks.slice(
                skip,
                skip + pageLimit
            );

        return res.status(200).json({
            marks: paginatedMarks,
            totalMarks,
            totalPages,
            currentPage,
            limit: pageLimit
        });
    }
    catch (error) {
        next(error);
    }
};

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

        const admissionRequest = await AdmissionRequest.findOne({
            studentId: student._id,
            status: "approved"
        }).select(
            "studentName dateOfBirth gender classApplyingFor previousClass fatherName motherName phone email address city state pinCode bloodGroup aadhaarNumber academicYear"
        );

        res.status(200).json({
            class: student.class,
            section: student.section,
            rollNumber: student.rollNumber,
            admissionRequest
        });
    }
    catch (error) {
        next(error);
    }
};

export const getAttendance = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const currentPage = Math.max(
            Number(req.query.page) || 1,
            1
        );

        const pageLimit = Math.max(
            Number(req.query.limit) || 10,
            1
        );

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

        const presentCount =
            result.filter(
                record =>
                    record.status === "Present"
            ).length;

        const absentCount =
            result.filter(
                record =>
                    record.status === "Absent"
            ).length;

        const leaveCount =
            result.filter(
                record =>
                    record.status === "Leave"
            ).length;

        const totalDays =
            presentCount + absentCount;

        const percentage =
            totalDays > 0
                ? Number(
                    (
                        (presentCount /
                            totalDays) *
                        100
                    ).toFixed(2)
                )
                : 0;

        const totalRecords =
            result.length;

        const totalPages =
            Math.ceil(
                totalRecords / pageLimit
            );

        const skip =
            (currentPage - 1) * pageLimit;

        const paginatedAttendance =
            result.slice(
                skip,
                skip + pageLimit
            );

        return res.status(200).json({
            student: {
                name: (student.userId as any).name,
                uid: (student.userId as any).uid,
                class: student.class,
                rollNumber: student.rollNumber
            },
            attendance: paginatedAttendance,
            totalRecords,
            totalPages,
            currentPage,
            limit: pageLimit,
            presentCount,
            absentCount,
            leaveCount,
            totalDays,
            percentage
        });
    }
    catch (error) {
        console.log(error);
        next(error);
    }
};