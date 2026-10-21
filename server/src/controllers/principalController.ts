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
import TeacherAttendance from "../models/TeacherAttendance";
import Arrangement from "../models/Arrangement";
import Holiday from "../models/Holiday";

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
        const [
            totalStudents,
            totalTeachers,
            totalSubjects,
            totalClasses,
            classes
        ] = await Promise.all([
            Student.countDocuments(),
            Teacher.countDocuments(),
            Subject.countDocuments(),
            Class.countDocuments(),
            Class.find({})
                .select("class")
                .lean()
        ]);

        // Sort classes numerically: 1st, 2nd, 3rd ... 12th.
        const sortedClasses = classes.sort(
            (a, b) =>
                parseInt(a.class, 10) - parseInt(b.class, 10)
        );

        return res.status(200).json({
            totalStudents,
            totalTeachers,
            totalSubjects,
            totalClasses,
            classes: sortedClasses
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
            limit = "5",
            showDeleted = "false"
        } = req.query;

        const currentPage = Math.max(Number(page), 1);
        const pageLimit = Math.max(Number(limit), 1);
        const skip = (currentPage - 1) * pageLimit;

        const match: any = {};

        if (showDeleted !== "true") {
            match.$or = [
                { isDeleted: false },
                { isDeleted: { $exists: false } }
            ];
        }

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


export const getTeachers = async (
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
            limit = "5",
            showDeleted = "false"
        } = req.query;

        const currentPage = Math.max(Number(page), 1);
        const pageLimit = Math.max(Number(limit), 1);
        const skip = (currentPage - 1) * pageLimit;

        const match: any = {};

        if (showDeleted !== "true") {
            match.$or = [
                { isDeleted: false },
                { isDeleted: { $exists: false } }
            ];
        }

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
            },
            {
                $lookup: {
                    from: "classes",
                    let: {
                        teacherId: "$_id"
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$teacherId", "$$teacherId"]
                                }
                            }
                        },
                        { $limit: 1 }
                    ],
                    as: "classTeacherMatch"
                }
            },
            {
                $addFields: {
                    isClassTeacher: {
                        $gt: [{ $size: "$classTeacherMatch" }, 0]
                    }
                }
            },
            {
                $project: {
                    classTeacherMatch: 0
                }
            }
        ];

        const searchValue = search.toString().trim();

        if (searchValue !== "") {
            match["userId.name"] = {
                $regex: searchValue,
                $options: "i"
            };
        }

        pipeline.push({ $match: match });

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
                total: [{ $count: "count" }]
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
    } catch (error) {
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

export const permanentlyDeleteTeacher = async (req: Request, res: Response, next: NextFunction) => {
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

export const permanentlyDeleteStudent = async (req: Request, res: Response, next: NextFunction) => {
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
                    _id: mark.student._id.toString(),
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
                    name: "$user.name",
                    classAssigned: "$teacher.classAssigned"
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

export const createTeacher = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const session = await mongoose.startSession();

    try {
        const {
            name,
            password,
            department,
            classAssigned
        } = req.body;

        session.startTransaction();

        const existingTeacher = await Teacher.findOne({
            department,
            classAssigned
        }).session(session);

        if (existingTeacher) {
            await session.abortTransaction();

            return res.status(400).json({
                message: "A teacher is already assigned to this department and class"
            });
        }

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
                parseInt(
                    lastTeacher.employeeID.replace("EMP", ""),
                    10
                ) + 1;
        }

        const employeeID =
            `EMP${String(employeeNumber).padStart(4, "0")}`;

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

        // Remove the temporary arrangement for this vacancy, if one exists.
        const removedArrangement =
            await Arrangement.findOneAndDelete({
                class: classAssigned,
                department
            }).session(session);

        await session.commitTransaction();

        return res.status(201).json({
            message: removedArrangement
                ? "Teacher created successfully and temporary arrangement removed"
                : "Teacher created successfully"
        });

    } catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }

        console.error("Error creating teacher:", error);
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

export const deleteTeachers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { ids } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                message: "Teacher IDs are required"
            });
        }

        const teachers = await Teacher.find({
            _id: { $in: ids },
            $or: [
                { isDeleted: false },
                { isDeleted: { $exists: false } }
            ]
        }).select("_id");

        if (teachers.length === 0) {
            return res.status(404).json({
                message: "No active teachers found"
            });
        }

        const teacherIds = teachers.map(
            teacher => teacher._id
        );

        await Class.updateMany(
            { teacherId: { $in: teacherIds } },
            { $set: { teacherId: null } }
        );

        await Teacher.updateMany(
            { _id: { $in: teacherIds } },
            {
                $set: {
                    isDeleted: true,
                    deletedAt: new Date()
                }
            }
        );

        res.status(200).json({
            message: "Teachers deleted"
        });
    }
    catch (error) {
        next(error);
    }
};

export const getTeacherById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const teacher = await Teacher.findById(
            req.params.id
        ).populate("userId", "name uid role isActive");

        if (!teacher) {
            return res.status(404).json({
                message: "Teacher not found"
            });
        }

        const classTeacher = await Class.exists({
            teacherId: teacher._id
        });

        return res.status(200).json({
            ...teacher.toObject(),
            isClassTeacher: Boolean(classTeacher)
        });
    } catch (error) {
        next(error);
    }
};

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


