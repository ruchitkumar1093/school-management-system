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
import TeacherAssignment from "../models/TeacherAssignment";

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

export const assignClassTeacher = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
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

        const teacherAssignment = await TeacherAssignment.findOne({
            teacherId: teacher._id,
            classId: classData._id
        });

        if (!teacherAssignment) {
            return res.status(400).json({
                message: "Teacher is not assigned to this class"
            });
        }

        await Class.updateOne(
            { _id: classData._id },
            { $set: { teacherId: teacher._id } }
        );

        return res.status(200).json({
            message: "Class teacher assigned successfully"
        });
    } catch (error) {
        next(error);
    }
};

//Leaves

export const getLeaveApplications = async (
    req: Request,
    res: Response
) => {
    try {
        const status = req.query.status?.toString() || "All";
        const classFilter = req.query.class?.toString() || "All";

        const currentPage = Math.max(Number(req.query.page) || 1, 1);
        const pageLimit = Math.max(Number(req.query.limit) || 5, 1);
        const skip = (currentPage - 1) * pageLimit;

        // Get available classes for the dropdown.
        const availableClasses: string[] = await Class.distinct("class");

        const classes = availableClasses.sort((a, b) => {
            const numberA = parseInt(a.match(/\d+/)?.[0] ?? "0", 10);
            const numberB = parseInt(b.match(/\d+/)?.[0] ?? "0", 10);
            return numberA - numberB;
        });

        const filter: Record<string, any> = {
            studentId: { $exists: true, $ne: null },
        };

        if (status !== "All") {
            filter.status = status;
        }

        if (classFilter !== "All") {
            const students = await Student.find({
                class: classFilter as StudentClass,
            }).select("_id");

            filter.studentId = {
                $in: students.map((student) => student._id),
            };
        }

        const [totalLeaves, leaves] = await Promise.all([
            Leave.countDocuments(filter),

            Leave.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(pageLimit)
                .populate({
                    path: "studentId",
                    populate: {
                        path: "userId",
                        select: "name uid",
                    },
                }),
        ]);

        const formattedLeaves = leaves.flatMap((leave) => {
            const student = leave.studentId as any;

            // Avoid crashing if a referenced student or user no longer exists.
            if (!student || !student.userId) {
                return [];
            }

            return [{
                _id: leave._id,
                student: {
                    _id: student._id,
                    name: student.userId.name,
                    uid: student.userId.uid,
                    class: student.class,
                },
                startDate: leave.startDate,
                endDate: leave.endDate,
                reason: leave.reason,
                status: leave.status,
            }];
        });

        res.status(200).json({
            leaves: formattedLeaves,
            totalLeaves,
            totalPages: Math.ceil(totalLeaves / pageLimit),
            currentPage,
            limit: pageLimit,
            classes,
        });
    } catch (error) {
        console.error("Get principal leave applications error:", error);

        res.status(500).json({
            message: "Failed to get leave applications",
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
        const status = req.query.status?.toString() || "All";
        const classFilter = req.query.class?.toString() || "All";

        const currentPage = Math.max(Number(req.query.page) || 1, 1);
        const pageLimit = Math.max(Number(req.query.limit) || 5, 1);
        const skip = (currentPage - 1) * pageLimit;

        // Fetch available classes for the shared class filter.
        const availableClasses: string[] = await Class.distinct("class");

        const classes = availableClasses.sort((a, b) => {
            const numberA = parseInt(a.match(/\d+/)?.[0] ?? "0", 10);
            const numberB = parseInt(b.match(/\d+/)?.[0] ?? "0", 10);
            return numberA - numberB;
        });

        // Find teachers assigned to the selected class.
        let teacherIds: any[] | null = null;

        if (classFilter !== "All") {
            const selectedClass = await Class.findOne({
                class: classFilter as StudentClass,
            }).select("_id");

            if (!selectedClass) {
                return res.status(200).json({
                    leaves: [],
                    totalLeaves: 0,
                    totalPages: 0,
                    currentPage,
                    limit: pageLimit,
                    classes,
                });
            }

            teacherIds = await TeacherAssignment.distinct("teacherId", {
                classId: selectedClass._id,
            });
        }

        const filter: Record<string, any> = {
            teacherId: { $exists: true, $ne: null },
        };

        if (status !== "All") {
            filter.status = status;
        }

        if (teacherIds !== null) {
            filter.teacherId = {
                $in: teacherIds,
            };
        }

        const [totalLeaves, leaves] = await Promise.all([
            Leave.countDocuments(filter),

            Leave.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(pageLimit)
                .populate({
                    path: "teacherId",
                    match: { isDeleted: { $ne: true } },
                    populate: {
                        path: "userId",
                        select: "name uid",
                    },
                }),
        ]);

        // Get valid teachers from the populated leave records.
        const validLeaves = leaves.filter((leave) => {
            const teacher = leave.teacherId as any;
            return teacher && teacher.userId;
        });

        const pageTeacherIds = [
            ...new Set(
                validLeaves.map((leave) => {
                    const teacher = leave.teacherId as any;
                    return teacher._id.toString();
                })
            ),
        ];

        // Load assignments for the teachers on this page.
        const assignments = pageTeacherIds.length
            ? await TeacherAssignment.find({
                teacherId: { $in: pageTeacherIds },
            }).populate({
                path: "classId",
                select: "class",
            })
            : [];

        const classesByTeacher = new Map<string, Set<string>>();

        for (const assignment of assignments) {
            const teacherId = assignment.teacherId.toString();
            const assignedClass = assignment.classId as any;

            if (!assignedClass?.class) {
                continue;
            }

            if (!classesByTeacher.has(teacherId)) {
                classesByTeacher.set(teacherId, new Set<string>());
            }

            classesByTeacher.get(teacherId)!.add(assignedClass.class);
        }

        const formattedLeaves = validLeaves.map((leave) => {
            const teacher = leave.teacherId as any;

            const assignedClasses = [
                ...(classesByTeacher.get(teacher._id.toString()) ?? []),
            ].sort((a, b) => {
                const numberA = parseInt(a.match(/\d+/)?.[0] ?? "0", 10);
                const numberB = parseInt(b.match(/\d+/)?.[0] ?? "0", 10);
                return numberA - numberB;
            });

            return {
                _id: leave._id,
                teacher: {
                    _id: teacher._id,
                    name: teacher.userId.name,
                    uid: teacher.userId.uid,
                    employeeID: teacher.employeeID,
                    classes: assignedClasses,
                },
                startDate: leave.startDate,
                endDate: leave.endDate,
                reason: leave.reason,
                status: leave.status,
            };
        });

        res.status(200).json({
            leaves: formattedLeaves,
            totalLeaves,
            totalPages: Math.ceil(totalLeaves / pageLimit),
            currentPage,
            limit: pageLimit,
            classes,
        });
    } catch (error) {
        console.error("Get teacher leave applications error:", error);

        res.status(500).json({
            message: "Failed to get teacher leave applications",
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
export const getStudents = async (
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

        const currentPage = Math.max(Number(page) || 1, 1);
        const pageLimit = Math.max(Number(limit) || 5, 1);
        const skip = (currentPage - 1) * pageLimit;

        const match: Record<string, any> = {};

        if (showDeleted !== "true") {
            match.$or = [
                { isDeleted: false },
                { isDeleted: { $exists: false } }
            ];
        }

        if (classFilter !== "All") {
            match.class = classFilter;
        }

        const searchValue = search.toString().trim();

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

        if (searchValue) {
            match["userId.name"] = {
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
                    "userId.name": order === "desc" ? -1 : 1
                }
            });
        } else if (sortBy === "Class") {
            pipeline.push(
                {
                    $addFields: {
                        classNumber: {
                            $toInt: {
                                $getField: {
                                    field: "match",
                                    input: {
                                        $regexFind: {
                                            input: {
                                                $ifNull: ["$class", ""]
                                            },
                                            regex: "\\d+"
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                {
                    $sort: {
                        classNumber: order === "desc" ? -1 : 1,
                        "userId.name": 1
                    }
                }
            );
        } else if (sortBy === "Roll no") {
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

        const [result, classes] = await Promise.all([
            Student.aggregate(pipeline),
            Class.distinct("class")
        ]);

        const students = result[0]?.students ?? [];
        const totalStudents = result[0]?.total[0]?.count ?? 0;
        const totalPages = Math.ceil(totalStudents / pageLimit);

        const sortedClasses = classes.sort(
            (a: string, b: string) =>
                Number.parseInt(a, 10) - Number.parseInt(b, 10)
        );

        return res.status(200).json({
            students,
            totalStudents,
            totalPages,
            currentPage,
            limit: pageLimit,
            classes: sortedClasses
        });
    } catch (error) {
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
            showDeleted = "false",
            classTeacherOnly = "false"
        } = req.query;

        const currentPage = Math.max(Number(page) || 1, 1);
        const pageLimit = Math.max(Number(limit) || 5, 1);
        const skip = (currentPage - 1) * pageLimit;

        const match: Record<string, any> = {};

        if (showDeleted !== "true") {
            match.$or = [
                { isDeleted: false },
                { isDeleted: { $exists: false } }
            ];
        }

        const searchValue = search.toString().trim();

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
                    from: "teacherassignments",
                    localField: "_id",
                    foreignField: "teacherId",
                    as: "assignments"
                }
            },
            {
                $lookup: {
                    from: "classes",
                    localField: "assignments.classId",
                    foreignField: "_id",
                    as: "assignedClasses"
                }
            },
            {
                $addFields: {
                    classes: {
                        $setUnion: [
                            {
                                $map: {
                                    input: "$assignedClasses",
                                    as: "classItem",
                                    in: "$$classItem.class"
                                }
                            },
                            []
                        ]
                    }
                }
            },
            {
                $lookup: {
                    from: "subjects",
                    localField: "assignments.subjectId",
                    foreignField: "_id",
                    as: "assignedSubjects"
                }
            },
            {
                $addFields: {
                    subjects: {
                        $setUnion: [
                            {
                                $map: {
                                    input: "$assignedSubjects",
                                    as: "subjectItem",
                                    in: "$$subjectItem.name"
                                }
                            },
                            []
                        ]
                    }
                }
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
            }
        ];

        if (searchValue) {
            match["userId.name"] = {
                $regex: searchValue,
                $options: "i"
            };
        }

        if (classFilter !== "All") {
            match.classes = classFilter;
        }

        pipeline.push({ $match: match });

        // Apply the Class Teachers Only filter before pagination.
        if (classTeacherOnly === "true") {
            pipeline.push({
                $match: {
                    isClassTeacher: true
                }
            });
        }

        if (sortBy === "Teacher Name") {
            pipeline.push({
                $sort: {
                    "userId.name": order === "desc" ? -1 : 1
                }
            });
        } else if (sortBy === "Class Assigned") {
            pipeline.push(
                {
                    $addFields: {
                        classNumber: {
                            $min: {
                                $map: {
                                    input: "$classes",
                                    as: "className",
                                    in: {
                                        $toInt: {
                                            $getField: {
                                                field: "match",
                                                input: {
                                                    $regexFind: {
                                                        input: "$$className",
                                                        regex: "\\d+"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                {
                    $sort: {
                        classNumber: order === "desc" ? -1 : 1,
                        "userId.name": 1
                    }
                }
            );
        }

        pipeline.push({
            $facet: {
                teachers: [
                    { $skip: skip },
                    { $limit: pageLimit },
                    {
                        $project: {
                            user: "$userId",
                            userId: 1,
                            employeeID: 1,
                            department: 1,
                            classAssigned: 1,
                            classes: 1,
                            subjects: 1,
                            isDeleted: 1,
                            deletedAt: 1,
                            isClassTeacher: 1
                        }
                    }
                ],
                total: [
                    { $count: "count" }
                ]
            }
        });

        const [result, availableClasses] = await Promise.all([
            Teacher.aggregate(pipeline),
            Class.distinct("class")
        ]);

        const teachers = result[0]?.teachers ?? [];
        const totalTeachers = result[0]?.total[0]?.count ?? 0;
        const totalPages = Math.ceil(totalTeachers / pageLimit);

        const sortedClasses = availableClasses.sort(
            (a: string, b: string) =>
                Number.parseInt(a, 10) - Number.parseInt(b, 10)
        );

        return res.status(200).json({
            teachers,
            totalTeachers,
            totalPages,
            currentPage,
            limit: pageLimit,
            classes: sortedClasses
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

        const match: Record<string, any> = {};

        if (classFilter !== "All") {
            match.class = classFilter;
        }

        const searchValue = search.toString().trim();

        if (searchValue) {
            match.name = {
                $regex: searchValue,
                $options: "i"
            };
        }

        const sortOrder = order === "desc" ? -1 : 1;

        const pipeline: any[] = [
            { $match: match }
        ];

        if (sortBy === "Subject Name") {
            pipeline.push({
                $sort: {
                    name: sortOrder
                }
            });
        } else if (sortBy === "Class") {
            pipeline.push(
                {
                    $addFields: {
                        classNumber: {
                            $toInt: {
                                $arrayElemAt: [
                                    {
                                        $regexFindAll: {
                                            input: "$class",
                                            regex: "\\d+"
                                        }
                                    },
                                    0
                                ]
                            }
                        }
                    }
                },
                {
                    $sort: {
                        classNumber: sortOrder,
                        name: 1
                    }
                }
            );
        } else {
            pipeline.push({
                $sort: {
                    createdAt: -1
                }
            });
        }

        // Find the teacher assigned to each exact subject-class pair.
        pipeline.push(
            {
                $lookup: {
                    from: "teacherassignments",
                    let: {
                        subjectId: "$_id",
                        subjectClass: "$class"
                    },
                    pipeline: [
                        {
                            $lookup: {
                                from: "classes",
                                localField: "classId",
                                foreignField: "_id",
                                as: "classDoc"
                            }
                        },
                        {
                            $unwind: "$classDoc"
                        },
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        {
                                            $eq: [
                                                "$subjectId",
                                                "$$subjectId"
                                            ]
                                        },
                                        {
                                            $eq: [
                                                "$classDoc.class",
                                                "$$subjectClass"
                                            ]
                                        }
                                    ]
                                }
                            }
                        },
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
                        {
                            $match: {
                                $or: [
                                    { "teacher.isDeleted": { $ne: true } },
                                    { teacher: { $exists: false } }
                                ]
                            }
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
                        },
                        { $limit: 1 }
                    ],
                    as: "assignmentTeacher"
                }
            },
            {
                $addFields: {
                    teacherName: {
                        $ifNull: [
                            {
                                $arrayElemAt: [
                                    "$assignmentTeacher.name",
                                    0
                                ]
                            },
                            "Not Assigned"
                        ]
                    }
                }
            },
            {
                $project: {
                    assignmentTeacher: 0,
                    classNumber: 0
                }
            },
            {
                $facet: {
                    subjects: [
                        { $skip: skip },
                        { $limit: pageLimit }
                    ],
                    total: [
                        { $count: "count" }
                    ]
                }
            }
        );

        const [result, allClasses] = await Promise.all([
            Subject.aggregate(pipeline),
            Class.find({})
                .distinct("class")
        ]);

        const subjects = result[0]?.subjects ?? [];
        const totalSubjects = result[0]?.total[0]?.count ?? 0;

        const classes = allClasses.sort(
            (a: string, b: string) =>
                Number.parseInt(a, 10) -
                Number.parseInt(b, 10)
        );

        return res.status(200).json({
            subjects,
            totalSubjects,
            totalPages: Math.ceil(totalSubjects / pageLimit),
            currentPage,
            limit: pageLimit,
            classes
        });
    } catch (error) {
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

        const match: Record<string, any> = {};

        if (classFilter !== "All") {
            match["student.class"] = classFilter;
        }

        if (exam !== "All") {
            match.exam = exam;
        }

        if (subject !== "All") {
            match["subject.name"] = subject;
        }

        if (
            teacher !== "All" &&
            mongoose.Types.ObjectId.isValid(teacher.toString())
        ) {
            match.teacherId = new mongoose.Types.ObjectId(
                teacher.toString()
            );
        }

        const searchValue = search.toString().trim();

        if (searchValue) {
            match["studentUser.name"] = {
                $regex: searchValue,
                $options: "i"
            };
        }

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
            },
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
            },
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
            },
            { $match: match }
        ];

        if (sortBy === "Student Name") {
            pipeline.push({
                $sort: {
                    "studentUser.name": order === "desc" ? -1 : 1
                }
            });
        } else if (sortBy === "Subject Name") {
            pipeline.push({
                $sort: {
                    "subject.name": order === "desc" ? -1 : 1
                }
            });
        } else if (sortBy === "Class") {
            pipeline.push(
                {
                    $addFields: {
                        classNumber: {
                            $toInt: {
                                $getField: {
                                    field: "match",
                                    input: {
                                        $regexFind: {
                                            input: {
                                                $ifNull: ["$student.class", ""]
                                            },
                                            regex: "\\d+"
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                {
                    $sort: {
                        classNumber: order === "desc" ? -1 : 1,
                        "studentUser.name": 1
                    }
                }
            );
        } else if (sortBy === "Marks Obtained") {
            pipeline.push({
                $sort: {
                    marksObtained: order === "desc" ? -1 : 1
                }
            });
        } else {
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

        const [result, classes] = await Promise.all([
            Mark.aggregate(pipeline),
            Class.distinct("class")
        ]);

        const marks = result[0]?.marks ?? [];
        const totalMarks = result[0]?.total[0]?.count ?? 0;

        const formattedMarks = marks.map((mark: any) => ({
            _id: mark._id.toString(),
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

        return res.status(200).json({
            marks: formattedMarks,
            totalMarks,
            totalPages: Math.ceil(totalMarks / pageLimit),
            currentPage,
            limit: pageLimit,
            classes: classes.sort(
                (a: string, b: string) =>
                    Number.parseInt(a, 10) -
                    Number.parseInt(b, 10)
            )
        });
    } catch (error) {
        next(error);
    }
};



export const getMarkTeachers = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const teachers = await Teacher.aggregate([
            {
                $match: {
                    isDeleted: { $ne: true }
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
                $unwind: "$user"
            },
            {
                $lookup: {
                    from: "teacherassignments",
                    localField: "_id",
                    foreignField: "teacherId",
                    as: "assignments"
                }
            },
            {
                $lookup: {
                    from: "classes",
                    localField: "assignments.classId",
                    foreignField: "_id",
                    as: "assignedClasses"
                }
            },
            {
                $project: {
                    _id: 0,
                    id: { $toString: "$_id" },
                    name: "$user.name",
                    classes: {
                        $sortArray: {
                            input: {
                                $setUnion: [
                                    {
                                        $map: {
                                            input: "$assignedClasses",
                                            as: "classItem",
                                            in: "$$classItem.class"
                                        }
                                    },
                                    []
                                ]
                            },
                            sortBy: 1
                        }
                    }
                }
            },
            {
                $sort: {
                    name: 1
                }
            }
        ]);

        return res.status(200).json({
            teachers
        });
    } catch (error) {
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
        const studentClass =
            req.query.class?.toString() as StudentClass | undefined;

        const exam =
            req.query.exam?.toString() as ExamType | undefined;

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

        const [students, subjects, classes] = await Promise.all([
            Student.find({
                class: studentClass
            }).populate({
                path: "userId",
                select: "name uid"
            }),

            Subject.find({
                class: studentClass
            }).select("name subjectCode"),

            Class.distinct("class")
        ]);

        // Fetch marks for all students in the selected class and exam.
        const marks = await Mark.find({
            studentId: {
                $in: students.map(student => student._id)
            },
            exam
        }).populate({
            path: "subjectId",
            select: "name subjectCode"
        });

        // Calculate results dynamically for every subject in this class.
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
                } | null
            > = {};

            // Initialize every subject, including subjects without marks.
            subjects.forEach(subject => {
                subjectMarks[subject.name] = null;
            });

            studentMarks.forEach(mark => {
                if (!mark.subjectId) {
                    return;
                }

                const subject = mark.subjectId as any;
                const subjectName = subject.name as string;

                // Only include subjects belonging to the selected class.
                if (
                    Object.prototype.hasOwnProperty.call(
                        subjectMarks,
                        subjectName
                    )
                ) {
                    subjectMarks[subjectName] = {
                        obtained: mark.marksObtained,
                        total: mark.totalMarks
                    };
                }
            });

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

                const subjectPercentage =
                    mark.total > 0
                        ? (mark.obtained / mark.total) * 100
                        : 0;

                if (subjectPercentage < 33) {
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

                result = hasFailedSubject ? "Fail" : "Pass";
            }

            const user = student.userId as any;

            return {
                studentName: user?.name ?? "Student Deleted",
                uid: user?.uid ?? "",
                class: student.class,
                subjects: subjectMarks,
                total: hasAnyMarks
                    ? {
                        obtained: obtainedMarks,
                        total: totalMarks
                    }
                    : null,
                percentage,
                result
            };
        });

        // Search by student name or UID.
        if (search) {
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

        // Sorting.
        if (sortBy === "Student Name") {
            results.sort((a, b) => {
                const comparison = a.studentName.localeCompare(
                    b.studentName
                );

                return order === "desc"
                    ? -comparison
                    : comparison;
            });
        } else if (sortBy === "UID") {
            results.sort((a, b) => {
                const comparison = a.uid.localeCompare(b.uid);

                return order === "desc"
                    ? -comparison
                    : comparison;
            });
        } else if (sortBy === "Total Marks") {
            results.sort((a, b) => {
                const comparison =
                    (a.total?.obtained ?? 0) -
                    (b.total?.obtained ?? 0);

                return order === "desc"
                    ? -comparison
                    : comparison;
            });
        } else if (sortBy === "Percentage") {
            results.sort((a, b) => {
                const comparison =
                    (a.percentage ?? -1) -
                    (b.percentage ?? -1);

                return order === "desc"
                    ? -comparison
                    : comparison;
            });
        }

        // Pagination.
        const totalResults = results.length;

        const totalPages = Math.ceil(
            totalResults / pageLimit
        );

        const startIndex = (currentPage - 1) * pageLimit;

        const paginatedResults = results.slice(
            startIndex,
            startIndex + pageLimit
        );

        // Sort available classes numerically.
        const sortedClasses = classes.sort(
            (a: string, b: string) =>
                Number.parseInt(a, 10) -
                Number.parseInt(b, 10)
        );

        // Return all subjects so the frontend can build dynamic columns.
        const formattedSubjects = subjects.map(subject => ({
            name: subject.name,
            subjectCode: subject.subjectCode
        }));

        return res.status(200).json({
            results: paginatedResults,
            subjects: formattedSubjects,
            totalResults,
            totalPages,
            currentPage,
            limit: pageLimit,
            classes: sortedClasses
        });
    } catch (error) {
        next(error);
    }
};

// Subject CRUD

const MAX_SUBJECT_NAMES = 8;

const EXISTING_SUBJECT_NAMES = [
    "Science",
    "Mathematics",
    "English",
    "Social Science",
    "Hindi",
];

const escapeRegex = (value: string): string =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeSubjectName = (value: string): string =>
    value.trim().replace(/\s+/g, " ");

// Get distinct subject names for the subject-name dropdown.
export const getSubjectNames = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const names = await Subject.distinct("name");

        // Keep the original five available even if a subject has not
        // yet been assigned to a class.
        const uniqueNames = new Map<string, string>();

        for (const name of [...EXISTING_SUBJECT_NAMES, ...names]) {
            const normalized = normalizeSubjectName(name);
            const key = normalized.toLowerCase();

            if (!uniqueNames.has(key)) {
                uniqueNames.set(key, normalized);
            }
        }

        return res.status(200).json(
            Array.from(uniqueNames.values())
                .sort((a, b) => a.localeCompare(b))
                .map((name) => ({ name }))
        );
    } catch (error) {
        next(error);
    }
};

// Get classes for the class dropdown.
export const getClasses = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const classes = await Class.find()
            .select("_id class")
            .lean();

        const classOrder: Record<string, number> = {
            "1st": 1,
            "2nd": 2,
            "3rd": 3,
            "4th": 4,
            "5th": 5,
            "6th": 6,
            "7th": 7,
            "8th": 8,
            "9th": 9,
            "10th": 10,
            "11th": 11,
            "12th": 12,
        };

        classes.sort(
            (a, b) =>
                (classOrder[a.class] ?? 99) -
                (classOrder[b.class] ?? 99)
        );

        return res.status(200).json(classes);
    } catch (error) {
        next(error);
    }
};

// Add a subject record for a particular class.
export const createSubject = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const {
            name: rawName,
            subjectCode: rawSubjectCode,
            class: rawClass,
        } = req.body;

        if (
            typeof rawName !== "string" ||
            typeof rawSubjectCode !== "string" ||
            typeof rawClass !== "string"
        ) {
            return res.status(400).json({
                message: "Subject name, subject code, and class are required",
            });
        }

        const name = normalizeSubjectName(rawName);
        const subjectCode = rawSubjectCode.trim().toUpperCase();

        if (!name || !subjectCode) {
            return res.status(400).json({
                message: "Subject name and subject code cannot be empty",
            });
        }

        // Validate the class against the allowed class values.
        const validClasses: StudentClass[] = [
            "1st", "2nd", "3rd", "4th", "5th", "6th",
            "7th", "8th", "9th", "10th", "11th", "12th",
        ];

        if (!validClasses.includes(rawClass as StudentClass)) {
            return res.status(400).json({
                message: "Invalid class selected",
            });
        }

        const subjectClass = rawClass as StudentClass;

        // Ensure the class exists in the database.
        const classExists = await Class.exists({
            class: subjectClass,
        });

        if (!classExists) {
            return res.status(400).json({
                message: "Invalid class selected",
            });
        }

        // Prevent duplicate subject names within the same class,
        // regardless of capitalization.
        const existingSubject = await Subject.findOne({
            name: {
                $regex: `^${escapeRegex(name)}$`,
                $options: "i",
            },
            class: subjectClass,
        });

        if (existingSubject) {
            return res.status(400).json({
                message: "A subject with this name already exists for this class",
            });
        }

        // Enforce the maximum number of distinct subject names.
        const existingName = await Subject.findOne({
            name: {
                $regex: `^${escapeRegex(name)}$`,
                $options: "i",
            },
        });

        if (!existingName) {
            const currentNames = await Subject.distinct("name");

            const uniqueNames = new Set(
                currentNames.map((item) =>
                    normalizeSubjectName(item).toLowerCase()
                )
            );

            for (const defaultName of EXISTING_SUBJECT_NAMES) {
                uniqueNames.add(defaultName.toLowerCase());
            }

            if (uniqueNames.size >= MAX_SUBJECT_NAMES) {
                return res.status(400).json({
                    message: "A maximum of 8 distinct subject names is allowed",
                });
            }
        }

        // Subject codes must be unique.
        const existingCode = await Subject.findOne({
            subjectCode,
        });

        if (existingCode) {
            return res.status(409).json({
                message: "This subject code is already in use",
            });
        }

        const subject = await Subject.create({
            name,
            subjectCode,
            class: subjectClass,
        });

        return res.status(201).json({
            message: "Subject created successfully",
            subject,
        });
    } catch (error) {
        if ((error as { code?: number }).code === 11000) {
            return res.status(409).json({
                message: "A subject with this name, class, or code already exists",
            });
        }

        next(error);
    }
};

// Update an existing subject record.
export const updateSubject = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid subject ID",
            });
        }

        const {
            name: rawName,
            subjectCode: rawSubjectCode,
            class: rawClass,
        } = req.body;

        if (
            typeof rawName !== "string" ||
            typeof rawSubjectCode !== "string" ||
            typeof rawClass !== "string"
        ) {
            return res.status(400).json({
                message: "Subject name, subject code, and class are required",
            });
        }

        const name = normalizeSubjectName(rawName);
        const subjectCode = rawSubjectCode.trim().toUpperCase();

        if (!name || !subjectCode) {
            return res.status(400).json({
                message: "Subject name and subject code cannot be empty",
            });
        }

        // Validate the class against the allowed class values.
        const validClasses: StudentClass[] = [
            "1st", "2nd", "3rd", "4th", "5th", "6th",
            "7th", "8th", "9th", "10th", "11th", "12th",
        ];

        if (!validClasses.includes(rawClass as StudentClass)) {
            return res.status(400).json({
                message: "Invalid class selected",
            });
        }

        const subjectClass = rawClass as StudentClass;

        const subject = await Subject.findById(id);

        if (!subject) {
            return res.status(404).json({
                message: "Subject not found",
            });
        }

        // Ensure the selected class exists in the database.
        const classExists = await Class.exists({
            class: subjectClass,
        });

        if (!classExists) {
            return res.status(400).json({
                message: "Invalid class selected",
            });
        }

        // Prevent duplicate subject names within the same class,
        // regardless of capitalization.
        const duplicateSubject = await Subject.findOne({
            name: {
                $regex: `^${escapeRegex(name)}$`,
                $options: "i",
            },
            class: subjectClass,
            _id: { $ne: id },
        });

        if (duplicateSubject) {
            return res.status(400).json({
                message: "A subject with this name already exists for this class",
            });
        }

        // Subject codes must be unique across all classes.
        const duplicateCode = await Subject.findOne({
            subjectCode,
            _id: { $ne: id },
        });

        if (duplicateCode) {
            return res.status(409).json({
                message: "This subject code is already in use",
            });
        }

        // Check whether this name already exists on another subject.
        const nameAlreadyExists = await Subject.findOne({
            name: {
                $regex: `^${escapeRegex(name)}$`,
                $options: "i",
            },
            _id: { $ne: id },
        });

        const isSameName =
            normalizeSubjectName(subject.name).toLowerCase() ===
            name.toLowerCase();

        // Enforce the distinct subject-name limit when introducing
        // a genuinely new name.
        if (!nameAlreadyExists && !isSameName) {
            const currentNames = await Subject.distinct("name");

            const uniqueNames = new Set(
                currentNames.map((item) =>
                    normalizeSubjectName(item).toLowerCase()
                )
            );

            for (const defaultName of EXISTING_SUBJECT_NAMES) {
                uniqueNames.add(defaultName.toLowerCase());
            }

            if (uniqueNames.size >= MAX_SUBJECT_NAMES) {
                return res.status(400).json({
                    message: "A maximum of 8 distinct subject names is allowed",
                });
            }
        }

        // Update the subject.
        subject.name = name;
        subject.subjectCode = subjectCode;
        subject.class = subjectClass;

        await subject.save();

        return res.status(200).json({
            message: "Subject updated successfully",
            subject,
        });
    } catch (error) {
        if ((error as { code?: number }).code === 11000) {
            return res.status(409).json({
                message: "A subject with this name, class, or code already exists",
            });
        }

        next(error);
    }
};

// Fetch one subject record for edit mode.
export const getSubjectById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid subject ID",
            });
        }

        const subject = await Subject.findById(id);

        if (!subject) {
            return res.status(404).json({
                message: "Subject not found",
            });
        }

        return res.status(200).json(subject);
    } catch (error) {
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

type TeacherAssignmentInput = {
    subjectId: string;
    classId: string;
};

const resolveTeacherAssignments = async (
    assignments: TeacherAssignmentInput[],
    session: mongoose.ClientSession,
    teacherId?: mongoose.Types.ObjectId
) => {
    if (!Array.isArray(assignments) || assignments.length === 0) {
        throw Object.assign(
            new Error("Add at least one subject and class assignment."),
            { status: 400 }
        );
    }

    const resolvedAssignments: {
        subjectId: mongoose.Types.ObjectId;
        classId: mongoose.Types.ObjectId;
    }[] = [];

    const seen = new Set<string>();

    for (const item of assignments) {
        if (
            !item ||
            typeof item.subjectId !== "string" ||
            !mongoose.isValidObjectId(item.subjectId) ||
            typeof item.classId !== "string" ||
            !mongoose.isValidObjectId(item.classId)
        ) {
            throw Object.assign(
                new Error("Every assignment must contain valid subject and class IDs."),
                { status: 400 }
            );
        }

        const subjectId = new mongoose.Types.ObjectId(item.subjectId);
        const classId = new mongoose.Types.ObjectId(item.classId);

        const assignmentKey = `${subjectId.toString()}:${classId.toString()}`;

        if (seen.has(assignmentKey)) {
            throw Object.assign(
                new Error("Duplicate subject and class assignments are not allowed."),
                { status: 400 }
            );
        }

        seen.add(assignmentKey);

        const subject = await Subject.findById(subjectId)
            .select("_id name class")
            .session(session);

        const classDocument = await Class.findById(classId)
            .select("_id class")
            .session(session);

        if (!subject) {
            throw Object.assign(
                new Error("The selected subject was not found."),
                { status: 400 }
            );
        }

        if (!classDocument) {
            throw Object.assign(
                new Error("The selected class was not found."),
                { status: 400 }
            );
        }

        if (subject.class !== classDocument.class) {
            throw Object.assign(
                new Error(
                    `Subject "${subject.name}" does not belong to Class ${classDocument.class}.`
                ),
                { status: 400 }
            );
        }

        const existingAssignment = await TeacherAssignment.findOne({
            subjectId,
            classId,
            ...(teacherId
                ? { teacherId: { $ne: teacherId } }
                : {})
        }).session(session);

        if (existingAssignment) {
            throw Object.assign(
                new Error(
                    `${subject.name} in Class ${classDocument.class} is already assigned to another teacher.`
                ),
                { status: 409 }
            );
        }

        resolvedAssignments.push({
            subjectId,
            classId
        });
    }

    return resolvedAssignments;
};


export const createTeacher = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const session = await mongoose.startSession();

    try {
        const { name, password, assignments } = req.body;

        if (
            typeof name !== "string" ||
            !name.trim() ||
            typeof password !== "string" ||
            !password
        ) {
            return res.status(400).json({
                message: "Teacher name and password are required."
            });
        }

        let createdTeacher: any;

        await session.withTransaction(async () => {
            // Validate all subject-class pairs before creating records.
            const resolvedAssignments = await resolveTeacherAssignments(
                assignments,
                session
            );

            // Generate the next teacher UID.
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

            // Generate the next employee ID.
            const lastTeacher = await Teacher.findOne()
                .sort({ employeeID: -1 })
                .session(session);

            let employeeNumber = 1;

            if (lastTeacher) {
                const lastNumber = parseInt(
                    lastTeacher.employeeID.replace("EMP", ""),
                    10
                );

                if (Number.isFinite(lastNumber)) {
                    employeeNumber = lastNumber + 1;
                }
            }

            const employeeID =
                `EMP${String(employeeNumber).padStart(4, "0")}`;

            const hashedPassword = await bcrypt.hash(password, 10);

            const [user] = await User.create(
                [{
                    name: name.trim(),
                    uid,
                    password: hashedPassword,
                    role: "teacher"
                }],
                { session }
            );

            const [teacher] = await Teacher.create(
                [{
                    userId: user._id,
                    employeeID
                }],
                { session }
            );

            const assignmentDocuments = resolvedAssignments.map(
                (assignment) => ({
                    teacherId: teacher._id,
                    subjectId: assignment.subjectId,
                    classId: assignment.classId
                })
            );

            await TeacherAssignment.insertMany(
                assignmentDocuments,
                { session }
            );

            createdTeacher = {
                _id: teacher._id,
                userId: user._id,
                uid,
                employeeID
            };
        });

        return res.status(201).json({
            message: "Teacher created successfully.",
            teacher: createdTeacher
        });
    } catch (error: any) {
        if (error.status) {
            return res.status(error.status).json({
                message: error.message
            });
        }

        if (error.code === 11000) {
            return res.status(409).json({
                message:
                    "A duplicate UID, employee ID, or subject-class assignment was detected."
            });
        }

        return next(error);
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
        ).populate(
            "userId",
            "name uid role isActive"
        );

        if (!teacher) {
            return res.status(404).json({
                message: "Teacher not found"
            });
        }

        // Fetch all subject and class assignments.
        const assignments = await TeacherAssignment.find({
            teacherId: teacher._id
        })
            .populate({
                path: "subjectId",
                select: "name subjectCode class"
            })
            .populate({
                path: "classId",
                select: "class"
            })
            .lean();

        // Get unique assigned classes.
        const classes = [
            ...new Set(
                assignments
                    .map((assignment) => {
                        const assignedClass =
                            assignment.classId as any;

                        return assignedClass?.class;
                    })
                    .filter(
                        (className): className is string =>
                            typeof className === "string"
                    )
            )
        ].sort((a, b) => {
            const numberA = parseInt(a, 10);
            const numberB = parseInt(b, 10);

            return numberA - numberB;
        });

        // Get unique assigned subjects.
        const subjects = [
            ...new Set(
                assignments
                    .map((assignment) => {
                        const subject =
                            assignment.subjectId as any;

                        return subject?.name;
                    })
                    .filter(
                        (subjectName): subjectName is string =>
                            typeof subjectName === "string"
                    )
            )
        ].sort((a, b) => a.localeCompare(b));

        // Check whether this teacher is a class teacher.
        const classTeacher = await Class.exists({
            teacherId: teacher._id
        });

        return res.status(200).json({
            ...teacher.toObject(),

            assignments,
            classes,
            subjects,

            isClassTeacher: Boolean(classTeacher)
        });
    } catch (error) {
        next(error);
    }
};

export const updateTeacher = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const session = await mongoose.startSession();

    try {
        const { id } = req.params;
        const {
            name,
            uid,
            password,
            employeeID,
            assignments
        } = req.body;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid teacher ID."
            });
        }

        if (
            typeof name !== "string" ||
            !name.trim() ||
            typeof uid !== "string" ||
            !uid.trim() ||
            typeof employeeID !== "string" ||
            !employeeID.trim()
        ) {
            return res.status(400).json({
                message: "Teacher name, UID, and employee ID are required."
            });
        }

        await session.withTransaction(async () => {
            const teacher = await Teacher.findById(id).session(session);

            if (!teacher) {
                throw Object.assign(
                    new Error("Teacher not found."),
                    { status: 404 }
                );
            }

            // Resolve new assignments before changing existing data.
            const resolvedAssignments = await resolveTeacherAssignments(
                assignments,
                session,
                teacher._id
            );

            const userUpdate: {
                name: string;
                uid: string;
                password?: string;
            } = {
                name: name.trim(),
                uid: uid.trim()
            };

            if (
                typeof password === "string" &&
                password.trim()
            ) {
                userUpdate.password = await bcrypt.hash(password, 10);
            }

            const updatedUser = await User.findByIdAndUpdate(
                teacher.userId,
                userUpdate,
                {
                    new: true,
                    runValidators: true,
                    session
                }
            );

            if (!updatedUser) {
                throw Object.assign(
                    new Error("Teacher user account not found."),
                    { status: 404 }
                );
            }

            teacher.employeeID = employeeID.trim();
            await teacher.save({ session });

            // Replace this teacher's assignments.
            await TeacherAssignment.deleteMany({
                teacherId: teacher._id
            }).session(session);

            await TeacherAssignment.insertMany(
                resolvedAssignments.map((assignment) => ({
                    teacherId: teacher._id,
                    subjectId: assignment.subjectId,
                    classId: assignment.classId
                })),
                { session }
            );
        });

        return res.status(200).json({
            message: "Teacher and assignments updated successfully."
        });
    } catch (error: any) {
        if (error.status) {
            return res.status(error.status).json({
                message: error.message
            });
        }

        if (error.code === 11000) {
            return res.status(409).json({
                message:
                    "The UID, employee ID, or a subject-class assignment is already in use."
            });
        }

        return next(error);
    } finally {
        await session.endSession();
    }
};

