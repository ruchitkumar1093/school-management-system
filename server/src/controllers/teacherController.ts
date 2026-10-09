import { Request, Response, NextFunction } from "express";
import Subject from "../models/Subject";
import Mark from "../models/Mark";
import Student from "../models/Student";
import Teacher from "../models/Teacher";
import User from "../models/User";
import Attendance from "../models/Attendance";
import mongoose from "mongoose";
import Leave from "../models/Leave";
import AdmissionRequest from "../models/AdmissionRequest";
import Holiday from "../models/Holiday";

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

        const teacher = await Teacher.findOne({
            userId
        });

        if (!teacher) {
            return res.status(404).json({
                message: "Teacher not found"
            });
        }

        const leave = await Leave.create({
            teacherId: teacher._id,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            reason: reason.trim(),
            status: "Pending"
        });

        return res.status(201).json(leave);
    }
    catch (error) {
        console.error(
            "Apply teacher leave error:",
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

        const teacher = await Teacher.findOne({
            userId
        });

        if (!teacher) {
            return res.status(404).json({
                message: "Teacher not found"
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
            teacherId: teacher._id
        });

        const skip =
            (currentPage - 1) * pageLimit;

        const leaves = await Leave.find({
            teacherId: teacher._id
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
            "Get teacher leaves error:",
            error
        );

        return res.status(500).json({
            message: "Failed to get leave applications"
        });
    }
};

export const getLeaveApplications = async (
    req: Request,
    res: Response
) => {
    try {
        const userId = req.user?.userId;

        const teacher = await Teacher.findOne({
            userId
        });

        if (!teacher) {
            return res.status(404).json({
                message: "Teacher not found"
            });
        }

        const status =
            req.query.status?.toString() || "All";

        const currentPage = Math.max(
            Number(req.query.page) || 1,
            1
        );

        const pageLimit = Math.max(
            Number(req.query.limit) || 5,
            1
        );

        if (
            status !== "All" &&
            status !== "Pending" &&
            status !== "Approved" &&
            status !== "Rejected"
        ) {
            return res.status(400).json({
                message: "Invalid leave status"
            });
        }

        const students = await Student.find({
            class: teacher.classAssigned
        }).select("_id");

        const studentIds = students.map(
            student => student._id
        );

        const filter: any = {
            studentId: {
                $in: studentIds
            }
        };

        if (status !== "All") {
            filter.status = status;
        }

        const totalLeaves =
            await Leave.countDocuments(filter);

        const skip =
            (currentPage - 1) * pageLimit;

        const leaves = await Leave.find(filter)
            .sort({
                createdAt: -1
            })
            .skip(skip)
            .limit(pageLimit)
            .populate({
                path: "studentId",
                select: "userId",
                populate: {
                    path: "userId",
                    select: "name uid"
                }
            });

        const formattedLeaves = leaves.map(
            leave => {
                const student =
                    leave.studentId as any;

                return {
                    _id: leave._id,
                    student: {
                        _id: student._id,
                        name: student.userId.name,
                        uid: student.userId.uid
                    },
                    startDate: leave.startDate,
                    endDate: leave.endDate,
                    reason: leave.reason,
                    status: leave.status
                };
            }
        );

        const totalPages =
            Math.ceil(
                totalLeaves / pageLimit
            );

        return res.status(200).json({
            leaves: formattedLeaves,
            totalLeaves,
            totalPages,
            currentPage,
            limit: pageLimit
        });
    }
    catch (error) {
        console.error(
            "Get teacher leave applications error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to get leave applications"
        });
    }
};

export const approveLeave = async (
    req: Request,
    res: Response
) => {
    try {

        const userId = req.user?.userId;

        const { id } = req.params;


        // Find logged-in teacher
        const teacher = await Teacher.findOne({
            userId
        });

        if (!teacher) {
            return res.status(404).json({
                message: "Teacher not found"
            });
        }


        // Find leave
        const leave = await Leave.findById(id);

        if (!leave) {
            return res.status(404).json({
                message: "Leave application not found"
            });
        }


        // Find student who applied
        const student = await Student.findById(
            leave.studentId
        );

        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }


        // Make sure student belongs to teacher's class
        if (
            student.class !==
            teacher.classAssigned
        ) {
            return res.status(403).json({
                message:
                    "You are not authorized to manage this leave application"
            });
        }


        // Only pending leaves can be approved
        if (leave.status !== "Pending") {
            return res.status(400).json({
                message:
                    "Only pending leave applications can be approved"
            });
        }


        leave.status = "Approved";

        await leave.save();


        return res.status(200).json({
            message:
                "Leave application approved successfully",
            leave
        });

    }
    catch (error) {

        console.error(
            "Approve leave error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to approve leave application"
        });

    }
};

