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
import Leave from "../models/Leave";
import AdmissionRequest from "../models/AdmissionRequest";

export const getAttendanceDates = async (
    req: Request,
    res: Response
) => {
    try {
        const attendanceDates = await Attendance.distinct("date");

        const formattedDates = attendanceDates.map(
            (date: Date) => date.toISOString().split("T")[0]
        );

        return res.status(200).json(formattedDates);
    }
    catch (error) {
        console.error("Get attendance dates error:", error);

        return res.status(500).json({
            message: "Failed to get attendance dates"
        });
    }
};

export const deactivateStudent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const student = await Student.findById(req.params.id);

        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        const user = await User.findById(student.userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (user.isActive === false) {
            return res.status(400).json({
                message: "Student account is already deactivated"
            });
        }

        user.isActive = false;
        await user.save();

        res.status(200).json({
            message: "Student account deactivated"
        });
    }
    catch (error) {
        next(error);
    }
};

export const activateStudent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const student = await Student.findById(req.params.id);

        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        const user = await User.findById(student.userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (user.isActive !== false) {
            return res.status(400).json({
                message: "Student account is already active"
            });
        }

        user.isActive = true;
        await user.save();

        res.status(200).json({
            message: "Student account activated"
        });
    }
    catch (error) {
        next(error);
    }
};

export const assignClassTeacher = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const studentClass = req.params.class as StudentClass;
        const { teacherId } = req.body;

        if (!teacherId) {
            return res.status(400).json({
                message: "Teacher ID is required"
            });
        }

        const classData = await Class.findOne({
            class: studentClass
        });

        if (!classData) {
            return res.status(404).json({
                message: "Class not found"
            });
        }

        const teacher = await Teacher.findById(teacherId);

        if (!teacher) {
            return res.status(404).json({
                message: "Teacher not found"
            });
        }

        if (teacher.classAssigned !== studentClass) {
            return res.status(400).json({
                message: "Teacher is not assigned to this class"
            });
        }

        await Class.updateOne(
            { class: studentClass },
            { $set: { teacherId: teacher._id } }
        );

        res.status(200).json({
            message: "Class teacher assigned successfully"
        });
    }
    catch (error) {
        next(error);
    }
};

//Leaves

export const getLeaveApplications = async (
    req: Request,
    res: Response
) => {
    try {
        const status =
            req.query.status?.toString() || "All";

        const classFilter =
            req.query.class?.toString() || "All";

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

        let studentIds;

        if (classFilter !== "All") {
            const students = await Student.find({
                class: classFilter as StudentClass
            }).select("_id");

            studentIds = students.map(
                student => student._id
            );
        }

        const filter: any = {
            studentId: { $exists: true }
        };

        if (status !== "All") {
            filter.status = status;
        }

        if (classFilter !== "All") {
            filter.studentId = {
                $in: studentIds
            };
        }

        const totalLeaves =
            await Leave.countDocuments(filter);

        const leaves = await Leave.find(filter)
            .sort({
                createdAt: -1
            })
            .skip(skip)
            .limit(pageLimit)
            .populate({
                path: "studentId",
                populate: {
                    path: "userId",
                    select: "name uid"
                }
            });

        const formattedLeaves = leaves.map(
            (leave) => {

                const student =
                    leave.studentId as any;

                return {
                    _id: leave._id,
                    student: {
                        _id: student._id,
                        name: student.userId.name,
                        uid: student.userId.uid,
                        class: student.class
                    },
                    startDate: leave.startDate,
                    endDate: leave.endDate,
                    reason: leave.reason,
                    status: leave.status
                };
            }
        );

        const totalPages = Math.ceil(
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
            "Get principal leave applications error:",
            error
        );

        return res.status(500).json({
            message: "Failed to get leave applications"
        });
    }
};