export const deactivateTeacher = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const session = await mongoose.startSession();

    try {
        const { arrangedTeacherId } = req.body;

        if (
            !mongoose.isValidObjectId(req.params.id) ||
            !mongoose.isValidObjectId(arrangedTeacherId) ||
            req.params.id === arrangedTeacherId.toString()
        ) {
            return res.status(400).json({
                message: "A valid replacement teacher must be selected"
            });
        }

        let createdArrangement: any = null;

        await session.withTransaction(async () => {
            const teacher = await Teacher.findOne({
                _id: req.params.id,
                isDeleted: false
            }).session(session);

            if (!teacher) {
                throw Object.assign(
                    new Error("Teacher not found"),
                    { status: 404 }
                );
            }

            const user = await User.findById(
                teacher.userId
            ).session(session);

            if (!user) {
                throw Object.assign(
                    new Error("User not found"),
                    { status: 404 }
                );
            }

            if (user.isActive === false) {
                throw Object.assign(
                    new Error("Teacher account is already deactivated"),
                    { status: 400 }
                );
            }

            const arrangedTeacher = await Teacher.findOne({
                _id: arrangedTeacherId,
                isDeleted: false
            }).session(session);

            if (!arrangedTeacher) {
                throw Object.assign(
                    new Error("Replacement teacher not found"),
                    { status: 404 }
                );
            }

            const arrangedUser = await User.findById(
                arrangedTeacher.userId
            ).session(session);

            if (!arrangedUser || arrangedUser.isActive !== true) {
                throw Object.assign(
                    new Error(
                        "The replacement teacher must have an active account"
                    ),
                    { status: 400 }
                );
            }

            const existingArrangement = await Arrangement.findOne({
                originalTeacherId: teacher._id
            }).session(session);

            if (existingArrangement) {
                throw Object.assign(
                    new Error(
                        "A temporary arrangement already exists for this teacher"
                    ),
                    { status: 409 }
                );
            }

            // Find the class currently assigned to the original teacher.
            const classDocument = await Class.findOne({
                teacherId: teacher._id
            }).session(session);

            const wasClassTeacher = Boolean(classDocument);

            const arrangement = new Arrangement({
                originalTeacherId: teacher._id,
                arrangedTeacherId: arrangedTeacher._id,
                class: classDocument?.class ?? teacher.classAssigned,
                department: teacher.department,
                wasClassTeacher
            });

            await arrangement.save({ session });

            // Transfer class-teacher responsibility regardless of the
            // replacement teacher's own classAssigned field.
            if (classDocument) {
                classDocument.teacherId = arrangedTeacher._id;
                await classDocument.save({ session });
            }

            user.isActive = false;
            await user.save({ session });

            createdArrangement = arrangement.toObject();
        });

        return res.status(200).json({
            message:
                "Teacher account deactivated and temporary arrangement created successfully",
            arrangement: createdArrangement
        });
    } catch (error: any) {
        if (error.status) {
            return res.status(error.status).json({
                message: error.message
            });
        }

        return next(error);
    } finally {
        await session.endSession();
    }
};