export const rejectLeave = async (
    req: Request,
    res: Response
) => {
    try {

        const userId = req.user?.userId;

        const { id } = req.params;


        // Find logged-in teacher
        const teacher = await Teacher.findOne({
            userId
        });

        if (!teacher) {
            return res.status(404).json({
                message: "Teacher not found"
            });
        }


        // Find leave
        const leave = await Leave.findById(id);

        if (!leave) {
            return res.status(404).json({
                message: "Leave application not found"
            });
        }


        // Find student who applied
        const student = await Student.findById(
            leave.studentId
        );

        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }


        // Make sure student belongs to teacher's class
        if (
            student.class !==
            teacher.classAssigned
        ) {
            return res.status(403).json({
                message:
                    "You are not authorized to manage this leave application"
            });
        }


        // Only pending leaves can be rejected
        if (leave.status !== "Pending") {
            return res.status(400).json({
                message:
                    "Only pending leave applications can be rejected"
            });
        }


        leave.status = "Rejected";

        await leave.save();


        return res.status(200).json({
            message:
                "Leave application rejected successfully",
            leave
        });

    }
    catch (error) {

        console.error(
            "Reject leave error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to reject leave application"
        });

    }
};

export const getTeacherHome = async (
    req: Request,
    res: Response
) => {
    try {
        const userId = req.user?.userId;

        const teacher = await Teacher.findOne({
            userId: userId
        });

        if (!teacher) {
            return res.status(404).json({
                message: "Teacher profile not found"
            });
        }

        return res.status(200).json({
            employeeID: teacher.employeeID,
            department: teacher.department,
            classAssigned: teacher.classAssigned
        });
    }
    catch (error) {
        console.error(
            "Get teacher home error:",
            error
        );

        return res.status(500).json({
            message: "Failed to get teacher home information"
        });
    }
};