export const approveLeave = async (
    req: Request,
    res: Response
) => {
    try {

        const { id } = req.params;


        const leave = await Leave.findById(id);

        if (!leave) {
            return res.status(404).json({
                message:
                    "Leave application not found"
            });
        }


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

        const { id } = req.params;


        const leave = await Leave.findById(id);

        if (!leave) {
            return res.status(404).json({
                message:
                    "Leave application not found"
            });
        }


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

export const getTeacherLeaveApplications = async (
    req: Request,
    res: Response
) => {
    try {
        const status =
            req.query.status?.toString() || "All";

        const department =
            req.query.department?.toString() || "All";

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

        let teacherIds;

        if (department !== "All") {
            const teachers = await Teacher.find({
                department: department as
                    | "Science"
                    | "Mathematics"
                    | "English"
                    | "Social Science"
                    | "Hindi"
            }).select("_id");

            teacherIds = teachers.map(
                teacher => teacher._id
            );
        }

        const filter: any = {
            teacherId: { $exists: true }
        };

        if (status !== "All") {
            filter.status = status;
        }

        if (department !== "All") {
            filter.teacherId = {
                $in: teacherIds
            };
        }

        const totalLeaves =
            await Leave.countDocuments(filter);

        const leaves = await Leave.find(filter)
            .sort({
                createdAt: -1
            })
            .skip(skip)
            .limit(pageLimit)
            .populate({
                path: "teacherId",
                populate: {
                    path: "userId",
                    select: "name uid"
                }
            });

        const formattedLeaves = leaves.map(
            (leave) => {
                const teacher =
                    leave.teacherId as any;

                return {
                    _id: leave._id,
                    teacher: {
                        _id: teacher._id,
                        name: teacher.userId.name,
                        uid: teacher.userId.uid,
                        employeeID: teacher.employeeID,
                        department: teacher.department,
                        classAssigned: teacher.classAssigned
                    },
                    startDate: leave.startDate,
                    endDate: leave.endDate,
                    reason: leave.reason,
                    status: leave.status
                };
            }
        );

        const totalPages = Math.ceil(
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
            message: "Failed to get teacher leave applications"
        });
    }
};

export const approveTeacherLeave = async (
    req: Request,
    res: Response
) => {
    try {
        const { id } = req.params;

        const leave = await Leave.findById(id);

        if (!leave) {
            return res.status(404).json({
                message: "Leave application not found"
            });
        }

        if (!leave.teacherId) {
            return res.status(400).json({
                message: "This is not a teacher leave application"
            });
        }

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
                "Teacher leave application approved successfully",
            leave
        });
    }
    catch (error) {
        console.error(
            "Approve teacher leave error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to approve teacher leave application"
        });
    }
};

export const rejectTeacherLeave = async (
    req: Request,
    res: Response
) => {
    try {
        const { id } = req.params;

        const leave = await Leave.findById(id);

        if (!leave) {
            return res.status(404).json({
                message: "Leave application not found"
            });
        }

        if (!leave.teacherId) {
            return res.status(400).json({
                message: "This is not a teacher leave application"
            });
        }

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
                "Teacher leave application rejected successfully",
            leave
        });
    }
    catch (error) {
        console.error(
            "Reject teacher leave error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to reject teacher leave application"
        });
    }
};

export const getPrincipalHome = async (
    req: Request,
    res: Response
) => {
    try {
        const totalStudents = await Student.countDocuments();

        const totalTeachers = await Teacher.countDocuments();

        const totalSubjects = await Subject.countDocuments();

        const totalClasses = await Class.countDocuments();

        return res.status(200).json({
            totalStudents,
            totalTeachers,
            totalSubjects,
            totalClasses
        });
    }
    catch (error) {
        console.error(
            "Get principal home error:",
            error
        );

        return res.status(500).json({
            message: "Failed to get principal home information"
        });
    }
};