export const activateTeacher = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const session = await mongoose.startSession();

    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid teacher ID"
            });
        }

        await session.withTransaction(async () => {
            const teacher = await Teacher.findOne({
                _id: req.params.id,
                isDeleted: false
            }).session(session);

            if (!teacher) {
                throw Object.assign(
                    new Error("Teacher not found"),
                    { status: 404 }
                );
            }

            const user = await User.findById(
                teacher.userId
            ).session(session);

            if (!user) {
                throw Object.assign(
                    new Error("User not found"),
                    { status: 404 }
                );
            }

            if (user.isActive !== false) {
                throw Object.assign(
                    new Error("Teacher account is already active"),
                    { status: 400 }
                );
            }

            const arrangement = await Arrangement.findOne({
                originalTeacherId: teacher._id
            }).session(session);

            if (arrangement?.wasClassTeacher) {
                const classDocument = await Class.findOne({
                    class: arrangement.class,
                    teacherId: arrangement.arrangedTeacherId
                }).session(session);

                if (!classDocument) {
                    throw Object.assign(
                        new Error(
                            "The temporary class assignment has changed. The original teacher was not reactivated."
                        ),
                        { status: 409 }
                    );
                }

                // Restore the original class teacher.
                classDocument.teacherId = teacher._id;
                await classDocument.save({ session });
            }

            // Delete the temporary arrangement, if one exists.
            if (arrangement) {
                await Arrangement.deleteOne({
                    _id: arrangement._id
                }).session(session);
            }

            // Reactivate the original teacher.
            user.isActive = true;
            await user.save({ session });
        });

        return res.status(200).json({
            message:
                "Teacher account activated, class assignment restored when applicable, and temporary arrangement removed"
        });
    } catch (error: any) {
        if (error.status) {
            return res.status(error.status).json({
                message: error.message
            });
        }

        next(error);
    } finally {
        await session.endSession();
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

export const deleteStudents = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { ids } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                message: "Student IDs are required"
            });
        }

        const students = await Student.find({
            _id: { $in: ids },
            $or: [
                { isDeleted: false },
                { isDeleted: { $exists: false } }
            ]
        }).select("_id");

        if (students.length === 0) {
            return res.status(404).json({
                message: "No active students found"
            });
        }

        const studentIds = students.map(
            student => student._id
        );

        await Student.updateMany(
            { _id: { $in: studentIds } },
            {
                $set: {
                    isDeleted: true,
                    deletedAt: new Date()
                }
            }
        );

        res.status(200).json({
            message: "Students deleted"
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
        })
            .select("studentId teacherId status")
            .populate({
                path: "teacherId",
                select: "userId",
                populate: {
                    path: "userId",
                    select: "name uid"
                }
            });

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

            const teacherRecord =
                classAttendance.find(
                    record => record.teacherId
                );

            const teacher =
                teacherRecord?.teacherId &&
                    typeof teacherRecord.teacherId === "object"
                    ? {
                        name: (teacherRecord.teacherId as any).userId.name,
                        uid: (teacherRecord.teacherId as any).userId.uid
                    }
                    : null;

            return {
                class: studentClass,
                present,
                absent,
                percentage,
                teacher
            };
        });

        res.status(200).json(summary);
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

        const searchValue = search.toLowerCase();

        const filteredStudents = search
            ? students.filter((student: any) => {
                const name =
                    student.userId?.name?.toLowerCase() || "";

                const uid =
                    student.userId?.uid?.toLowerCase() || "";

                return (
                    name.includes(searchValue) ||
                    uid.includes(searchValue)
                );
            })
            : students;

        const studentIds = students.map(
            student => student._id
        );

        const attendance = await Attendance.find({
            studentId: {
                $in: studentIds
            },
            date: selectedDate
        }).populate({
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
                .map(leave => leave.studentId!.toString())
        );

        const attendanceByStudent = new Map(
            attendance.map((record: any) => [
                record.studentId._id.toString(),
                record
            ])
        );

        const present = attendance.filter(
            (record: any) =>
                record.status === "Present" &&
                !leaveStudentIds.has(
                    record.studentId._id.toString()
                )
        ).length;

        const absent = attendance.filter(
            (record: any) =>
                record.status === "Absent" &&
                !leaveStudentIds.has(
                    record.studentId._id.toString()
                )
        ).length;

        const total = present + absent;

        const percentage =
            total > 0
                ? (present / total) * 100
                : 0;

        const leaveByStudent = new Map(
            approvedLeaves
                .filter(leave => leave.studentId)
                .map(leave => [
                    leave.studentId!.toString(),
                    leave
                ])
        );

        const result = filteredStudents.map(
            (student: any) => {
                const studentId = student._id.toString();

                const attendanceRecord =
                    attendanceByStudent.get(studentId);

                if (leaveStudentIds.has(studentId)) {
                    const leave = leaveByStudent.get(studentId);

                    return {
                        _id: `${leave?._id}-${date}`,
                        studentId: student,
                        date: selectedDate,
                        status: "Leave"
                    };
                }

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
            }
        );

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
            summary: {
                class: studentClass,
                present,
                absent,
                percentage
            },
            totalRecords,
            totalPages,
            currentPage: page,
            limit
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

export const getStudentMonthlyAttendance = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { studentId } = req.query;
        const year = Number(req.query.year);
        const month = Number(req.query.month);

        if (!studentId || typeof studentId !== "string") {
            return res.status(400).json({
                message: "Student ID is required"
            });
        }

        if (
            !Number.isInteger(year) ||
            year < 1000 ||
            year > 9999 ||
            !Number.isInteger(month) ||
            month < 1 ||
            month > 12
        ) {
            return res.status(400).json({
                message: "Valid year and month are required"
            });
        }

        const student = await Student.findById(studentId).select("_id");

        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        const startDate = new Date(Date.UTC(year, month - 1, 1));
        const endDate = new Date(Date.UTC(year, month, 1));

        const [attendanceRecords, approvedLeaves] = await Promise.all([
            Attendance.find({
                studentId: student._id,
                date: {
                    $gte: startDate,
                    $lt: endDate
                }
            })
                .select("date status")
                .sort({ date: 1 })
                .lean(),

            Leave.find({
                studentId: student._id,
                status: "Approved",
                startDate: { $lt: endDate },
                endDate: { $gte: startDate }
            })
                .select("startDate endDate")
                .lean()
        ]);

        // Actual attendance takes priority over an approved leave.
        const attendanceDates = new Set(
            attendanceRecords.map(record =>
                new Date(record.date).toISOString().split("T")[0]
            )
        );

        const leaveRecords: {
            _id: string;
            date: Date;
            status: "Leave";
        }[] = [];

        for (const leave of approvedLeaves) {
            const leaveStart = new Date(leave.startDate);
            const leaveEnd = new Date(leave.endDate);

            const currentDate = new Date(
                Math.max(leaveStart.getTime(), startDate.getTime())
            );

            const lastDate = new Date(
                Math.min(leaveEnd.getTime(), endDate.getTime() - 1)
            );

            currentDate.setUTCHours(0, 0, 0, 0);
            lastDate.setUTCHours(0, 0, 0, 0);

            while (currentDate <= lastDate) {
                const dateString = currentDate.toISOString().split("T")[0];

                if (!attendanceDates.has(dateString)) {
                    leaveRecords.push({
                        _id: `${leave._id}-${dateString}`,
                        date: new Date(currentDate),
                        status: "Leave"
                    });
                }

                currentDate.setUTCDate(currentDate.getUTCDate() + 1);
            }
        }

        const attendance = [
            ...attendanceRecords,
            ...leaveRecords
        ].sort(
            (a, b) =>
                new Date(a.date).getTime() -
                new Date(b.date).getTime()
        );

        return res.status(200).json({ attendance });
    } catch (error) {
        console.log(error);
        next(error);
    }
};

export const getStudentAttendanceDetails = async (
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

        const student = await Student.findById(studentId)
            .select("class rollNumber userId")
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

        return res.status(200).json({ student });
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


const normalizeTeacherAttendanceDate = (date: string): Date | null => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return null;
    }

    const selectedDate = new Date(`${date}T00:00:00.000Z`);

    if (
        Number.isNaN(selectedDate.getTime()) ||
        selectedDate.toISOString().slice(0, 10) !== date
    ) {
        return null;
    }

    return selectedDate;
};