export const getAllSubjects = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const subjects = await Subject.find({})
            .select("_id name subjectCode class")
            .sort({ name: 1, class: 1 })
            .lean();

        return res.status(200).json({ subjects });
    } catch (error) {
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
        const { arrangements } = req.body;
        const originalTeacherId = req.params.id;

        if (!mongoose.isValidObjectId(originalTeacherId)) {
            return res.status(400).json({
                message: "Invalid original teacher ID.",
            });
        }

        if (!Array.isArray(arrangements) || arrangements.length === 0) {
            return res.status(400).json({
                message: "Provide a replacement for every subject assignment.",
            });
        }

        const seenAssignments = new Set<string>();

        for (const item of arrangements) {
            if (
                !item ||
                typeof item.class !== "string" ||
                !mongoose.isValidObjectId(item.subjectId) ||
                !mongoose.isValidObjectId(item.arrangedTeacherId)
            ) {
                return res.status(400).json({
                    message: "Each arrangement needs a valid class, subject ID and replacement teacher ID.",
                });
            }

            if (item.arrangedTeacherId === originalTeacherId) {
                return res.status(400).json({
                    message: "A teacher cannot replace themselves.",
                });
            }

            const key = `${item.class}:${item.subjectId}`;

            if (seenAssignments.has(key)) {
                return res.status(400).json({
                    message: "Duplicate class and subject arrangements were provided.",
                });
            }

            seenAssignments.add(key);
        }

        let createdArrangements: any[] = [];

        await session.withTransaction(async () => {
            const teacher = await Teacher.findOne({
                _id: originalTeacherId,
                isDeleted: { $ne: true },
            }).session(session);

            if (!teacher) {
                throw Object.assign(
                    new Error("Teacher not found."),
                    { status: 404 }
                );
            }

            const user = await User.findById(teacher.userId).session(session);

            if (!user) {
                throw Object.assign(
                    new Error("Teacher user account not found."),
                    { status: 404 }
                );
            }

            if (user.isActive !== true) {
                throw Object.assign(
                    new Error("Teacher account is already deactivated."),
                    { status: 400 }
                );
            }

            const existingArrangements = await Arrangement.find({
                originalTeacherId: teacher._id,
            }).session(session);

            if (existingArrangements.length > 0) {
                throw Object.assign(
                    new Error("Temporary arrangements already exist for this teacher."),
                    { status: 409 }
                );
            }

            // The arrangements must cover every current subject assignment.
            const originalAssignments = await TeacherAssignment.find({
                teacherId: teacher._id,
            })
                .populate({
                    path: "subjectId",
                    select: "name",
                })
                .populate({
                    path: "classId",
                    select: "class",
                })
                .session(session);

            if (originalAssignments.length === 0) {
                throw Object.assign(
                    new Error("The teacher has no subject assignments to arrange."),
                    { status: 400 }
                );
            }

            const requestedKeys = new Set(
                arrangements.map(
                    (item: { class: string; subjectId: string }) =>
                        `${item.class}:${item.subjectId}`
                )
            );

            const actualKeys = new Set<string>();

            for (const assignment of originalAssignments) {
                const assignedClass = assignment.classId as any;
                const subject = assignment.subjectId as any;

                if (assignedClass?._id && subject?._id) {
                    actualKeys.add(
                        `${assignedClass.class}:${subject._id.toString()}`
                    );
                }
            }

            if (
                requestedKeys.size !== actualKeys.size ||
                [...actualKeys].some((key) => !requestedKeys.has(key))
            ) {
                throw Object.assign(
                    new Error(
                        "Provide exactly one replacement for every class and subject currently assigned to this teacher."
                    ),
                    { status: 400 }
                );
            }

            const created: any[] = [];
            const classTeacherFlags = new Map<string, boolean>();

            for (const item of arrangements) {
                const classDocument = await Class.findOne({
                    class: item.class,
                }).session(session);

                if (!classDocument) {
                    throw Object.assign(
                        new Error(`Class ${item.class} was not found.`),
                        { status: 404 }
                    );
                }

                const subject = await Subject.findById(
                    item.subjectId
                ).session(session);

                if (!subject) {
                    throw Object.assign(
                        new Error(`Subject ${item.subjectId} was not found.`),
                        { status: 404 }
                    );
                }

                // Ensure the original teacher really teaches this subject in this class.
                const originalAssignment = await TeacherAssignment.findOne({
                    teacherId: teacher._id,
                    classId: classDocument._id,
                    subjectId: subject._id,
                }).session(session);

                if (!originalAssignment) {
                    throw Object.assign(
                        new Error(
                            `${teacher.employeeID} is not assigned to ${subject.name} in Class ${item.class}.`
                        ),
                        { status: 400 }
                    );
                }

                const replacement = await Teacher.findOne({
                    _id: item.arrangedTeacherId,
                    isDeleted: { $ne: true },
                }).session(session);

                if (!replacement) {
                    throw Object.assign(
                        new Error("A replacement teacher was not found."),
                        { status: 404 }
                    );
                }

                const replacementUser = await User.findById(
                    replacement.userId
                ).session(session);

                if (!replacementUser || replacementUser.isActive !== true) {
                    throw Object.assign(
                        new Error("Every replacement teacher must have an active account."),
                        { status: 400 }
                    );
                }

                const replacementAssignments = await TeacherAssignment.find({
                    teacherId: replacement._id,
                })
                    .populate({
                        path: "subjectId",
                        select: "name",
                    })
                    .session(session);

                const teachesSameSubject = replacementAssignments.some(
                    (assignment: any) =>
                        assignment.subjectId?.name === subject.name
                );

                if (!teachesSameSubject) {
                    throw Object.assign(
                        new Error(
                            `${replacement.employeeID} is not assigned to ${subject.name} in any class.`
                        ),
                        { status: 400 }
                    );
                }

                // Prevent conflicting temporary arrangements.
                const existingReplacement = await Arrangement.findOne({
                    arrangedTeacherId: replacement._id,
                    class: item.class,
                    subjectId: subject._id,
                }).session(session);

                if (existingReplacement) {
                    throw Object.assign(
                        new Error(
                            `${replacement.employeeID} already has a temporary arrangement for ${subject.name} in Class ${item.class}.`
                        ),
                        { status: 409 }
                    );
                }

                const wasClassTeacher =
                    classDocument.teacherId?.toString() === teacher._id.toString();

                // Store the class-teacher flag only once per class.
                const flagKey = item.class;
                const recordClassTeacherFlag =
                    wasClassTeacher && !classTeacherFlags.has(flagKey);

                if (wasClassTeacher && !classTeacherFlags.has(flagKey)) {
                    classTeacherFlags.set(flagKey, true);
                }

                const arrangement = new Arrangement({
                    originalTeacherId: teacher._id,
                    arrangedTeacherId: replacement._id,
                    class: item.class,
                    subjectId: subject._id,
                    wasClassTeacher: recordClassTeacherFlag,
                });

                await arrangement.save({ session });
                created.push(arrangement.toObject());

                // Transfer class-teacher responsibility once per class.
                if (
                    wasClassTeacher &&
                    recordClassTeacherFlag
                ) {
                    classDocument.teacherId = replacement._id;
                    await classDocument.save({ session });
                }
            }

            user.isActive = false;
            await user.save({ session });

            createdArrangements = created;
        });

        return res.status(200).json({
            message: "Teacher account deactivated and temporary arrangements created successfully.",
            arrangements: createdArrangements,
        });
    } catch (error: any) {
        if (error.status) {
            return res.status(error.status).json({
                message: error.message,
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
                message: "Invalid teacher ID.",
            });
        }

        await session.withTransaction(async () => {
            const teacher = await Teacher.findOne({
                _id: req.params.id,
                isDeleted: { $ne: true },
            }).session(session);

            if (!teacher) {
                throw Object.assign(
                    new Error("Teacher not found."),
                    { status: 404 }
                );
            }

            const user = await User.findById(
                teacher.userId
            ).session(session);

            if (!user) {
                throw Object.assign(
                    new Error("Teacher user account not found."),
                    { status: 404 }
                );
            }

            if (user.isActive !== false) {
                throw Object.assign(
                    new Error("Teacher account is already active."),
                    { status: 400 }
                );
            }

            const arrangements = await Arrangement.find({
                originalTeacherId: teacher._id,
            }).session(session);

            // Restore class-teacher responsibility for classes this teacher
            // originally led. Do not overwrite a class teacher changed since.
            for (const arrangement of arrangements) {
                if (!arrangement.wasClassTeacher) {
                    continue;
                }

                const classDocument = await Class.findOne({
                    class: arrangement.class,
                    teacherId: arrangement.arrangedTeacherId,
                }).session(session);

                if (!classDocument) {
                    throw Object.assign(
                        new Error(
                            `The temporary class-teacher assignment for Class ${arrangement.class} has changed. The original teacher was not reactivated.`
                        ),
                        { status: 409 }
                    );
                }

                classDocument.teacherId = teacher._id;
                await classDocument.save({ session });
            }

            await Arrangement.deleteMany({
                originalTeacherId: teacher._id,
            }).session(session);

            user.isActive = true;
            await user.save({ session });
        });

        return res.status(200).json({
            message:
                "Teacher account activated, class-teacher responsibility restored when applicable, and temporary arrangements removed.",
        });
    } catch (error: any) {
        if (error.status) {
            return res.status(error.status).json({
                message: error.message,
            });
        }

        return next(error);
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

export const updateMark = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
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

        // Verify that the student belongs to the selected class.
        const student = await Student.findOne({
            _id: studentId,
            class: studentClass
        });

        if (!student) {
            return res.status(404).json({
                message: "Student not found in this class"
            });
        }

        // Find the subject in the selected class.
        const subject = await Subject.findOne({
            name: subjectName,
            class: studentClass
        });

        if (!subject) {
            return res.status(404).json({
                message: "Subject not found for this class"
            });
        }

        // Find the selected class document.
        const classDoc = await Class.findOne({
            class: studentClass
        }).select("_id");

        if (!classDoc) {
            return res.status(404).json({
                message: "Class not found"
            });
        }

        // Verify that the teacher is assigned to the selected class.
        const assignment = await TeacherAssignment.findOne({
            teacherId,
            classId: classDoc._id
        });

        if (!assignment) {
            return res.status(404).json({
                message: "Teacher is not assigned to this class"
            });
        }

        // Prevent duplicate marks, excluding the current record.
        const existingMark = await Mark.findOne({
            studentId: student._id,
            subjectId: subject._id,
            exam,
            _id: { $ne: id }
        });

        if (existingMark) {
            return res.status(400).json({
                message:
                    "Marks for this student, subject and exam already exist"
            });
        }

        // Update the mark.
        const mark = await Mark.findByIdAndUpdate(
            id,
            {
                studentId: student._id,
                teacherId: assignment.teacherId,
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

        return res.status(200).json({
            message: "Mark updated successfully",
            mark
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
};

export const createMark = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
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

        // Validate that the student belongs to the selected class.
        const student = await Student.findOne({
            _id: studentId,
            class: studentClass
        });

        if (!student) {
            return res.status(404).json({
                message: "Student not found in this class"
            });
        }

        // Find the selected subject in the selected class.
        const subject = await Subject.findOne({
            name: subjectName,
            class: studentClass
        });

        if (!subject) {
            return res.status(404).json({
                message: "Subject not found for this class"
            });
        }

        const classDoc = await Class.findOne({
            class: studentClass
        }).select("_id");

        if (!classDoc) {
            return res.status(404).json({
                message: "Class not found"
            });
        }

        // Verify that the teacher is assigned to the selected class.
        const teacherAssignment = await TeacherAssignment.findOne({
            teacherId,
            classId: classDoc._id
        });

        if (!teacherAssignment) {
            return res.status(404).json({
                message: "Teacher is not assigned to this class"
            });
        }

        // Prevent duplicate marks for the same student, subject and exam.
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

        // Create the mark.
        await Mark.create({
            studentId: student._id,
            teacherId: teacherAssignment.teacherId,
            subjectId: subject._id,
            exam,
            marksObtained,
            totalMarks
        });

        return res.status(201).json({
            message: "Mark created successfully"
        });
    } catch (error) {
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

        const currentPage = Math.max(Number(req.query.page) || 1, 1);
        const pageLimit = Math.max(Number(req.query.limit) || 10, 1);

        const selectedDate = normalizeTeacherAttendanceDate(date);

        if (!selectedDate) {
            return res.status(400).json({
                message: "A valid date in YYYY-MM-DD format is required"
            });
        }

        const [availableClasses, holiday] = await Promise.all([
            Class.distinct("class"),
            Holiday.findOne({
                date: selectedDate
            }).lean()
        ]);

        const classes = availableClasses.sort(
            (a, b) =>
                Number.parseInt(a, 10) - Number.parseInt(b, 10)
        );

        if (holiday) {
            return res.status(200).json({
                teachers: [],
                attendanceMarked: false,
                isHoliday: true,
                holidayName: holiday.name,
                totalTeachers: 0,
                totalPages: 1,
                currentPage: 1,
                limit: pageLimit,
                classes
            });
        }

        // Validate the class filter before querying Class.
        if (
            classFilter !== "All" &&
            !availableClasses.includes(classFilter as typeof availableClasses[number])
        ) {
            return res.status(400).json({
                message: "Invalid class selected"
            });
        }

        const classDoc =
            classFilter !== "All"
                ? await Class.findOne({
                    class: classFilter as typeof availableClasses[number]
                })
                    .select("_id")
                    .lean()
                : null;

        if (classFilter !== "All" && !classDoc) {
            return res.status(400).json({
                message: "Invalid class selected"
            });
        }

        // Find teachers assigned to the selected class.
        const assignmentMatch: Record<string, unknown> = {};

        if (classDoc) {
            assignmentMatch.classId = classDoc._id;
        }

        const assignedTeacherIds = await TeacherAssignment.distinct(
            "teacherId",
            assignmentMatch
        );

        const teacherFilter: Record<string, any> = {
            _id: { $in: assignedTeacherIds },
            isDeleted: { $ne: true }
        };

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
                {
                    userId: {
                        $in: matchingUsers.map(user => user._id)
                    }
                }
            ];
        }

        const totalTeachers = await Teacher.countDocuments(teacherFilter);
        const totalPages = Math.ceil(totalTeachers / pageLimit);

        const validPage =
            totalPages > 0
                ? Math.min(currentPage, totalPages)
                : 1;

        const teachers = await Teacher.find(teacherFilter)
            .select("_id userId employeeID")
            .populate({
                path: "userId",
                select: "name uid"
            })
            .sort({ employeeID: 1 })
            .skip((validPage - 1) * pageLimit)
            .limit(pageLimit)
            .lean();

        const teacherIds = teachers.map(teacher => teacher._id);

        // Fetch class assignments for teachers on the current page.
        const teacherAssignments = await TeacherAssignment.find({
            teacherId: { $in: teacherIds }
        })
            .select("teacherId classId")
            .populate({
                path: "classId",
                select: "class"
            })
            .lean();

        const classesByTeacher = new Map<string, Set<string>>();

        for (const assignment of teacherAssignments) {
            const teacherId = assignment.teacherId.toString();
            const classDocument = assignment.classId as any;

            if (!classDocument?.class) {
                continue;
            }

            if (!classesByTeacher.has(teacherId)) {
                classesByTeacher.set(teacherId, new Set<string>());
            }

            classesByTeacher.get(teacherId)!.add(classDocument.class);
        }

        const sortClasses = (values: string[]) =>
            values.sort(
                (a, b) =>
                    Number.parseInt(a, 10) -
                    Number.parseInt(b, 10)
            );

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
                classes: sortClasses([
                    ...(classesByTeacher.get(teacherId) ?? new Set<string>())
                ]),
                onLeave: teachersOnLeave.has(teacherId),
                attendanceStatus: attendanceMap.get(teacherId) ?? null
            };
        });

        // Check attendance across all eligible teachers, not just this page.
        const attendanceMarked =
            assignedTeacherIds.length > 0 &&
            Boolean(
                await TeacherAttendance.exists({
                    teacherId: { $in: assignedTeacherIds },
                    date: selectedDate
                })
            );

        return res.status(200).json({
            teachers: result,
            attendanceMarked,
            isHoliday: false,
            holidayName: null,
            totalTeachers,
            totalPages,
            currentPage: validPage,
            limit: pageLimit,
            classes
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

        const selectedDate = normalizeTeacherAttendanceDate(date);

        if (!selectedDate) {
            return res.status(400).json({
                message: "Invalid date"
            });
        }

        if (selectedDate.getUTCDay() === 0) {
            return res.status(400).json({
                message: "Teacher attendance cannot be marked on Sunday"
            });
        }

        const holiday = await Holiday.findOne({
            date: selectedDate
        }).lean();

        if (holiday) {
            return res.status(400).json({
                message: `Attendance cannot be marked because ${holiday.name} is a holiday`
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
                message: "Only the principal can mark teacher attendance"
            });
        }

        // 4. Validate the selected class against existing classes.
        const availableClasses = await Class.distinct("class");

        if (
            classFilter !== "All" &&
            !availableClasses.includes(
                classFilter as typeof availableClasses[number]
            )
        ) {
            return res.status(400).json({
                message: "Invalid class selected"
            });
        }

        // 5. Find the active teacher roster.
        let teacherIds: string[];

        if (classFilter === "All") {
            const activeTeachers = await Teacher.find({
                isDeleted: { $ne: true }
            })
                .select("_id")
                .lean();

            teacherIds = activeTeachers.map(
                teacher => teacher._id.toString()
            );
        } else {
            const classDocument = await Class.findOne({
                class: classFilter as typeof availableClasses[number]
            })
                .select("_id")
                .lean();

            if (!classDocument) {
                return res.status(400).json({
                    message: "Invalid class selected"
                });
            }

            const assignedTeacherIds =
                await TeacherAssignment.distinct("teacherId", {
                    classId: classDocument._id
                });

            const activeTeachers = await Teacher.find({
                _id: { $in: assignedTeacherIds },
                isDeleted: { $ne: true }
            })
                .select("_id")
                .lean();

            teacherIds = activeTeachers.map(
                teacher => teacher._id.toString()
            );
        }

        if (teacherIds.length === 0) {
            return res.status(400).json({
                message:
                    "No active teachers found for the selected class or roster"
            });
        }

        const teacherIdSet = new Set(teacherIds);

        // 6. Validate the submitted attendance array.
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
                !["Present", "Absent"].includes(record.status ?? "")
        );

        if (invalidRecord) {
            return res.status(400).json({
                message: "Invalid teacher ID or attendance status"
            });
        }

        const submittedIds: string[] = attendance.map(
            (record: { teacherId: string }) => record.teacherId
        );

        if (new Set(submittedIds).size !== submittedIds.length) {
            return res.status(400).json({
                message: "Duplicate teacher IDs were submitted"
            });
        }

        // Reject teachers outside the selected roster.
        const invalidTeacherIds = submittedIds.filter(
            id => !teacherIdSet.has(id)
        );

        if (invalidTeacherIds.length > 0) {
            return res.status(400).json({
                message:
                    "You can only mark attendance for active teachers in the selected roster"
            });
        }

        // 7. Find approved leave for teachers in this roster.
        const objectTeacherIds = teacherIds.map(
            id => new mongoose.Types.ObjectId(id)
        );

        const approvedLeaves = await Leave.find({
            teacherId: { $in: objectTeacherIds },
            status: "Approved",
            startDate: { $lte: selectedDate },
            endDate: { $gte: selectedDate }
        })
            .select("teacherId")
            .lean();

        const teachersOnLeave = new Set(
            approvedLeaves
                .filter(leave => leave.teacherId)
                .map(leave => leave.teacherId!.toString())
        );

        // Reject attendance submitted for teachers on approved leave.
        if (submittedIds.some(id => teachersOnLeave.has(id))) {
            return res.status(400).json({
                message:
                    "Attendance cannot be marked for a teacher on approved leave"
            });
        }

        // 8. Every eligible teacher must have an attendance record.
        const submittedTeacherIds = new Set(submittedIds);

        const missingTeachers = teacherIds.filter(
            id =>
                !teachersOnLeave.has(id) &&
                !submittedTeacherIds.has(id)
        );

        if (missingTeachers.length > 0) {
            return res.status(400).json({
                message: `Please mark attendance for all active teachers in ${
                    classFilter === "All"
                        ? "the school"
                        : `class ${classFilter}`
                } who are not on approved leave. ${
                    missingTeachers.length
                } teacher(s) still need attendance.`
            });
        }

        // 9. Exclude teachers on approved leave.
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

        // 10. Prevent duplicate attendance for the selected roster.
        const existingAttendance = await TeacherAttendance.findOne({
            teacherId: {
                $in: eligibleTeacherIds.map(
                    id => new mongoose.Types.ObjectId(id)
                )
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

        // 11. Create attendance records for eligible teachers.
        const attendanceRecords = attendance
            .filter(
                (record: {
                    teacherId: string;
                    status: "Present" | "Absent";
                }) => !teachersOnLeave.has(record.teacherId)
            )
            .map(
                (record: {
                    teacherId: string;
                    status: "Present" | "Absent";
                }) => ({
                    teacherId: new mongoose.Types.ObjectId(record.teacherId),
                    date: selectedDate,
                    status: record.status,
                    markedBy: principal._id
                })
            );

        await TeacherAttendance.insertMany(attendanceRecords);

        return res.status(201).json({
            message: "Teacher attendance marked successfully",
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

        const currentPage = Math.max(Number(req.query.page) || 1, 1);
        const pageLimit = Math.max(Number(req.query.limit) || 10, 1);

        const selectedDate = normalizeTeacherAttendanceDate(date);

        if (!selectedDate) {
            return res.status(400).json({
                message: "A valid date in YYYY-MM-DD format is required"
            });
        }

        // Fetch available classes for the dropdown.
        const availableClasses = await Class.distinct("class");

        const classes = availableClasses.sort(
            (a, b) =>
                Number.parseInt(a, 10) - Number.parseInt(b, 10)
        );

        // Validate the selected class before querying MongoDB.
        if (
            classFilter !== "All" &&
            !classes.includes(classFilter as (typeof classes)[number])
        ) {
            return res.status(400).json({
                message: "Invalid class selected"
            });
        }

        // Resolve the selected class through the Class collection.
        const classDoc =
            classFilter !== "All"
                ? await Class.findOne({
                    class: classFilter as (typeof classes)[number]
                })
                    .select("_id")
                    .lean()
                : null;

        if (classFilter !== "All" && !classDoc) {
            return res.status(400).json({
                message: "Invalid class selected"
            });
        }

        // Find teachers assigned to the selected class.
        const assignmentFilter: Record<string, unknown> = {};

        if (classDoc) {
            assignmentFilter.classId = classDoc._id;
        }

        const assignedTeacherIds = await TeacherAssignment.distinct(
            "teacherId",
            assignmentFilter
        );

        // Build the teacher filter.
        const teacherFilter: Record<string, any> = {
            _id: { $in: assignedTeacherIds },
            isDeleted: { $ne: true }
        };

        // Search by teacher name or employee ID.
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
                {
                    userId: {
                        $in: matchingUsers.map(user => user._id)
                    }
                }
            ];
        }

        const totalRecords = await Teacher.countDocuments(teacherFilter);
        const totalPages = Math.ceil(totalRecords / pageLimit);

        const validPage =
            totalPages > 0
                ? Math.min(currentPage, totalPages)
                : 1;

        const teachers = await Teacher.find(teacherFilter)
            .select("_id userId employeeID")
            .populate({
                path: "userId",
                select: "name uid"
            })
            .sort({ employeeID: 1 })
            .skip((validPage - 1) * pageLimit)
            .limit(pageLimit)
            .lean();

        const teacherIds = teachers.map(teacher => teacher._id);

        // Fetch attendance, approved leave, and assigned classes.
        const [
            attendanceRecords,
            approvedLeaves,
            assignments
        ] = await Promise.all([
            TeacherAttendance.find({
                teacherId: { $in: teacherIds },
                date: selectedDate
            })
                .select("_id teacherId status")
                .lean(),

            Leave.find({
                teacherId: { $in: teacherIds },
                status: "Approved",
                startDate: { $lte: selectedDate },
                endDate: { $gte: selectedDate }
            })
                .select("_id teacherId")
                .lean(),

            TeacherAssignment.find({
                teacherId: { $in: teacherIds }
            })
                .select("teacherId classId")
                .populate({
                    path: "classId",
                    select: "class"
                })
                .lean()
        ]);

        // Map attendance records by teacher ID.
        const attendanceMap = new Map(
            attendanceRecords.map(record => [
                record.teacherId.toString(),
                record
            ])
        );

        // Map approved leaves by teacher ID.
        const leaveMap = new Map(
            approvedLeaves
                .filter(leave => leave.teacherId)
                .map(leave => [
                    leave.teacherId!.toString(),
                    leave
                ])
        );

        // Group assigned classes by teacher.
        const classesByTeacher = new Map<string, Set<string>>();

        for (const assignment of assignments) {
            const teacherId = assignment.teacherId.toString();
            const assignedClass = assignment.classId as any;

            if (!assignedClass?.class) {
                continue;
            }

            if (!classesByTeacher.has(teacherId)) {
                classesByTeacher.set(teacherId, new Set<string>());
            }

            classesByTeacher.get(teacherId)!.add(assignedClass.class);
        }

        // Sort classes numerically.
        const sortClasses = (values: string[]) =>
            values.sort(
                (a, b) =>
                    Number.parseInt(a, 10) -
                    Number.parseInt(b, 10)
            );

        // Include teachers even if attendance has not been marked.
        const result = teachers.map(teacher => {
            const teacherId = teacher._id.toString();
            const user = teacher.userId as any;

            const leave = leaveMap.get(teacherId);
            const record = attendanceMap.get(teacherId);

            const status = leave
                ? "Leave"
                : record?.status ?? "Not Marked";

            return {
                _id:
                    record?._id?.toString() ??
                    `${leave?._id ?? "unmarked"}-${teacherId}-${date}`,

                teacherId: {
                    _id: teacherId,
                    name: user?.name ?? "",
                    employeeID: teacher.employeeID,
                    classes: sortClasses([
                        ...(classesByTeacher.get(teacherId) ??
                            new Set<string>())
                    ])
                },

                date: selectedDate,
                status
            };
        });

        // Counts represent the current filtered page.
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
            notMarkedCount,
            classes
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
        const { name, uid, employeeID } = req.body;

        // Validate teacher ID.
        if (!mongoose.isValidObjectId(id)) {
            res.status(400).json({
                message: "Invalid teacher ID"
            });
            return;
        }

        // Find teacher.
        const teacher = await Teacher.findById(id);

        if (!teacher || teacher.isDeleted) {
            res.status(404).json({
                message: "Teacher not found"
            });
            return;
        }

        // Find associated user.
        const user = await User.findById(teacher.userId);

        if (!user) {
            res.status(404).json({
                message: "Associated user not found"
            });
            return;
        }

        // Update user name.
        if (name !== undefined) {
            if (typeof name !== "string" || !name.trim()) {
                res.status(400).json({
                    message: "Name cannot be empty"
                });
                return;
            }

            user.name = name.trim();
        }

        // Update user UID.
        if (uid !== undefined) {
            if (typeof uid !== "string" || !uid.trim()) {
                res.status(400).json({
                    message: "UID cannot be empty"
                });
                return;
            }

            user.uid = uid.trim().toLowerCase();
        }

        // Update teacher employee ID.
        if (employeeID !== undefined) {
            if (
                typeof employeeID !== "string" ||
                !employeeID.trim()
            ) {
                res.status(400).json({
                    message: "Employee ID cannot be empty"
                });
                return;
            }

            teacher.employeeID = employeeID.trim();
        }

        // Save changes.
        await user.save();
        await teacher.save();

        res.status(200).json({
            message: "Teacher profile updated successfully",
            teacher: {
                _id: teacher._id,
                employeeID: teacher.employeeID,
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

        // Handle duplicate UID or employee ID.
        if (error.code === 11000) {
            res.status(409).json({
                message: error.keyPattern?.uid
                    ? "This UID is already in use."
                    : "This employee ID is already in use."
            });
            return;
        }

        // Handle schema validation errors.
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

        const [students, selectedClassDoc] = await Promise.all([
            Student.find({ class: selectedClass })
                .select("_id userId class rollNumber")
                .populate("userId", "name uid")
                .sort({ rollNumber: 1 })
                .lean(),

            Class.findOne({ class: selectedClass })
                .select("_id")
                .lean()
        ]);

        if (!selectedClassDoc) {
            res.status(200).json({
                students,
                teachers: []
            });
            return;
        }

        const assignments = await TeacherAssignment.find({
            classId: selectedClassDoc._id
        })
            .distinct("teacherId");

        const teachers = await Teacher.find({
            _id: { $in: assignments }
        })
            .select("_id userId employeeID department")
            .populate("userId", "name uid")
            .sort({ employeeID: 1 })
            .lean();

        res.status(200).json({
            students,
            teachers
        });
    } catch (error) {
        console.error("Error fetching mark form options:", error);

        res.status(500).json({
            message: "Failed to fetch students and teachers."
        });
    }
};

export const getTeachersForArrangement = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { subjectName } = req.query;

        if (
            typeof subjectName !== "string" ||
            !subjectName.trim()
        ) {
            return res.status(400).json({
                message: "A valid subject name is required.",
            });
        }

        // Find every Subject document with this name,
        // regardless of the class.
        const subjects = await Subject.find({
            name: subjectName.trim(),
        })
            .select("_id")
            .lean();

        const subjectIds = subjects.map((subject) => subject._id);

        if (subjectIds.length === 0) {
            return res.status(200).json({
                teachers: [],
            });
        }

        // Find teachers assigned to this subject in ANY class.
        const teacherIds = await TeacherAssignment.distinct(
            "teacherId",
            {
                subjectId: { $in: subjectIds },
            }
        );

        // Exclude deleted teachers and retrieve their user accounts.
        const teachers = await Teacher.find({
            _id: { $in: teacherIds },
            isDeleted: { $ne: true },
        })
            .populate({
                path: "userId",
                select: "name uid isActive",
            })
            .lean();

        // Only include teachers whose accounts are active.
        const eligibleTeachers = teachers.filter(
            (teacher: any) =>
                teacher.userId &&
                teacher.userId.isActive === true
        );

        return res.status(200).json({
            teachers: eligibleTeachers,
        });
    } catch (error) {
        return next(error);
    }
};

export const createArrangement = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const {
            originalTeacherId,
            arrangedTeacherId,
            class: className,
            subjectId,
            wasClassTeacher = false,
        } = req.body;

        if (
            !mongoose.isValidObjectId(originalTeacherId) ||
            !mongoose.isValidObjectId(arrangedTeacherId) ||
            !mongoose.isValidObjectId(subjectId)
        ) {
            res.status(400).json({
                message: "Valid original teacher, replacement teacher and subject IDs are required.",
            });
            return;
        }

        if (originalTeacherId === arrangedTeacherId) {
            res.status(400).json({
                message: "A teacher cannot replace themselves.",
            });
            return;
        }

        const validClasses = [
            "1st", "2nd", "3rd", "4th", "5th", "6th",
            "7th", "8th", "9th", "10th", "11th", "12th",
        ];

        if (!validClasses.includes(className)) {
            res.status(400).json({
                message: "A valid class is required.",
            });
            return;
        }

        const originalTeacher = await Teacher.findOne({
            _id: originalTeacherId,
            isDeleted: { $ne: true },
        });

        if (!originalTeacher) {
            res.status(404).json({
                message: "Original teacher not found.",
            });
            return;
        }

        const originalUser = await User.findById(
            originalTeacher.userId
        );

        if (!originalUser || originalUser.isActive !== false) {
            res.status(400).json({
                message: "The original teacher must be deactivated first.",
            });
            return;
        }

        const replacement = await Teacher.findOne({
            _id: arrangedTeacherId,
            isDeleted: { $ne: true },
        });

        if (!replacement) {
            res.status(404).json({
                message: "Replacement teacher not found.",
            });
            return;
        }

        const replacementUser = await User.findById(
            replacement.userId
        );

        if (!replacementUser || replacementUser.isActive !== true) {
            res.status(400).json({
                message: "The replacement teacher must have an active account.",
            });
            return;
        }

        const classDocument = await Class.findOne({
            class: className,
        });

        if (!classDocument) {
            res.status(404).json({
                message: "Class not found.",
            });
            return;
        }

        const [originalAssignment, replacementAssignment, subject] =
            await Promise.all([
                TeacherAssignment.findOne({
                    teacherId: originalTeacher._id,
                    classId: classDocument._id,
                    subjectId,
                }),
                TeacherAssignment.findOne({
                    teacherId: replacement._id,
                    classId: classDocument._id,
                    subjectId,
                }),
                Subject.findById(subjectId),
            ]);

        if (!subject || !originalAssignment) {
            res.status(400).json({
                message: "The original teacher is not assigned to this subject and class.",
            });
            return;
        }

        if (!replacementAssignment) {
            res.status(400).json({
                message: "The replacement teacher is not assigned to this subject and class.",
            });
            return;
        }

        const arrangement = await Arrangement.create({
            originalTeacherId: originalTeacher._id,
            arrangedTeacherId: replacement._id,
            class: className,
            subjectId: subject._id,
            wasClassTeacher: Boolean(wasClassTeacher),
        });

        res.status(201).json({
            message: "Temporary arrangement created successfully.",
            arrangement,
        });
    } catch (error: any) {
        if (error?.code === 11000) {
            res.status(409).json({
                message: "An arrangement already exists for this teacher, class and subject.",
            });
            return;
        }

        console.error("Error creating arrangement:", error);

        res.status(500).json({
            message: "Failed to create temporary arrangement.",
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