export const getDeletedStudents = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {
            search = "",
            page = "1",
            limit = "5"
        } = req.query;

        const currentPage = Math.max(Number(page), 1);
        const pageLimit = Math.max(Number(limit), 1);
        const skip = (currentPage - 1) * pageLimit;

        const match: any = {
            isDeleted: true
        };

        const pipeline: any[] = [
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

        if (search.toString().trim() !== "") {
            match["userId.name"] = {
                $regex: search.toString().trim(),
                $options: "i"
            };
        }

        pipeline.push({
            $match: match
        });

        pipeline.push({
            $sort: {
                deletedAt: -1
            }
        });

        pipeline.push({
            $facet: {
                students: [
                    { $skip: skip },
                    { $limit: pageLimit }
                ],
                total: [
                    { $count: "count" }
                ]
            }
        });

        const result = await Student.aggregate(pipeline);

        const students = result[0]?.students || [];
        const totalStudents = result[0]?.total[0]?.count || 0;
        const totalPages = Math.ceil(totalStudents / pageLimit);

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
};

export const restoreStudent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const student = await Student.findOne({
            _id: req.params.id,
            isDeleted: true
        });

        if (!student) {
            return res.status(404).json({
                message: "Deleted student not found"
            });
        }

        student.isDeleted = false;
        student.deletedAt = null;

        await student.save();

        res.status(200).json({
            message: "Student restored"
        });
    }
    catch (error) {
        next(error);
    }
};

//GET all
export const getStudents = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {
            class: classFilter = "All",
            search = "",
            sortBy = "None",
            order = "asc",
            page = "1",
            limit = "5"
        } = req.query;

        const currentPage = Math.max(Number(page), 1);
        const pageLimit = Math.max(Number(limit), 1);
        const skip = (currentPage - 1) * pageLimit;

        const match: any = {
            $or: [
                { isDeleted: false },
                { isDeleted: { $exists: false } }
            ]
        };

        if (classFilter !== "All") {
            match.class = classFilter;
        }

        const pipeline: any[] = [
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

        if (search.toString().trim() !== "") {
            match["userId.name"] = {
                $regex: search.toString().trim(),
                $options: "i"
            };
        }

        pipeline.push({
            $match: match
        });

        if (sortBy === "Student Name") {
            pipeline.push({
                $sort: {
                    "userId.name": order === "desc" ? -1 : 1
                }
            });
        }

        if (sortBy === "Class") {
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
                    classNumber: order === "desc" ? -1 : 1
                }
            });
        }

        if (sortBy === "Roll no") {
            pipeline.push({
                $sort: {
                    rollNumber: order === "desc" ? -1 : 1
                }
            });
        }

        pipeline.push({
            $facet: {
                students: [
                    { $skip: skip },
                    { $limit: pageLimit }
                ],
                total: [
                    { $count: "count" }
                ]
            }
        });

        const result = await Student.aggregate(pipeline);

        const students = result[0]?.students || [];
        const totalStudents = result[0]?.total[0]?.count || 0;
        const totalPages = Math.ceil(totalStudents / pageLimit);

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
};