export const getTeachersForAttendance = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const date = req.query.date?.toString() || "";
        const search = req.query.search?.toString().trim() || "";
        const classFilter = req.query.classFilter?.toString() || "All";

        const currentPage = Math.max(
            Number(req.query.page) || 1,
            1
        );

        const pageLimit = Math.max(
            Number(req.query.limit) || 10,
            1
        );

        const selectedDate = normalizeTeacherAttendanceDate(date);

        if (!selectedDate) {
            return res.status(400).json({
                message: "A valid date in YYYY-MM-DD format is required"
            });
        }

        const teacherFilter: Record<string, any> = {
            isDeleted: { $ne: true }
        };
        if (classFilter !== "All") {
            teacherFilter.classAssigned = classFilter;
        }
        if (search) {
            const searchRegex = {
                $regex: search,
                $options: "i"
            };

            const matchingUsers = await User.find({
                name: searchRegex
            })
                .select("_id")
                .lean();

            teacherFilter.$or = [
                { employeeID: searchRegex },
                { department: searchRegex },
                {
                    userId: {
                        $in: matchingUsers.map(user => user._id)
                    }
                }
            ];
        }

        const totalTeachers = await Teacher.countDocuments(
            teacherFilter
        );

        const totalPages = Math.ceil(
            totalTeachers / pageLimit
        );

        const validPage = totalPages > 0
            ? Math.min(currentPage, totalPages)
            : 1;

        const teachers = await Teacher.find(teacherFilter)
            .select("_id userId employeeID department")
            .populate({
                path: "userId",
                select: "name uid"
            })
            .sort({ employeeID: 1 })
            .skip((validPage - 1) * pageLimit)
            .limit(pageLimit)
            .lean();

        const teacherIds = teachers.map(teacher => teacher._id);

        const [existingAttendance, approvedLeaves] = await Promise.all([
            TeacherAttendance.find({
                teacherId: { $in: teacherIds },
                date: selectedDate
            })
                .select("teacherId status")
                .lean(),

            Leave.find({
                teacherId: { $in: teacherIds },
                status: "Approved",
                startDate: { $lte: selectedDate },
                endDate: { $gte: selectedDate }
            })
                .select("teacherId")
                .lean()
        ]);

        const attendanceMap = new Map(
            existingAttendance.map(record => [
                record.teacherId.toString(),
                record.status
            ])
        );

        const teachersOnLeave = new Set(
            approvedLeaves
                .filter(leave => leave.teacherId)
                .map(leave => leave.teacherId!.toString())
        );

        const result = teachers.map(teacher => {
            const teacherId = teacher._id.toString();
            const user = teacher.userId as any;

            return {
                _id: teacherId,
                employeeID: teacher.employeeID,
                name: user?.name ?? "",
                department: teacher.department,
                onLeave: teachersOnLeave.has(teacherId),
                attendanceStatus: attendanceMap.get(teacherId) ?? null
            };
        });

        const attendanceMarked =
            teacherIds.length > 0 &&
            await TeacherAttendance.exists({
                teacherId: {
                    $in: teacherIds
                },
                date: selectedDate
            });
        return res.status(200).json({
            teachers: result,
            attendanceMarked: Boolean(attendanceMarked),
            totalTeachers,
            totalPages,
            currentPage: validPage,
            limit: pageLimit
        });
    } catch (error) {
        next(error);
    }
};