// GET all:
export const getSubjects = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
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

        const teacher = await Teacher.findOne({
            userId: req.user?.userId
        });

        if (!teacher) {
            return res.status(404).json({
                message: "teacher not found"
            });
        }

        const match: any = {
            class: teacher.classAssigned
        };

        if (search !== "") {
            match.name = {
                $regex: search,
                $options: "i"
            };
        }

        const sortOrder =
            order === "desc" ? -1 : 1;

        const skip =
            (currentPage - 1) * pageLimit;

        const totalSubjects =
            await Subject.countDocuments(match);

        const subjects =
            await Subject.find(match)
                .sort({
                    name: sortOrder
                })
                .skip(skip)
                .limit(pageLimit);

        const totalPages =
            Math.ceil(
                totalSubjects / pageLimit
            );

        return res.status(200).json({
            subjects,
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

export const getMarks = async (
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
                message: "teacher not found"
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

        const subject =
            req.query.subject?.toString() || "All";

        const currentPage = Math.max(
            Number(req.query.page) || 1,
            1
        );

        const pageLimit = Math.max(
            Number(req.query.limit) || 5,
            1
        );

        const students = await Student.find({
            class: teacher.classAssigned
        }).select("_id");

        const studentIds = students.map(
            student => student._id
        );

        if (studentIds.length === 0) {
            return res.status(200).json({
                marks: [],
                totalMarks: 0,
                totalPages: 0,
                currentPage,
                limit: pageLimit
            });
        }

        const pipeline: any[] = [
            {
                $match: {
                    studentId: {
                        $in: studentIds
                    }
                }
            },
            {
                $lookup: {
                    from: "students",
                    localField: "studentId",
                    foreignField: "_id",
                    as: "studentId"
                }
            },
            {
                $unwind: "$studentId"
            },
            {
                $lookup: {
                    from: "users",
                    localField: "studentId.userId",
                    foreignField: "_id",
                    as: "studentUser"
                }
            },
            {
                $unwind: "$studentUser"
            },
            {
                $lookup: {
                    from: "subjects",
                    localField: "subjectId",
                    foreignField: "_id",
                    as: "subjectId"
                }
            },
            {
                $unwind: "$subjectId"
            }
        ];

        if (exam !== "All") {
            pipeline.push({
                $match: {
                    exam
                }
            });
        }

        if (subject !== "All") {
            pipeline.push({
                $match: {
                    "subjectId.name": subject
                }
            });
        }

        if (search !== "") {
            pipeline.push({
                $match: {
                    "studentUser.name": {
                        $regex: search,
                        $options: "i"
                    }
                }
            });
        }

        if (sortBy === "Student Name") {
            pipeline.push({
                $sort: {
                    "studentUser.name":
                        order === "desc" ? -1 : 1
                }
            });
        }
        else if (sortBy === "Subject Name") {
            pipeline.push({
                $sort: {
                    "subjectId.name":
                        order === "desc" ? -1 : 1
                }
            });
        }
        else if (sortBy === "Marks Obtained") {
            pipeline.push({
                $sort: {
                    marksObtained:
                        order === "desc" ? -1 : 1
                }
            });
        }
        else {
            pipeline.push({
                $sort: {
                    _id: 1
                }
            });
        }

        const skip =
            (currentPage - 1) * pageLimit;

        pipeline.push({
            $facet: {
                marks: [
                    {
                        $skip: skip
                    },
                    {
                        $limit: pageLimit
                    }
                ],
                total: [
                    {
                        $count: "count"
                    }
                ]
            }
        });

        const result =
            await Mark.aggregate(pipeline);

        const marks =
            result[0]?.marks || [];

        const totalMarks =
            result[0]?.total[0]?.count || 0;

        const totalPages =
            Math.ceil(
                totalMarks / pageLimit
            );

        const formattedMarks = marks.map(
            (mark: any) => ({
                _id: mark._id,
                studentId: {
                    class: mark.studentId.class,
                    userId: {
                        name: mark.studentUser.name,
                        uid: mark.studentUser.uid
                    }
                },
                subjectId: {
                    name: mark.subjectId.name
                },
                exam: mark.exam,
                marksObtained: mark.marksObtained,
                totalMarks: mark.totalMarks
            })
        );

        return res.status(200).json({
            marks: formattedMarks,
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

export const getStudents = async (
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
                message: "teacher not found"
            });
        }

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

        const skip =
            (currentPage - 1) * pageLimit;

        const match: any = {
            class: teacher.classAssigned
        };

        const pipeline: any[] = [
            {
                $match: match
            },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "userId"
                }
            },
            {
                $unwind: "$userId"
            }
        ];

        if (search !== "") {
            pipeline.push({
                $match: {
                    "userId.name": {
                        $regex: search,
                        $options: "i"
                    }
                }
            });
        }

        if (sortBy === "Student Name") {
            pipeline.push({
                $sort: {
                    "userId.name": order === "desc" ? -1 : 1
                }
            });
        }
        else if (sortBy === "Class") {
            pipeline.push({
                $addFields: {
                    classNumber: {
                        $toInt: {
                            $getField: {
                                field: "match",
                                input: {
                                    $regexFind: {
                                        input: "$class",
                                        regex: "\\d+"
                                    }
                                }
                            }
                        }
                    }
                }
            });

            pipeline.push({
                $sort: {
                    classNumber: order === "desc" ? -1 : 1,
                    "userId.name": 1
                }
            });
        }
        else if (sortBy === "Roll no") {
            pipeline.push({
                $sort: {
                    rollNumber: order === "desc" ? -1 : 1
                }
            });
        }
        else {
            pipeline.push({
                $sort: {
                    rollNumber: 1
                }
            });
        }

        pipeline.push({
            $facet: {
                students: [
                    {
                        $skip: skip
                    },
                    {
                        $limit: pageLimit
                    }
                ],
                total: [
                    {
                        $count: "count"
                    }
                ]
            }
        });

        const result =
            await Student.aggregate(pipeline);

        const students =
            result[0]?.students || [];

        const totalStudents =
            result[0]?.total[0]?.count || 0;

        const totalPages =
            Math.ceil(totalStudents / pageLimit);

        res.status(200).json({
            students,
            totalStudents,
            totalPages,
            currentPage,
            limit: pageLimit
        });
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
        const student = await Student.findById(req.params.id).populate("userId", "name uid role");

        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        const admissionRequest = await AdmissionRequest.findOne({
            studentId: student._id
        }).select(
            "studentName dateOfBirth gender classApplyingFor previousClass fatherName motherName phone email address city state pinCode bloodGroup aadhaarNumber academicYear"
        );

        res.status(200).json({
            ...student.toObject(),
            admissionRequest
        });
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
            studentId,
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


        const student = await Student.findById(studentId);

        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }


        if (student.class !== teacher.classAssigned) {
            return res.status(400).json({
                message: "Student does not belong to your assigned class"
            });
        }


        const subject = await Subject.findOne({
            name: subjectName,
            class: teacher.classAssigned
        });

        if (!subject) {
            return res.status(404).json({
                message: "Subject not found for your assigned class"
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
            studentId,
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


        const student = await Student.findById(studentId);

        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }


        if (student.class !== teacher.classAssigned) {
            return res.status(400).json({
                message: "Student does not belong to your assigned class"
            });
        }


        const subject = await Subject.findOne({
            name: subjectName,
            class: teacher.classAssigned
        });

        if (!subject) {
            return res.status(404).json({
                message: "Subject not found for your assigned class"
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

        const examValue =
            req.query.exam?.toString() || "";

        if (
            examValue !== "class test" &&
            examValue !== "mid term" &&
            examValue !== "final"
        ) {
            return res.status(400).json({
                message: "Invalid exam type"
            });
        }

        const exam = examValue as ExamType;

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
                $in: students.map(
                    student => student._id
                )
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

                const subject =
                    mark.subjectId as any;

                subjectMarks[subject.name] = {
                    obtained: mark.marksObtained,
                    total: mark.totalMarks
                };
            });

            const science =
                subjectMarks["Science"] ?? null;

            const mathematics =
                subjectMarks["Mathematics"] ?? null;

            const english =
                subjectMarks["English"] ?? null;

            const socialScience =
                subjectMarks["Social Science"] ?? null;

            const hindi =
                subjectMarks["Hindi"] ?? null;

            const requiredSubjects =
                subjects.map(
                    subject => subject.name
                );

            let obtainedMarks = 0;
            let totalMarks = 0;

            let hasMissingMarks = false;
            let hasFailedSubject = false;
            let hasAnyMarks = false;

            requiredSubjects.forEach(
                subjectName => {

                    const mark =
                        subjectMarks[subjectName];

                    if (!mark) {
                        hasMissingMarks = true;
                        return;
                    }

                    hasAnyMarks = true;

                    obtainedMarks +=
                        mark.obtained;

                    totalMarks +=
                        mark.total;

                    const percentage =
                        mark.total > 0
                            ? (mark.obtained / mark.total) * 100
                            : 0;

                    if (percentage < 33) {
                        hasFailedSubject = true;
                    }
                }
            );

            let percentage: number | null = null;
            let result: string;

            if (!hasAnyMarks) {
                result = "Not Assessed";
            }
            else if (hasMissingMarks) {
                result = "Incomplete";
            }
            else {
                percentage =
                    totalMarks > 0
                        ? Number(
                            (
                                (obtainedMarks /
                                    totalMarks) *
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

        let filteredResults = results;

        if (search !== "") {
            const searchValue =
                search.toLowerCase();

            filteredResults =
                filteredResults.filter(
                    student =>
                        student.studentName
                            .toLowerCase()
                            .includes(searchValue) ||
                        student.uid
                            .toLowerCase()
                            .includes(searchValue)
                );
        }

        if (sortBy === "Student Name") {
            filteredResults.sort(
                (a, b) =>
                    a.studentName.localeCompare(
                        b.studentName
                    )
            );
        }
        else if (sortBy === "UID") {
            filteredResults.sort(
                (a, b) =>
                    a.uid.localeCompare(b.uid)
            );
        }
        else if (sortBy === "Total Marks") {
            filteredResults.sort(
                (a, b) =>
                    (a.total?.obtained ?? 0) -
                    (b.total?.obtained ?? 0)
            );
        }
        else if (sortBy === "Percentage") {
            filteredResults.sort(
                (a, b) =>
                    (a.percentage ?? -1) -
                    (b.percentage ?? -1)
            );
        }

        if (
            sortBy !== "None" &&
            order === "desc"
        ) {
            filteredResults.reverse();
        }

        const totalResults =
            filteredResults.length;

        const totalPages =
            Math.ceil(
                totalResults / pageLimit
            );

        const skip =
            (currentPage - 1) * pageLimit;

        const paginatedResults =
            filteredResults.slice(
                skip,
                skip + pageLimit
            );

        return res.status(200).json({
            results: paginatedResults,
            totalResults,
            totalPages,
            currentPage,
            limit: pageLimit
        });
    }
    catch (error) {
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
        const date = req.query.date?.toString() || "";
        const search = req.query.search?.toString().trim() || "";

        const currentPage = Math.max(
            Number(req.query.page) || 1,
            1
        );

        const pageLimit = Math.max(
            Number(req.query.limit) || 10,
            1
        );

        if (!date) {
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


        const classStudentIds = await Student.find({
            class: teacher.classAssigned
        }).distinct("_id");

        const attendanceMarked = await Attendance.exists({
            studentId: { $in: classStudentIds },
            date: selectedDate
        });

        const studentFilter: any = {
            class: teacher.classAssigned
        };

        /*
         * Search by student name or UID.
         * Since name and UID are stored in User,
         * first find matching users and then use
         * their IDs to filter students.
         */
        if (search) {
            const searchRegex = {
                $regex: search,
                $options: "i"
            };

            const matchingUsers = await User.find({
                $or: [
                    { name: searchRegex },
                    { uid: searchRegex }
                ]
            }).select("_id");

            studentFilter.userId = {
                $in: matchingUsers.map(user => user._id)
            };
        }

        /*
         * Get total number of students matching
         * the class + search filters.
         */
        const totalStudents =
            await Student.countDocuments(studentFilter);

        const totalPages =
            Math.ceil(totalStudents / pageLimit);

        /*
         * Prevent requesting a page beyond the
         * available pages.
         */
        const validPage =
            totalPages > 0
                ? Math.min(currentPage, totalPages)
                : 1;

        const skip =
            (validPage - 1) * pageLimit;

        /*
         * Fetch ONLY the students needed for
         * the current page.
         *
         * rollNumber is used for sorting but is
         * not returned to the frontend.
         */
        const students = await Student.find(
            studentFilter
        )
            .select("_id userId")
            .populate({
                path: "userId",
                select: "name uid"
            })
            .sort({
                rollNumber: 1
            })
            .skip(skip)
            .limit(pageLimit);

        /*
         * Only check leaves for the students
         * that are actually being displayed.
         */
        const studentIds = students.map(
            student => student._id
        );

        const approvedLeaves = await Leave.find({
            status: "Approved",
            startDate: { $lte: selectedDate },
            endDate: { $gte: selectedDate },
            studentId: {
                $in: studentIds
            }
        }).select("studentId");

        const studentsOnLeave = new Set(
            approvedLeaves
                .filter(leave => leave.studentId)
                .map(leave =>
                    leave.studentId!.toString()
                )
        );

        const existingAttendance = await Attendance.find({
            date: selectedDate,
            studentId: { $in: studentIds }
        }).select("studentId status");

        const attendanceMap = new Map(
            existingAttendance.map(record => [
                record.studentId.toString(),
                record.status
            ])
        );

        const paginatedStudents = students.map(student => ({
            _id: student._id,
            userId: student.userId,
            onLeave: studentsOnLeave.has(student._id.toString()),
            attendanceStatus: attendanceMap.get(student._id.toString()) ?? null
        }));

        return res.status(200).json({
            class: teacher.classAssigned,
            students: paginatedStudents,
            attendanceMarked: Boolean(attendanceMarked),
            totalStudents,
            totalPages,
            currentPage: validPage,
            limit: pageLimit
        });
    }
    catch (error) {
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
        const {
            date,
            attendance = [],
            markAll = null
        } = req.body;

        if (!date) {
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

        if (selectedDate.getDay() === 0) {
            return res.status(400).json({
                message:
                    "Attendance cannot be marked on Sunday"
            });
        }

        const holiday = await Holiday.findOne({
            date: selectedDate
        });

        if (holiday) {
            return res.status(400).json({
                message:
                    `Attendance cannot be marked because ${holiday.name} is a holiday`
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

        /*
         * markAll can only be:
         * "Present", "Absent", or null.
         */
        if (
            markAll !== null &&
            markAll !== "Present" &&
            markAll !== "Absent"
        ) {
            return res.status(400).json({
                message: "Invalid markAll value"
            });
        }

        /*
         * Get all students belonging to the
         * teacher's assigned class.
         */
        const students = await Student.find({
            class: teacher.classAssigned
        }).select("_id");

        const studentIds = students.map(
            student => student._id.toString()
        );

        /*
         * Make a Set for faster ID lookup.
         */
        const studentIdSet = new Set(studentIds);

        /*
         * Validate every student ID sent by
         * the frontend.
         */
        const invalidStudent = attendance.some(
            (record: {
                studentId: string;
                status: string;
            }) =>
                !studentIdSet.has(record.studentId)
        );

        if (invalidStudent) {
            return res.status(403).json({
                message:
                    "You can only mark attendance for students in your assigned class"
            });
        }

        /*
         * Validate attendance status values.
         */
        const invalidStatus = attendance.some(
            (record: {
                studentId: string;
                status: string;
            }) =>
                record.status !== "Present" &&
                record.status !== "Absent"
        );

        if (invalidStatus) {
            return res.status(400).json({
                message: "Invalid attendance status"
            });
        }

        /*
         * Check whether attendance already exists
         * for this class/date.
         */
        const existingAttendance =
            await Attendance.findOne({
                studentId: {
                    $in: studentIds
                },
                date: selectedDate
            });

        if (existingAttendance) {
            return res.status(400).json({
                message:
                    "Attendance has already been marked for this date"
            });
        }

        /*
         * Find students who have an approved leave
         * on the selected date.
         */
        const approvedLeaves = await Leave.find({
            status: "Approved",
            startDate: { $lte: selectedDate },
            endDate: { $gte: selectedDate },
            studentId: {
                $in: studentIds
            }
        }).select("studentId");

        const leaveStudentIds = new Set(
            approvedLeaves
                .filter(leave => leave.studentId)
                .map(leave =>
                    leave.studentId!.toString()
                )
        );

        /*
         * Store individual attendance records
         * in a Map.
         *
         * If a student appears more than once,
         * the last value will be used.
         */
        const individualAttendance =
            new Map<
                string,
                "Present" | "Absent"
            >();

        attendance.forEach(
            (record: {
                studentId: string;
                status: "Present" | "Absent";
            }) => {
                individualAttendance.set(
                    record.studentId,
                    record.status
                );
            }
        );

        /*
         * Create attendance for every student
         * who is NOT on approved leave.
         *
         * Priority:
         *
         * 1. Individual attendance
         * 2. markAll
         * 3. No attendance
         */
        const attendanceRecords: {
            studentId: string;
            teacherId: typeof teacher._id;
            date: Date;
            status: "Present" | "Absent";
        }[] = [];

        const missingStudentIds: string[] = [];

        for (const studentId of studentIds) {

            /*
             * Students on approved leave do not
             * need attendance.
             */
            if (leaveStudentIds.has(studentId)) {
                continue;
            }

            const individualStatus =
                individualAttendance.get(studentId);

            const finalStatus =
                individualStatus ?? markAll;

            /*
             * If neither an individual status nor
             * markAll exists, attendance is missing.
             */
            if (!finalStatus) {
                missingStudentIds.push(studentId);
                continue;
            }

            attendanceRecords.push({
                studentId,
                teacherId: teacher._id,
                date: selectedDate,
                status: finalStatus
            });
        }

        /*
         * Every non-leave student must have a status.
         */
        if (missingStudentIds.length > 0) {
            return res.status(400).json({
                message:
                    "Please mark attendance for all students before submitting."
            });
        }

        /*
         * There should normally be at least one
         * attendance record unless every student
         * is on leave.
         */
        if (attendanceRecords.length === 0) {
            return res.status(400).json({
                message:
                    "No attendance records to submit."
            });
        }

        await Attendance.insertMany(
            attendanceRecords
        );

        return res.status(201).json({
            message:
                "Attendance marked successfully"
        });
    }
    catch (error) {
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
        const date =
            req.query.date?.toString() || "";

        const search =
            req.query.search?.toString().trim() || "";

        const currentPage = Math.max(
            Number(req.query.page) || 1,
            1
        );

        const pageLimit = Math.max(
            Number(req.query.limit) || 10,
            1
        );

        if (!date) {
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
        }).lean();

        if (!teacher) {
            return res.status(404).json({
                message: "Teacher not found"
            });
        }

        const studentFilter: any = {
            class: teacher.classAssigned
        };

        if (search) {
            const searchRegex = {
                $regex: search,
                $options: "i"
            };

            const matchingUsers = await User.find({
                $or: [
                    { name: searchRegex },
                    { uid: searchRegex }
                ]
            })
                .select("_id")
                .lean();

            studentFilter.userId = {
                $in: matchingUsers.map(
                    user => user._id
                )
            };
        }

        const students = await Student.find(
            studentFilter
        )
            .select("_id class rollNumber userId")
            .populate({
                path: "userId",
                select: "name uid"
            })
            .sort({
                rollNumber: 1
            })
            .lean();

        const studentIds = students.map(
            student => student._id
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
            })
            .lean();

        const approvedLeaves = await Leave.find({
            studentId: {
                $in: studentIds
            },
            status: "Approved",
            startDate: {
                $lte: selectedDate
            },
            endDate: {
                $gte: selectedDate
            }
        })
            .select("_id studentId")
            .lean();

        const leaveStudentIds = new Set(
            approvedLeaves
                .filter(leave => leave.studentId)
                .map(leave =>
                    leave.studentId!.toString()
                )
        );

        const attendanceMap = new Map(
            attendance.map(record => [
                record.studentId._id.toString(),
                record
            ])
        );

        const leaveMap = new Map(
            approvedLeaves
                .filter(leave => leave.studentId)
                .map(leave => [
                    leave.studentId!.toString(),
                    leave
                ])
        );

        const result = students.map(student => {
            const studentId = student._id.toString();

            if (leaveStudentIds.has(studentId)) {
                const leave = leaveMap.get(studentId);

                return {
                    _id: `${leave?._id}-${date}`,
                    studentId: student,
                    date: selectedDate,
                    status: "Leave"
                };
            }

            const attendanceRecord =
                attendanceMap.get(studentId);

            if (attendanceRecord) {
                return {
                    _id: attendanceRecord._id,
                    studentId: attendanceRecord.studentId,
                    date: attendanceRecord.date,
                    status: attendanceRecord.status
                };
            }

            return {
                _id: `unmarked-${studentId}-${date}`,
                studentId: student,
                date: selectedDate,
                status: "Not Marked"
            };
        });

        result.sort(
            (a: any, b: any) =>
                Number(a.studentId.rollNumber) -
                Number(b.studentId.rollNumber)
        );

        const totalRecords = result.length;

        const totalPages = Math.ceil(
            totalRecords / pageLimit
        );

        const validPage =
            totalPages > 0
                ? Math.min(currentPage, totalPages)
                : 1;

        const skip = (validPage - 1) * pageLimit;

        const paginatedResult = result.slice(
            skip,
            skip + pageLimit
        );

        const presentCount = result.filter(
            (record: any) =>
                record.status === "Present" &&
                !leaveStudentIds.has(
                    record.studentId._id.toString()
                )
        ).length;

        const absentCount = result.filter(
            (record: any) =>
                record.status === "Absent" &&
                !leaveStudentIds.has(
                    record.studentId._id.toString()
                )
        ).length;

        const leaveCount = result.filter(
            (record: any) =>
                record.status === "Leave"
        ).length;

        return res.status(200).json({
            attendance: paginatedResult,
            totalRecords,
            totalPages,
            currentPage: validPage,
            limit: pageLimit,
            presentCount,
            absentCount,
            leaveCount
        });
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
        const studentId =
            req.query.studentId?.toString() || "";

        const currentPage = Math.max(
            Number(req.query.page) || 1,
            1
        );

        const pageLimit = Math.max(
            Number(req.query.limit) || 10,
            1
        );

        if (!studentId) {
            return res.status(400).json({
                message: "Student ID is required"
            });
        }

        const teacher = await Teacher.findOne({
            userId: req.user?.userId
        }).lean();

        if (!teacher) {
            return res.status(404).json({
                message: "Teacher not found"
            });
        }

        /*
         * Get the student and make sure the student
         * belongs to the teacher's assigned class.
         */
        const student = await Student.findOne({
            _id: studentId,
            class: teacher.classAssigned
        })
            .select("_id class rollNumber userId")
            .populate({
                path: "userId",
                select: "name uid"
            })
            .lean();

        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        /*
         * Get attendance records for this student.
         */
        const attendance =
            await Attendance.find({
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
                })
                .lean();

        /*
         * Get all approved leaves for this student.
         */
        const approvedLeaves =
            await Leave.find({
                studentId: student._id,
                status: "Approved"
            })
                .select("_id studentId startDate endDate")
                .sort({
                    startDate: 1
                })
                .lean();

        /*
         * Keep track of dates that already have
         * actual attendance records.
         *
         * Actual attendance takes priority over
         * a leave record for the same date.
         */
        const attendanceDates = new Set(
            attendance.map(record =>
                new Date(record.date)
                    .toISOString()
                    .split("T")[0]
            )
        );

        /*
         * Generate leave records only for dates
         * that do not already have attendance.
         */
        const leaveRecords: any[] = [];

        for (const leave of approvedLeaves) {
            const currentDate =
                new Date(leave.startDate);

            const endDate =
                new Date(leave.endDate);

            while (currentDate <= endDate) {
                const dateString =
                    currentDate
                        .toISOString()
                        .split("T")[0];

                if (!attendanceDates.has(dateString)) {
                    leaveRecords.push({
                        _id: `${leave._id}-${dateString}`,
                        studentId: student,
                        date: new Date(currentDate),
                        status: "Leave"
                    });
                }

                currentDate.setUTCDate(
                    currentDate.getUTCDate() + 1
                );
            }
        }

        /*
         * Combine actual attendance and leave records.
         */
        const result = [
            ...attendance,
            ...leaveRecords
        ];

        /*
         * Sort all records chronologically.
         */
        result.sort(
            (a: any, b: any) =>
                new Date(a.date).getTime() -
                new Date(b.date).getTime()
        );

        /*
         * Calculate counts from the complete
         * attendance history before pagination.
         */
        const presentCount =
            result.filter(
                (record: any) =>
                    record.status === "Present"
            ).length;

        const absentCount =
            result.filter(
                (record: any) =>
                    record.status === "Absent"
            ).length;

        const leaveCount =
            result.filter(
                (record: any) =>
                    record.status === "Leave"
            ).length;

        const totalDays =
            presentCount +
            absentCount;

        const percentage =
            totalDays > 0
                ? (
                    presentCount /
                    totalDays *
                    100
                ).toFixed(2)
                : "0.00";

        /*
         * Pagination is applied after combining
         * attendance and leave records.
         */
        const totalRecords =
            result.length;

        const totalPages =
            Math.ceil(
                totalRecords / pageLimit
            );

        const validPage =
            totalPages > 0
                ? Math.min(
                    currentPage,
                    totalPages
                )
                : 1;

        const skip =
            (validPage - 1) *
            pageLimit;

        const paginatedResult =
            result.slice(
                skip,
                skip + pageLimit
            );

        return res.status(200).json({
            student: {
                _id: student._id,
                name: (student.userId as any).name,
                uid: (student.userId as any).uid,
                class: student.class,
                rollNumber: student.rollNumber
            },
            attendance: paginatedResult,
            totalRecords,
            totalPages,
            currentPage: validPage,
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