export const getTeachers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {
            class: classFilter = "All",
            search = "",
            sortBy = "None",
            order = "asc",
            page = "1",
            limit = "5"
        } = req.query;

        const currentPage = Math.max(Number(page), 1);
        const pageLimit = Math.max(Number(limit), 1);
        const skip = (currentPage - 1) * pageLimit;

        const match: any = {
            $or: [
                { isDeleted: false },
                { isDeleted: { $exists: false } }
            ]
        };

        if (classFilter !== "All") {
            match.classAssigned = classFilter;
        }

        const pipeline: any[] = [
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

        const searchValue = search.toString().trim();

        if (searchValue !== "") {
            match["userId.name"] = {
                $regex: searchValue,
                $options: "i"
            };
        }

        pipeline.push({
            $match: match
        });

        if (sortBy === "Teacher Name") {
            pipeline.push({
                $sort: {
                    "userId.name": order === "desc" ? -1 : 1
                }
            });
        }

        if (sortBy === "Class Assigned") {
            pipeline.push({
                $addFields: {
                    classNumber: {
                        $toInt: {
                            $getField: {
                                field: "match",
                                input: {
                                    $regexFind: {
                                        input: "$classAssigned",
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
                    classNumber: order === "desc" ? -1 : 1
                }
            });
        }

        pipeline.push({
            $facet: {
                teachers: [
                    { $skip: skip },
                    { $limit: pageLimit }
                ],
                total: [
                    { $count: "count" }
                ]
            }
        });

        const result = await Teacher.aggregate(pipeline);

        const teachers = result[0]?.teachers || [];
        const totalTeachers = result[0]?.total[0]?.count || 0;
        const totalPages = Math.ceil(totalTeachers / pageLimit);

        res.status(200).json({
            teachers,
            totalTeachers,
            totalPages,
            currentPage,
            limit: pageLimit
        });
    }
    catch (error) {
        next(error);
    }
};

export const getDeletedTeachers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {
            search = "",
            page = "1",
            limit = "5"
        } = req.query;

        const currentPage = Math.max(Number(page), 1);
        const pageLimit = Math.max(Number(limit), 1);
        const skip = (currentPage - 1) * pageLimit;

        const match: any = {
            isDeleted: true
        };

        const pipeline: any[] = [
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

        const searchValue = search.toString().trim();

        if (searchValue !== "") {
            match["userId.name"] = {
                $regex: searchValue,
                $options: "i"
            };
        }

        pipeline.push({
            $match: match
        });

        pipeline.push({
            $sort: {
                deletedAt: -1
            }
        });

        pipeline.push({
            $facet: {
                teachers: [
                    { $skip: skip },
                    { $limit: pageLimit }
                ],
                total: [
                    { $count: "count" }
                ]
            }
        });

        const result = await Teacher.aggregate(pipeline);

        const teachers = result[0]?.teachers || [];
        const totalTeachers = result[0]?.total[0]?.count || 0;
        const totalPages = Math.ceil(totalTeachers / pageLimit);

        res.status(200).json({
            teachers,
            totalTeachers,
            totalPages,
            currentPage,
            limit: pageLimit
        });
    }
    catch (error) {
        next(error);
    }
};

export const restoreTeacher = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const teacher = await Teacher.findOne({
            _id: req.params.id,
            isDeleted: true
        });

        if (!teacher) {
            return res.status(404).json({
                message: "Deleted teacher not found"
            });
        }

        teacher.isDeleted = false;
        teacher.deletedAt = null;

        await teacher.save();

        res.status(200).json({
            message: "Teacher restored"
        });
    }
    catch (error) {
        next(error);
    }
};

export const getSubjects = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const {
            class: classFilter = "All",
            search = "",
            sortBy = "None",
            order = "asc",
            page = "1",
            limit = "5"
        } = req.query;

        const currentPage = Math.max(Number(page) || 1, 1);
        const pageLimit = Math.max(Number(limit) || 5, 1);
        const skip = (currentPage - 1) * pageLimit;

        const match: any = {};

        if (classFilter !== "All") {
            match.class = classFilter;
        }

        const searchValue = search.toString().trim();

        if (searchValue !== "") {
            match.name = {
                $regex: searchValue,
                $options: "i"
            };
        }

        const pipeline: any[] = [
            {
                $lookup: {
                    from: "teachers",
                    let: {
                        subjectName: "$name",
                        subjectClass: "$class"
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        {
                                            $eq: [
                                                "$department",
                                                "$$subjectName"
                                            ]
                                        },
                                        {
                                            $eq: [
                                                "$classAssigned",
                                                "$$subjectClass"
                                            ]
                                        }
                                    ]
                                }
                            }
                        },
                        {
                            $lookup: {
                                from: "users",
                                localField: "userId",
                                foreignField: "_id",
                                as: "user"
                            }
                        },
                        {
                            $unwind: {
                                path: "$user",
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                name: "$user.name"
                            }
                        }
                    ],
                    as: "teacher"
                }
            },
            {
                $addFields: {
                    teacherName: {
                        $ifNull: [
                            {
                                $arrayElemAt: [
                                    "$teacher.name",
                                    0
                                ]
                            },
                            "Not Assigned"
                        ]
                    }
                }
            },
            {
                $match: match
            }
        ];

        if (sortBy === "Subject Name") {
            pipeline.push({
                $sort: {
                    name: order === "desc" ? -1 : 1
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
                    name: 1
                }
            });
        }
        else {
            pipeline.push({
                $sort: {
                    createdAt: -1
                }
            });
        }

        pipeline.push({
            $facet: {
                subjects: [
                    { $skip: skip },
                    { $limit: pageLimit }
                ],
                total: [
                    { $count: "count" }
                ]
            }
        });

        const result = await Subject.aggregate(pipeline);

        const subjects = result[0]?.subjects || [];
        const totalSubjects = result[0]?.total[0]?.count || 0;
        const totalPages = Math.ceil(
            totalSubjects / pageLimit
        );

        res.status(200).json({
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

export const getMarks = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const {
            class: classFilter = "All",
            exam = "All",
            search = "",
            sortBy = "None",
            order = "asc",
            page = "1",
            limit = "5",
            subject = "All",
            teacher = "All"
        } = req.query;

        const currentPage = Math.max(Number(page) || 1, 1);
        const pageLimit = Math.max(Number(limit) || 5, 1);
        const skip = (currentPage - 1) * pageLimit;

        const studentLookup: any[] = [
            {
                $lookup: {
                    from: "users",
                    localField: "student.userId",
                    foreignField: "_id",
                    as: "studentUser"
                }
            },
            {
                $unwind: {
                    path: "$studentUser",
                    preserveNullAndEmptyArrays: true
                }
            }
        ];

        const teacherLookup: any[] = [
            {
                $lookup: {
                    from: "users",
                    localField: "teacher.userId",
                    foreignField: "_id",
                    as: "teacherUser"
                }
            },
            {
                $unwind: {
                    path: "$teacherUser",
                    preserveNullAndEmptyArrays: true
                }
            }
        ];

        const pipeline: any[] = [
            {
                $lookup: {
                    from: "students",
                    localField: "studentId",
                    foreignField: "_id",
                    as: "student"
                }
            },
            {
                $unwind: {
                    path: "$student",
                    preserveNullAndEmptyArrays: true
                }
            },
            ...studentLookup,
            {
                $lookup: {
                    from: "teachers",
                    localField: "teacherId",
                    foreignField: "_id",
                    as: "teacher"
                }
            },
            {
                $unwind: {
                    path: "$teacher",
                    preserveNullAndEmptyArrays: true
                }
            },
            ...teacherLookup,
            {
                $lookup: {
                    from: "subjects",
                    localField: "subjectId",
                    foreignField: "_id",
                    as: "subject"
                }
            },
            {
                $unwind: {
                    path: "$subject",
                    preserveNullAndEmptyArrays: true
                }
            }
        ];

        const match: any = {};

        if (classFilter !== "All") {
            match["student.class"] = classFilter;
        }

        if (exam !== "All") {
            match.exam = exam;
        }

        if (subject !== "All") {
            match["subject.name"] = subject;
        }

        if (teacher !== "All" && mongoose.Types.ObjectId.isValid(teacher.toString())) {
            match.teacherId = new mongoose.Types.ObjectId(
                teacher.toString()
            );
        }

        const searchValue = search.toString().trim();

        if (searchValue !== "") {
            match["studentUser.name"] = {
                $regex: searchValue,
                $options: "i"
            };
        }

        pipeline.push({
            $match: match
        });

        if (sortBy === "Student Name") {
            pipeline.push({
                $sort: {
                    "studentUser.name": order === "desc" ? -1 : 1
                }
            });
        }
        else if (sortBy === "Subject Name") {
            pipeline.push({
                $sort: {
                    "subject.name": order === "desc" ? -1 : 1
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
                                        input: "$student.class",
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
                    "studentUser.name": 1
                }
            });
        }
        else if (sortBy === "Marks Obtained") {
            pipeline.push({
                $sort: {
                    marksObtained: order === "desc" ? -1 : 1
                }
            });
        }
        else {
            pipeline.push({
                $sort: {
                    createdAt: -1
                }
            });
        }

        pipeline.push({
            $facet: {
                marks: [
                    { $skip: skip },
                    { $limit: pageLimit }
                ],
                total: [
                    { $count: "count" }
                ]
            }
        });

        const result = await Mark.aggregate(pipeline);

        const marks = result[0]?.marks || [];
        const totalMarks = result[0]?.total[0]?.count || 0;

        const totalPages = Math.ceil(
            totalMarks / pageLimit
        );

        const formattedMarks = marks.map((mark: any) => ({
            _id: mark._id,
            studentId: mark.student
                ? {
                    class: mark.student.class,
                    userId: mark.studentUser
                        ? {
                            name: mark.studentUser.name,
                            uid: mark.studentUser.uid
                        }
                        : null
                }
                : null,
            teacherId: mark.teacher
                ? {
                    userId: mark.teacherUser
                        ? {
                            name: mark.teacherUser.name
                        }
                        : null
                }
                : null,
            subjectId: mark.subject
                ? {
                    name: mark.subject.name
                }
                : null,
            exam: mark.exam,
            marksObtained: mark.marksObtained,
            totalMarks: mark.totalMarks
        }));

        res.status(200).json({
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

export const getMarkTeachers = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const teachers = await Mark.aggregate([
            {
                $group: {
                    _id: "$teacherId"
                }
            },
            {
                $match: {
                    _id: {
                        $ne: null
                    }
                }
            },
            {
                $lookup: {
                    from: "teachers",
                    localField: "_id",
                    foreignField: "_id",
                    as: "teacher"
                }
            },
            {
                $unwind: "$teacher"
            },
            {
                $lookup: {
                    from: "users",
                    localField: "teacher.userId",
                    foreignField: "_id",
                    as: "user"
                }
            },
            {
                $unwind: "$user"
            },
            {
                $project: {
                    _id: 0,
                    id: "$teacher._id",
                    name: "$user.name"
                }
            }
        ]);

        return res.status(200).json({
            teachers
        });
    }
    catch (error) {
        next(error);
    }
};

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

        const search = req.query.search?.toString().trim() || "";
        const sortBy = req.query.sortBy?.toString() || "None";
        const order = req.query.order?.toString() || "asc";

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
                $in: students.map(student => student._id)
            },
            exam
        }).populate({
            path: "subjectId",
            select: "name subjectCode"
        });

        let results = students.map(student => {

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

                const subject = mark.subjectId as any;

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
            }
            else if (hasMissingMarks) {
                result = "Incomplete";
            }
            else {
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

        if (search !== "") {
            const searchValue = search.toLowerCase();

            results = results.filter(student =>
                student.studentName
                    .toLowerCase()
                    .includes(searchValue) ||
                student.uid
                    .toLowerCase()
                    .includes(searchValue)
            );
        }

        if (sortBy === "Student Name") {
            results.sort((a, b) => {
                const comparison =
                    a.studentName.localeCompare(
                        b.studentName
                    );

                return order === "desc"
                    ? -comparison
                    : comparison;
            });
        }
        else if (sortBy === "UID") {
            results.sort((a, b) => {
                const comparison =
                    a.uid.localeCompare(b.uid);

                return order === "desc"
                    ? -comparison
                    : comparison;
            });
        }
        else if (sortBy === "Total Marks") {
            results.sort((a, b) => {
                const comparison =
                    (a.total?.obtained ?? 0) -
                    (b.total?.obtained ?? 0);

                return order === "desc"
                    ? -comparison
                    : comparison;
            });
        }
        else if (sortBy === "Percentage") {
            results.sort((a, b) => {
                const comparison =
                    (a.percentage ?? -1) -
                    (b.percentage ?? -1);

                return order === "desc"
                    ? -comparison
                    : comparison;
            });
        }

        const totalResults = results.length;

        const totalPages = Math.ceil(
            totalResults / pageLimit
        );

        const startIndex =
            (currentPage - 1) * pageLimit;

        const paginatedResults = results.slice(
            startIndex,
            startIndex + pageLimit
        );

        res.status(200).json({
            results: paginatedResults,
            totalResults,
            totalPages,
            currentPage,
            limit: pageLimit
        });

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

        await Class.updateMany(
            { teacherId: teacher._id },
            { $set: { teacherId: null } }
        );

        teacher.isDeleted = true;
        teacher.deletedAt = new Date();

        await teacher.save();

        res.status(200).json({
            message: "Teacher deleted"
        });
    }
    catch (error) {
        next(error);
    }
};