export const createTeacherAttendance = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { date, attendance, classFilter } = req.body;

        // 1. Validate date.
        if (!date) {
            return res.status(400).json({
                message: "Date is required"
            });
        }

        const selectedDate =
            normalizeTeacherAttendanceDate(date);

        if (!selectedDate) {
            return res.status(400).json({
                message: "Invalid date"
            });
        }

        if (selectedDate.getUTCDay() === 0) {
            return res.status(400).json({
                message:
                    "Teacher attendance cannot be marked on Sunday"
            });
        }

        const holiday = await Holiday.findOne({
            date: selectedDate
        }).lean();

        if (holiday) {
            return res.status(400).json({
                message:
                    `Attendance cannot be marked because ${holiday.name} is a holiday`
            });
        }

        // 2. Validate class filter.
        if (
            typeof classFilter !== "string" ||
            !classFilter.trim()
        ) {
            return res.status(400).json({
                message: "Class filter is required"
            });
        }

        // "All" means all active teachers in the school.
        // Any other value means teachers assigned to that class.
        const teacherFilter: Record<string, unknown> = {
            isDeleted: { $ne: true }
        };

        if (classFilter !== "All") {
            teacherFilter.classAssigned = classFilter;
        }

        // 3. Authenticate the principal.
        const principalId = req.user?.userId;

        if (
            !principalId ||
            !mongoose.isValidObjectId(principalId)
        ) {
            return res.status(401).json({
                message: "Authenticated principal not found"
            });
        }

        const principal = await User.findOne({
            _id: principalId,
            role: "principal"
        })
            .select("_id")
            .lean();

        if (!principal) {
            return res.status(403).json({
                message:
                    "Only the principal can mark teacher attendance"
            });
        }

        // 4. Fetch the complete roster for the selected class.
        const teachers = await Teacher.find(teacherFilter)
            .select("_id")
            .lean();

        if (teachers.length === 0) {
            return res.status(400).json({
                message:
                    "No active teachers found for the selected class"
            });
        }

        const teacherIds = teachers.map(
            teacher => teacher._id.toString()
        );

        const teacherIdSet = new Set(teacherIds);

        // 5. Validate the submitted attendance array.
        if (!Array.isArray(attendance)) {
            return res.status(400).json({
                message: "Attendance records are required"
            });
        }

        const invalidRecord = attendance.some(
            (record: {
                teacherId?: string;
                status?: string;
            }) =>
                !record.teacherId ||
                !mongoose.isValidObjectId(record.teacherId) ||
                !["Present", "Absent"].includes(
                    record.status ?? ""
                )
        );

        if (invalidRecord) {
            return res.status(400).json({
                message:
                    "Invalid teacher ID or attendance status"
            });
        }

        const submittedIds = attendance.map(
            (record: { teacherId: string }) =>
                record.teacherId
        );

        // Reject duplicate teacher IDs in the request.
        if (
            new Set(submittedIds).size !==
            submittedIds.length
        ) {
            return res.status(400).json({
                message:
                    "Duplicate teacher IDs were submitted"
            });
        }

        // Reject teachers outside the selected class.
        const invalidTeacherIds = submittedIds.filter(
            (id: string) => !teacherIdSet.has(id)
        );

        if (invalidTeacherIds.length > 0) {
            return res.status(400).json({
                message:
                    "You can only mark attendance for teachers in the selected class"
            });
        }

        // 6. Find approved leave for teachers in this roster.
        const objectTeacherIds = teachers.map(
            teacher => teacher._id
        );

        const approvedLeaves = await Leave.find({
            teacherId: {
                $in: objectTeacherIds
            },
            status: "Approved",
            startDate: {
                $lte: selectedDate
            },
            endDate: {
                $gte: selectedDate
            }
        })
            .select("teacherId")
            .lean();

        const teachersOnLeave = new Set(
            approvedLeaves
                .filter(leave => leave.teacherId)
                .map(leave =>
                    leave.teacherId!.toString()
                )
        );

        // Do not accept attendance records for teachers on leave.
        const teacherOnLeaveSubmitted = submittedIds.some(
            (id: string) => teachersOnLeave.has(id)
        );

        if (teacherOnLeaveSubmitted) {
            return res.status(400).json({
                message:
                    "Attendance cannot be marked for a teacher on approved leave"
            });
        }

        // 7. Every teacher in the selected roster must be
        // marked, except teachers on approved leave.
        const submittedTeacherIds = new Set<string>(
            submittedIds
        );

        const missingTeachers = teacherIds.filter(
            id =>
                !teachersOnLeave.has(id) &&
                !submittedTeacherIds.has(id)
        );

        if (missingTeachers.length > 0) {
            return res.status(400).json({
                message:
                    `Please mark attendance for all active teachers in ${classFilter === "All"
                        ? "the school"
                        : `class ${classFilter}`
                    } who are not on approved leave. ${missingTeachers.length
                    } teacher(s) still need attendance.`
            });
        }

        // 8. Remove approved-leave teachers from the roster.
        const eligibleTeacherIds = teacherIds.filter(
            id => !teachersOnLeave.has(id)
        );

        if (eligibleTeacherIds.length === 0) {
            return res.status(400).json({
                message:
                    "All teachers in the selected roster are on approved leave. No attendance records are required."
            });
        }

        if (attendance.length === 0) {
            return res.status(400).json({
                message: "Attendance records are required"
            });
        }

        // 9. Prevent duplicate attendance for any teacher
        // in this roster on the selected date.
        // Other classes can still be submitted independently.
        const existingAttendance =
            await TeacherAttendance.findOne({
                teacherId: {
                    $in: eligibleTeacherIds
                },
                date: selectedDate
            })
                .select("_id")
                .lean();

        if (existingAttendance) {
            return res.status(409).json({
                message:
                    "Teacher attendance has already been submitted for one or more teachers in the selected roster on this date"
            });
        }

        // 10. Create records only for the submitted,
        // eligible teachers.
        const attendanceRecords = attendance.map(
            (record: {
                teacherId: string;
                status: "Present" | "Absent";
            }) => ({
                teacherId: record.teacherId,
                date: selectedDate,
                status: record.status,
                markedBy: principal._id
            })
        );

        await TeacherAttendance.insertMany(
            attendanceRecords
        );

        return res.status(201).json({
            message:
                "Teacher attendance marked successfully",
            totalRecords: attendanceRecords.length
        });
    } catch (error: any) {
        if (error?.code === 11000) {
            return res.status(409).json({
                message:
                    "Attendance already exists for one or more teachers on this date"
            });
        }

        next(error);
    }
};