export const getTeacherById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const teacher = await Teacher.findById(req.params.id).populate("userId", "name uid role isActive");

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
        const student = await Student.findById(req.params.id).populate("userId", "name uid role isActive");

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
};

export const deactivateTeacher = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const teacher = await Teacher.findById(req.params.id);

        if (!teacher) {
            return res.status(404).json({
                message: "Teacher not found"
            });
        }

        const user = await User.findById(teacher.userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (user.isActive === false) {
            return res.status(400).json({
                message: "Teacher account is already deactivated"
            });
        }

        user.isActive = false;
        await user.save();

        res.status(200).json({
            message: "Teacher account deactivated"
        });
    }
    catch (error) {
        next(error);
    }
};

export const activateTeacher = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const teacher = await Teacher.findById(req.params.id);

        if (!teacher) {
            return res.status(404).json({
                message: "Teacher not found"
            });
        }

        const user = await User.findById(teacher.userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (user.isActive !== false) {
            return res.status(400).json({
                message: "Teacher account is already active"
            });
        }

        user.isActive = true;
        await user.save();

        res.status(200).json({
            message: "Teacher account activated"
        });
    }
    catch (error) {
        next(error);
    }
};

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

        student.isDeleted = true;
        student.deletedAt = new Date();

        await student.save();

        res.status(200).json({
            message: "Student deleted"
        });
    }
    catch (error) {
        next(error);
    }
};

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

        const students = await Student.find()
            .select("_id class");

        const attendance = await Attendance.find({
            date: selectedDate
        }).select("studentId status");

        const approvedLeaves = await Leave.find({
            status: "Approved",
            startDate: {
                $lte: selectedDate
            },
            endDate: {
                $gte: selectedDate
            }
        }).select("studentId");

        const leaveStudentIds = new Set(
            approvedLeaves
                .filter(leave => leave.studentId)
                .map(leave => leave.studentId!.toString())
        );

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

        const summary = classes.map(studentClass => {
            const classStudents = students.filter(
                student =>
                    student.class === studentClass
            );

            const classStudentIds = new Set(
                classStudents.map(
                    student =>
                        student._id.toString()
                )
            );

            const classAttendance =
                attendance.filter(record => {
                    const studentId =
                        record.studentId.toString();

                    return (
                        classStudentIds.has(studentId) &&
                        !leaveStudentIds.has(studentId)
                    );
                });

            const present =
                classAttendance.filter(
                    record =>
                        record.status === "Present"
                ).length;

            const absent =
                classAttendance.filter(
                    record =>
                        record.status === "Absent"
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

export const getAttendance = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const studentClass =
            req.query.class?.toString() || "";

        const date =
            req.query.date?.toString() || "";

        const search =
            req.query.search?.toString().trim() || "";

        const page =
            Math.max(Number(req.query.page) || 1, 1);

        const limit =
            Math.max(Number(req.query.limit) || 10, 1);

        if (!studentClass) {
            return res.status(400).json({
                message: "Class is required"
            });
        }

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

        const students = await Student.find({
            class: studentClass as StudentClass
        })
            .select("_id class rollNumber userId")
            .populate({
                path: "userId",
                select: "name uid"
            })
            .sort({
                rollNumber: 1
            });

        const filteredStudents = search
            ? students.filter((student: any) => {
                const name =
                    student.userId.name.toLowerCase();

                const uid =
                    student.userId.uid.toLowerCase();

                const searchValue =
                    search.toLowerCase();

                return (
                    name.includes(searchValue) ||
                    uid.includes(searchValue)
                );
            })
            : students;

        const studentIds = filteredStudents.map(
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
            });

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
        });

        const leaveStudentIds = new Set(
            approvedLeaves
                .filter(leave => leave.studentId)
                .map(leave =>
                    leave.studentId!.toString()
                )
        );

        const attendanceRecords = attendance
            .filter((record: any) =>
                !leaveStudentIds.has(
                    record.studentId._id.toString()
                )
            )
            .map((record: any) => ({
                _id: record._id,
                studentId: record.studentId,
                date: record.date,
                status: record.status
            }));

        const leaveRecords = approvedLeaves
            .filter(leave => leave.studentId)
            .map(leave => {
                const student =
                    filteredStudents.find(
                        student =>
                            student._id.toString() ===
                            leave.studentId!.toString()
                    );

                return {
                    _id: `${leave._id}-${date}`,
                    studentId: student,
                    date: selectedDate,
                    status: "Leave"
                };
            });

        const result = [
            ...attendanceRecords,
            ...leaveRecords
        ];

        result.sort((a: any, b: any) => {
            return (
                Number(a.studentId.rollNumber) -
                Number(b.studentId.rollNumber)
            );
        });

        const totalRecords = result.length;

        const totalPages = Math.ceil(
            totalRecords / limit
        );

        const startIndex =
            (page - 1) * limit;

        const paginatedResult = result.slice(
            startIndex,
            startIndex + limit
        );

        res.status(200).json({
            attendance: paginatedResult,
            totalRecords,
            totalPages,
            currentPage: page,
            limit
        });
    }
    catch (error) {
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

        const page = Math.max(
            Number(req.query.page) || 1,
            1
        );

        const limit = Math.max(
            Number(req.query.limit) || 10,
            1
        );

        if (!studentId || typeof studentId !== "string") {
            return res.status(400).json({
                message: "Student ID is required"
            });
        }

        const student = await Student.findById(studentId)
            .populate({
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
                    studentId: student,
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

        const attendanceRecords = attendance.filter(
            (record: any) => {
                const dateString =
                    new Date(record.date)
                        .toISOString()
                        .split("T")[0];

                return !filteredLeaveRecords.some(
                    leaveRecord =>
                        new Date(leaveRecord.date)
                            .toISOString()
                            .split("T")[0] === dateString
                );
            }
        );

        const result = [
            ...attendanceRecords,
            ...filteredLeaveRecords
        ];

        result.sort((a: any, b: any) => {
            return (
                new Date(a.date).getTime() -
                new Date(b.date).getTime()
            );
        });

        const presentCount = attendanceRecords.filter(
            (record: any) =>
                record.status === "Present"
        ).length;

        const absentCount = attendanceRecords.filter(
            (record: any) =>
                record.status === "Absent"
        ).length;

        const leaveCount = filteredLeaveRecords.length;

        const totalDays =
            presentCount + absentCount;

        const totalRecords = result.length;

        const totalPages = Math.ceil(
            totalRecords / limit
        );

        const startIndex = (page - 1) * limit;

        const paginatedResult = result.slice(
            startIndex,
            startIndex + limit
        );

        res.status(200).json({
            attendance: paginatedResult,
            totalRecords,
            totalPages,
            currentPage: page,
            limit,
            presentCount,
            absentCount,
            leaveCount,
            totalDays
        });
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

        let classData = await Class.findOne({
            class: studentClass
        });

        if (!classData) {
            classData = await Class.create({
                class: studentClass,
                teacherId: null
            });
        }

        let classTeacher = null;

        if (classData.teacherId) {
            const teacher = await Teacher.findById(
                classData.teacherId
            );

            if (teacher) {
                const classTeacherUser = await User.findById(
                    teacher.userId
                ).select("name uid");

                classTeacher = {
                    name: classTeacherUser?.name ?? "N/A",
                    employeeID: teacher.employeeID,
                    uid: classTeacherUser?.uid ?? "N/A"
                };
            }
        }

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
            classTeacher,
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