export const getTeacherAttendance = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const date = req.query.date?.toString() || "";
        const search = req.query.search?.toString().trim() || "";
        const classFilter = req.query.classFilter?.toString() || "All";

        const currentPage = Math.max(
            Number(req.query.page) || 1,
            1
        );

        const pageLimit = Math.max(
            Number(req.query.limit) || 10,
            1
        );

        const selectedDate = normalizeTeacherAttendanceDate(date);

        if (!selectedDate) {
            return res.status(400).json({
                message: "A valid date in YYYY-MM-DD format is required"
            });
        }

        // Include teachers whose isDeleted field is false or missing.
        const teacherFilter: Record<string, any> = {
            isDeleted: { $ne: true }
        };

        // Apply the selected class filter.
        if (classFilter !== "All") {
            teacherFilter.classAssigned = classFilter;
        }

        // Apply search by name, employee ID, or department.
        if (search) {
            const searchRegex = {
                $regex: search,
                $options: "i"
            };

            const matchingUsers = await User.find({
                name: searchRegex
            })
                .select("_id")
                .lean();

            teacherFilter.$or = [
                { employeeID: searchRegex },
                { department: searchRegex },
                {
                    userId: {
                        $in: matchingUsers.map(user => user._id)
                    }
                }
            ];
        }

        // Count teachers after applying class and search filters.
        const totalRecords = await Teacher.countDocuments(
            teacherFilter
        );

        const totalPages = Math.ceil(
            totalRecords / pageLimit
        );

        const validPage = totalPages > 0
            ? Math.min(currentPage, totalPages)
            : 1;

        // Fetch the requested page of teachers.
        const teachers = await Teacher.find(teacherFilter)
            .select("_id userId employeeID department classAssigned")
            .populate({
                path: "userId",
                select: "name uid"
            })
            .sort({ employeeID: 1 })
            .skip((validPage - 1) * pageLimit)
            .limit(pageLimit)
            .lean();

        const teacherIds = teachers.map(
            teacher => teacher._id
        );

        // Fetch attendance and approved leave for these teachers.
        const [attendanceRecords, approvedLeaves] = await Promise.all([
            TeacherAttendance.find({
                teacherId: { $in: teacherIds },
                date: selectedDate
            }).lean(),

            Leave.find({
                teacherId: { $in: teacherIds },
                status: "Approved",
                startDate: { $lte: selectedDate },
                endDate: { $gte: selectedDate }
            })
                .select("_id teacherId")
                .lean()
        ]);

        const attendanceMap = new Map(
            attendanceRecords.map(record => [
                record.teacherId.toString(),
                record
            ])
        );

        const leaveMap = new Map(
            approvedLeaves
                .filter(leave => leave.teacherId)
                .map(leave => [
                    leave.teacherId!.toString(),
                    leave
                ])
        );

        // Include teachers even when they have no attendance record.
        const result = teachers.map(teacher => {
            const teacherId = teacher._id.toString();
            const user = teacher.userId as any;

            const leave = leaveMap.get(teacherId);
            const record = attendanceMap.get(teacherId);

            const status = leave
                ? "Leave"
                : record?.status ?? "Not Marked";

            return {
                _id: record?._id?.toString()
                    ?? `${leave?._id ?? "unmarked"}-${teacherId}-${date}`,

                teacherId: {
                    _id: teacherId,
                    name: user?.name ?? "",
                    employeeID: teacher.employeeID,
                    department: teacher.department
                },

                date: selectedDate,
                status
            };
        });

        // Counts are based on the filtered and searched teacher roster.
        const presentCount = result.filter(
            record => record.status === "Present"
        ).length;

        const absentCount = result.filter(
            record => record.status === "Absent"
        ).length;

        const leaveCount = result.filter(
            record => record.status === "Leave"
        ).length;

        const notMarkedCount = result.filter(
            record => record.status === "Not Marked"
        ).length;

        return res.status(200).json({
            attendance: result,
            totalRecords,
            totalPages,
            currentPage: validPage,
            limit: pageLimit,
            presentCount,
            absentCount,
            leaveCount,
            notMarkedCount
        });
    } catch (error) {
        next(error);
    }
};



export const getTeacherAttendanceDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { teacherId } = req.query;

        if (!teacherId || typeof teacherId !== "string") {
            return res.status(400).json({
                message: "Teacher ID is required"
            });
        }

        const teacher = await Teacher.findById(teacherId)
            .select("employeeID department userId")
            .populate({
                path: "userId",
                select: "name uid"
            })
            .lean();

        if (!teacher) {
            return res.status(404).json({
                message: "Teacher not found"
            });
        }

        return res.status(200).json({ teacher });
    } catch (error) {
        console.error("Get teacher attendance details error:", error);
        next(error);
    }
};


export const getTeacherMonthlyAttendance = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { teacherId } = req.query;
        const year = Number(req.query.year);
        const month = Number(req.query.month);

        if (!teacherId || typeof teacherId !== "string") {
            return res.status(400).json({
                message: "Teacher ID is required"
            });
        }

        if (
            !Number.isInteger(year) ||
            year < 1000 ||
            year > 9999 ||
            !Number.isInteger(month) ||
            month < 1 ||
            month > 12
        ) {
            return res.status(400).json({
                message: "Valid year and month are required"
            });
        }

        const teacher = await Teacher.findById(teacherId).select("_id");

        if (!teacher) {
            return res.status(404).json({
                message: "Teacher not found"
            });
        }

        const startDate = new Date(Date.UTC(year, month - 1, 1));
        const endDate = new Date(Date.UTC(year, month, 1));

        const [attendanceRecords, approvedLeaves] = await Promise.all([
            TeacherAttendance.find({
                teacherId: teacher._id,
                date: {
                    $gte: startDate,
                    $lt: endDate
                }
            })
                .select("date status")
                .sort({ date: 1 })
                .lean(),

            Leave.find({
                teacherId: teacher._id,
                status: "Approved",
                startDate: { $lt: endDate },
                endDate: { $gte: startDate }
            })
                .select("startDate endDate")
                .lean()
        ]);

        // Actual attendance takes priority over approved leave.
        const attendanceDates = new Set(
            attendanceRecords.map(record =>
                new Date(record.date).toISOString().slice(0, 10)
            )
        );

        const leaveRecords: {
            _id: string;
            date: Date;
            status: "Leave";
        }[] = [];

        for (const leave of approvedLeaves) {
            const leaveStart = new Date(leave.startDate);
            const leaveEnd = new Date(leave.endDate);

            const currentDate = new Date(
                Math.max(leaveStart.getTime(), startDate.getTime())
            );

            const lastDate = new Date(
                Math.min(leaveEnd.getTime(), endDate.getTime() - 1)
            );

            currentDate.setUTCHours(0, 0, 0, 0);
            lastDate.setUTCHours(0, 0, 0, 0);

            while (currentDate <= lastDate) {
                const dateString = currentDate.toISOString().slice(0, 10);

                if (!attendanceDates.has(dateString)) {
                    leaveRecords.push({
                        _id: `${leave._id}-${dateString}`,
                        date: new Date(currentDate),
                        status: "Leave"
                    });
                }

                currentDate.setUTCDate(currentDate.getUTCDate() + 1);
            }
        }

        const attendance = [
            ...attendanceRecords,
            ...leaveRecords
        ].sort(
            (a, b) =>
                new Date(a.date).getTime() -
                new Date(b.date).getTime()
        );

        return res.status(200).json({ attendance });
    } catch (error) {
        console.error("Get teacher monthly attendance error:", error);
        next(error);
    }
};

const admissionFields = [
    "dateOfBirth",
    "gender",
    "classApplyingFor",
    "previousClass",
    "fatherName",
    "motherName",
    "phone",
    "email",
    "address",
    "city",
    "state",
    "pinCode",
    "bloodGroup",
    "aadhaarNumber",
    "academicYear"
] as const;

export async function updateStudentProfile(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const { id } = req.params;
        const body = req.body;

        // Find the Student document.
        const student = await Student.findById(id);

        if (!student || student.isDeleted) {
            return res.status(404).json({
                message: "Student not found."
            });
        }

        // Find the associated User document.
        const user = await User.findById(student.userId);

        if (!user) {
            return res.status(404).json({
                message: "Student user account not found."
            });
        }

        // Find the admission record linked to this student.
        const admission = await AdmissionRequest.findOne({
            $or: [
                { studentId: student._id },
                { userId: user._id }
            ]
        });

        if (!admission) {
            return res.status(404).json({
                message: "Admission record not found for this student."
            });
        }

        const allowedFields = [
            "name",
            "uid",
            "class",
            "rollNumber",
            ...admissionFields
        ];

        const suppliedFields = Object.keys(body);

        if (
            suppliedFields.length === 0 ||
            suppliedFields.some(field => !allowedFields.includes(field as any))
        ) {
            return res.status(400).json({
                message: "Invalid or empty profile update."
            });
        }

        // Validate fields before modifying documents.
        if (
            body.name !== undefined &&
            (typeof body.name !== "string" || !body.name.trim())
        ) {
            return res.status(400).json({
                message: "Student name cannot be empty."
            });
        }

        if (
            body.uid !== undefined &&
            (typeof body.uid !== "string" || !body.uid.trim())
        ) {
            return res.status(400).json({
                message: "UID cannot be empty."
            });
        }

        if (body.rollNumber !== undefined) {
            const rollNumber = Number(body.rollNumber);

            if (
                !Number.isInteger(rollNumber) ||
                rollNumber < 1
            ) {
                return res.status(400).json({
                    message: "Roll number must be a positive integer."
                });
            }

            student.rollNumber = rollNumber;
        }

        // Update User.
        if (body.name !== undefined) {
            user.name = body.name.trim();
            admission.studentName = body.name.trim();
        }

        if (body.uid !== undefined) {
            user.uid = body.uid.trim().toLowerCase();
        }

        // Update Student.
        if (body.class !== undefined) {
            student.class = body.class;
        }

        // Update AdmissionRequest.
        for (const field of admissionFields) {
            if (body[field] !== undefined) {
                (admission as any)[field] = body[field];
            }
        }

        // Run Mongoose schema validation when saving.
        await user.validate();
        await student.validate();
        await admission.validate();

        // Persist all three documents.
        await user.save();
        await student.save();
        await admission.save();

        return res.status(200).json({
            message: "Student profile updated successfully.",
            student: {
                _id: student._id,
                class: student.class,
                rollNumber: student.rollNumber
            },
            user: {
                _id: user._id,
                name: user.name,
                uid: user.uid,
                role: user.role,
                isActive: user.isActive
            },
            admissionRequest: admission
        });
    } catch (error: any) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "This UID is already assigned to another user."
            });
        }

        if (error.name === "ValidationError" || error.name === "CastError") {
            return res.status(400).json({
                message: error.message
            });
        }

        console.log(error);
        next(error);
    }
}

// Update Teacher Profile
export const updateTeacherProfile = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;
        const {
            name,
            uid,
            employeeID,
            department,
            classAssigned
        } = req.body;

        // Find teacher
        const teacher = await Teacher.findById(id);

        if (!teacher || teacher.isDeleted) {
            res.status(404).json({
                message: "Teacher not found"
            });
            return;
        }

        // Find associated user
        const user = await User.findById(teacher.userId);

        if (!user) {
            res.status(404).json({
                message: "Associated user not found"
            });
            return;
        }

        // Update User fields
        if (name !== undefined) {
            user.name = name.trim();
        }

        if (uid !== undefined) {
            user.uid = uid.trim().toLowerCase();
        }

        // Update Teacher fields
        if (employeeID !== undefined) {
            teacher.employeeID = employeeID.trim();
        }

        if (department !== undefined) {
            teacher.department = department;
        }

        if (classAssigned !== undefined) {
            teacher.classAssigned = classAssigned;
        }

        // Save teacher first to catch duplicate employeeID
        // and duplicate department/classAssigned combinations.
        await teacher.save();

        // Save associated user details
        await user.save();

        res.status(200).json({
            message: "Teacher profile updated successfully",
            teacher: {
                _id: teacher._id,
                employeeID: teacher.employeeID,
                department: teacher.department,
                classAssigned: teacher.classAssigned,
                userId: {
                    _id: user._id,
                    name: user.name,
                    uid: user.uid,
                    role: user.role,
                    isActive: user.isActive
                }
            }
        });
    } catch (error: any) {
        console.error("Update teacher profile error:", error);

        // Duplicate-key errors, such as an existing UID,
        // employeeID, or department/classAssigned combination.
        if (error.code === 11000) {
            res.status(409).json({
                message:
                    "A teacher with this UID, employee ID, or department and class assignment already exists."
            });
            return;
        }

        if (error.name === "ValidationError") {
            res.status(400).json({
                message: error.message
            });
            return;
        }

        res.status(500).json({
            message: "Failed to update teacher profile"
        });
    }
};

type ClassName =
    | "1st" | "2nd" | "3rd" | "4th"
    | "5th" | "6th" | "7th" | "8th"
    | "9th" | "10th" | "11th" | "12th";

const validClasses: ClassName[] = [
    "1st", "2nd", "3rd", "4th",
    "5th", "6th", "7th", "8th",
    "9th", "10th", "11th", "12th"
];

export const getMarkFormOptions = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { class: className } = req.query;

        if (
            typeof className !== "string" ||
            !validClasses.includes(className as ClassName)
        ) {
            res.status(400).json({
                message: "A valid class is required."
            });
            return;
        }

        const selectedClass = className as ClassName;

        const [students, teachers] = await Promise.all([
            Student.find({ class: selectedClass })
                .select("_id userId class rollNumber")
                .populate("userId", "name uid")
                .sort({ rollNumber: 1 })
                .lean(),

            Teacher.find({ classAssigned: selectedClass })
                .select("_id userId employeeID department classAssigned")
                .populate("userId", "name uid")
                .sort({ employeeID: 1 })
                .lean()
        ]);

        res.status(200).json({ students, teachers });
    } catch (error) {
        console.error("Error fetching mark form options:", error);

        res.status(500).json({
            message: "Failed to fetch students and teachers."
        });
    }
};



export const getTeachersForArrangement = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const className = req.query.class;

        const validClasses = [
            "1st", "2nd", "3rd", "4th", "5th", "6th",
            "7th", "8th", "9th", "10th", "11th", "12th"
        ] as const;

        if (
            typeof className !== "string" ||
            !validClasses.some(classOption => classOption === className)
        ) {
            res.status(400).json({
                message: "A valid class from 1st to 12th is required."
            });
            return;
        }

        // Narrow className to the same literal union used by the schema.
        const selectedClass = className as typeof validClasses[number];

        const teachers = await Teacher.find({
            classAssigned: selectedClass,
            isDeleted: false
        })
            .select("_id userId employeeID department classAssigned")
            .populate({
                path: "userId",
                select: "name uid isActive",
                match: { isActive: true }
            })
            .sort({ employeeID: 1 })
            .lean();

        const eligibleTeachers = teachers.filter(
            teacher => teacher.userId !== null
        );

        res.status(200).json({
            teachers: eligibleTeachers
        });
    } catch (error) {
        console.error(
            "Error fetching teachers for arrangement:",
            error
        );

        res.status(500).json({
            message: "Failed to fetch teachers."
        });
    }
};

export const createArrangement = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { originalTeacherId, arrangedTeacherId } = req.body;

        if (
            !mongoose.isValidObjectId(originalTeacherId) ||
            !mongoose.isValidObjectId(arrangedTeacherId)
        ) {
            res.status(400).json({
                message: "Valid teacher IDs are required."
            });
            return;
        }

        if (originalTeacherId === arrangedTeacherId) {
            res.status(400).json({
                message: "A teacher cannot replace themselves."
            });
            return;
        }

        const originalTeacher = await Teacher.findOne({
            _id: originalTeacherId,
            isDeleted: false
        });

        if (!originalTeacher) {
            res.status(404).json({
                message: "Original teacher not found."
            });
            return;
        }

        const originalUser = await User.findById(
            originalTeacher.userId
        );

        if (!originalUser || originalUser.isActive) {
            res.status(400).json({
                message: "The original teacher must be deactivated first."
            });
            return;
        }

        const arrangedTeacher = await Teacher.findOne({
            _id: arrangedTeacherId,
            isDeleted: false
        });

        if (!arrangedTeacher) {
            res.status(404).json({
                message: "Replacement teacher not found."
            });
            return;
        }

        const arrangedUser = await User.findById(
            arrangedTeacher.userId
        );

        if (!arrangedUser || !arrangedUser.isActive) {
            res.status(400).json({
                message: "The replacement teacher must have an active account."
            });
            return;
        }

        const existingArrangement = await Arrangement.findOne({
            originalTeacherId
        });

        if (existingArrangement) {
            res.status(409).json({
                message: "A temporary arrangement already exists for this teacher."
            });
            return;
        }

        const arrangement = await Arrangement.create({
            originalTeacherId: originalTeacher._id,
            arrangedTeacherId: arrangedTeacher._id,
            class: originalTeacher.classAssigned,
            department: originalTeacher.department
        });

        res.status(201).json({
            message: "Temporary arrangement created successfully.",
            arrangement
        });
    } catch (error) {
        console.error("Error creating arrangement:", error);

        res.status(500).json({
            message: "Failed to create temporary arrangement."
        });
    }
};

export const deleteArrangementByOriginalTeacher = async (
    originalTeacherId: string
) => {
    return Arrangement.findOneAndDelete({
        originalTeacherId
    });
};

// Remove an arrangement when a new teacher fills the vacancy.
export const deleteArrangementByPosition = async (
    className: string,
    department: string
) => {
    const validClasses = [
        "1st", "2nd", "3rd", "4th", "5th", "6th",
        "7th", "8th", "9th", "10th", "11th", "12th"
    ] as const;

    const validDepartments = [
        "Science",
        "Mathematics",
        "English",
        "Social Science",
        "Hindi"
    ] as const;

    if (
        !validClasses.some(classOption => classOption === className) ||
        !validDepartments.some(option => option === department)
    ) {
        throw new Error("Invalid class or department.");
    }

    const selectedClass =
        className as typeof validClasses[number];

    const selectedDepartment =
        department as typeof validDepartments[number];

    return Arrangement.findOneAndDelete({
        class: selectedClass,
        department: selectedDepartment
    });
};


export const getMarkSubjects = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const subjects = await Subject.distinct("name");

        return res.status(200).json({
            subjects: subjects.sort()
        });
    } catch (error) {
        next(error);
    }
};