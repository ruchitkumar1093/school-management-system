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
import TeacherAttendance from "../models/TeacherAttendance";
import Class from "../models/Class";
import Arrangement from "../models/Arrangement";
import TeacherAssignment from "../models/TeacherAssignment";

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
            userId,
            isDeleted: { $ne: true }
        }).select("_id");

        if (!teacher) {
            return res.status(404).json({
                message: "Teacher not found"
            });
        }

        const status = req.query.status?.toString() || "All";
        const selectedClass = req.query.class?.toString().trim();

        const currentPage = Math.max(
            Number(req.query.page) || 1,
            1
        );

        const pageLimit = Math.max(
            Number(req.query.limit) || 5,
            1
        );

        if (
            !["All", "Pending", "Approved", "Rejected"].includes(status)
        ) {
            return res.status(400).json({
                message: "Invalid leave status"
            });
        }

        if (!selectedClass) {
            return res.status(400).json({
                message: "Please select a class"
            });
        }

        // Validate the selected class against existing classes.
        const availableClasses = await Class.distinct("class");

        if (
            !availableClasses.includes(
                selectedClass as (typeof availableClasses)[number]
            )
        ) {
            return res.status(400).json({
                message: "Invalid class selected"
            });
        }

        // Find regular classes assigned through TeacherAssignment.
        const assignments = await TeacherAssignment.find({
            teacherId: teacher._id
        })
            .populate({
                path: "classId",
                select: "class"
            })
            .lean();

        const regularClasses = assignments.flatMap(assignment => {
            const classDoc = assignment.classId as unknown as
                | { class: string }
                | null;

            return classDoc ? [classDoc.class] : [];
        });

        // Find classes where the teacher has a temporary arrangement.
        const arrangements = await Arrangement.find({
            arrangedTeacherId: teacher._id
        })
            .select("class")
            .lean();

        const temporaryClasses = arrangements.map(
            arrangement => arrangement.class
        );

        // Combine and deduplicate regular and temporary classes.
        const assignedClasses = new Set([
            ...regularClasses,
            ...temporaryClasses
        ]);

        // Verify that the teacher is allowed to view this class.
        if (!assignedClasses.has(selectedClass)) {
            return res.status(403).json({
                message: "You are not assigned to or arranged for this class"
            });
        }

        // Only the actual class teacher can approve or reject leave.
        const classTeacher = await Class.findOne({
            class: selectedClass as (typeof availableClasses)[number],
            teacherId: teacher._id
        })
            .select("_id")
            .lean();

        const isClassTeacher = Boolean(classTeacher);

        const students = await Student.find({
            class: selectedClass as (typeof availableClasses)[number],
            isDeleted: { $ne: true }
        })
            .select("_id")
            .lean();

        const studentIds = students.map(student => student._id);

        const filter: Record<string, any> = {
            studentId: { $in: studentIds }
        };

        if (status !== "All") {
            filter.status = status;
        }

        const totalLeaves = await Leave.countDocuments(filter);
        const totalPages = Math.ceil(totalLeaves / pageLimit);

        const validPage =
            totalPages > 0
                ? Math.min(currentPage, totalPages)
                : 1;

        const skip = (validPage - 1) * pageLimit;

        const leaves = await Leave.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(pageLimit)
            .populate({
                path: "studentId",
                select: "userId",
                populate: {
                    path: "userId",
                    select: "name uid"
                }
            })
            .lean();

        const formattedLeaves = leaves.flatMap(leave => {
            const student = leave.studentId as unknown as {
                _id: { toString(): string };
                userId: { name?: string; uid?: string } | null;
            } | null;

            // Safely ignore missing references.
            if (!student) {
                return [];
            }

            return [{
                _id: leave._id.toString(),
                student: {
                    _id: student._id.toString(),
                    name: student.userId?.name ?? "",
                    uid: student.userId?.uid ?? ""
                },
                startDate: leave.startDate,
                endDate: leave.endDate,
                reason: leave.reason,
                status: leave.status
            }];
        });

        return res.status(200).json({
            leaves: formattedLeaves,
            totalLeaves,
            totalPages,
            currentPage: validPage,
            limit: pageLimit,
            selectedClass,
            isClassTeacher
        });
    } catch (error) {
        console.error("Get teacher leave applications error:", error);

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
        const userId = req.user?.userId;
        const { id } = req.params;

        const teacher = await Teacher.findOne({
            userId,
            isDeleted: { $ne: true }
        }).select("_id");

        if (!teacher) {
            return res.status(404).json({
                message: "Teacher not found"
            });
        }

        const leave = await Leave.findById(id);

        if (!leave) {
            return res.status(404).json({
                message: "Leave application not found"
            });
        }

        if (leave.status !== "Pending") {
            return res.status(400).json({
                message: "Only pending leave applications can be approved"
            });
        }

        const student = await Student.findById(leave.studentId)
            .select("_id class isDeleted")
            .lean();

        if (!student || student.isDeleted === true) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        // Check whether the teacher is the permanent class teacher.
        const classDoc = await Class.findOne({
            class: student.class,
            teacherId: teacher._id
        })
            .select("_id")
            .lean();

        let isAuthorized = false;

        if (classDoc) {
            // Preserve the existing authorization for permanent class teachers.
            const assignment = await TeacherAssignment.exists({
                teacherId: teacher._id,
                classId: classDoc._id
            });

            if (assignment) {
                isAuthorized = true;
            }
        }

        // If not authorized through a regular assignment,
        // check whether the teacher is temporarily assigned to this class.
        if (!isAuthorized) {
            const arrangement = await Arrangement.exists({
                arrangedTeacherId: teacher._id,
                class: student.class
            });

            if (arrangement) {
                isAuthorized = true;
            }
        }

        if (!isAuthorized) {
            return res.status(403).json({
                message:
                    "Only the class teacher or a teacher temporarily assigned to this class can approve this leave"
            });
        }

        leave.status = "Approved";
        await leave.save();

        return res.status(200).json({
            message: "Leave application approved successfully",
            leave
        });
    } catch (error) {
        console.error("Approve leave error:", error);

        return res.status(500).json({
            message: "Failed to approve leave application"
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

        const teacher = await Teacher.findOne({
            userId,
            isDeleted: { $ne: true }
        }).select("_id");

        if (!teacher) {
            return res.status(404).json({
                message: "Teacher not found"
            });
        }

        const leave = await Leave.findById(id);

        if (!leave) {
            return res.status(404).json({
                message: "Leave application not found"
            });
        }

        if (leave.status !== "Pending") {
            return res.status(400).json({
                message:
                    "Only pending leave applications can be rejected"
            });
        }

        const student = await Student.findById(leave.studentId)
            .select("_id class isDeleted")
            .lean();

        if (!student || student.isDeleted === true) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        // Check whether the teacher is the permanent class teacher.
        const classDoc = await Class.findOne({
            class: student.class,
            teacherId: teacher._id
        })
            .select("_id")
            .lean();

        let isAuthorized = false;

        if (classDoc) {
            // Preserve the existing authorization for permanent class teachers.
            const assignment = await TeacherAssignment.exists({
                teacherId: teacher._id,
                classId: classDoc._id
            });

            if (assignment) {
                isAuthorized = true;
            }
        }

        // If not authorized through a regular assignment,
        // check whether the teacher is temporarily assigned to this class.
        if (!isAuthorized) {
            const arrangement = await Arrangement.exists({
                arrangedTeacherId: teacher._id,
                class: student.class
            });

            if (arrangement) {
                isAuthorized = true;
            }
        }

        if (!isAuthorized) {
            return res.status(403).json({
                message:
                    "Only the class teacher or a teacher temporarily assigned to this class can reject this leave"
            });
        }

        leave.status = "Rejected";
        await leave.save();

        return res.status(200).json({
            message: "Leave application rejected successfully",
            leave
        });
    } catch (error) {
        console.error("Reject leave error:", error);

        return res.status(500).json({
            message: "Failed to reject leave application"
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
            userId,
            isDeleted: false
        });

        if (!teacher) {
            return res.status(404).json({
                message: "Teacher profile not found"
            });
        }

        // Check whether this teacher is a class teacher.
        const classTeacher = await Class.exists({
            teacherId: teacher._id
        });

        // Get all teaching assignments from TeacherAssignment.
        const teacherAssignments = await TeacherAssignment.find({
            teacherId: teacher._id
        })
            .populate("subjectId", "name subjectCode")
            .populate("classId", "class")
            .lean();

        // Convert populated documents into frontend-friendly data.
        const assignments = teacherAssignments.flatMap((assignment) => {
            const subject = assignment.subjectId as unknown as {
                _id: mongoose.Types.ObjectId;
                name: string;
                subjectCode: string;
            } | null;

            const schoolClass = assignment.classId as unknown as {
                _id: mongoose.Types.ObjectId;
                class: string;
            } | null;

            // Ignore assignments with missing references.
            if (!subject || !schoolClass) {
                return [];
            }

            return [{
                _id: assignment._id,
                subjectId: subject._id,
                subject: subject.name,
                subjectCode: subject.subjectCode,
                classId: schoolClass._id,
                class: schoolClass.class
            }];
        });

        // Count unique subjects and classes across all assignments.
        const uniqueSubjects = [
            ...new Set(assignments.map(assignment => assignment.subject))
        ];

        const uniqueClasses = [
            ...new Set(assignments.map(assignment => assignment.class))
        ];

        // Count students in classes assigned to this teacher.
        // The assertion aligns the values with the Student schema's class enum.
        const students = uniqueClasses.length > 0
            ? await Student.countDocuments({
                class: {
                    $in: uniqueClasses as Array<
                        | "1st" | "2nd" | "3rd" | "4th"
                        | "5th" | "6th" | "7th" | "8th"
                        | "9th" | "10th" | "11th" | "12th"
                    >
                }
            })
            : 0;

        // Get temporary teaching arrangements for this teacher.
        const arrangements = await Arrangement.find({
            arrangedTeacherId: teacher._id
        })
            .populate("subjectId", "name")
            .select("class subjectId")
            .lean();

        const temporaryArrangement = arrangements.map((arrangement: any) => ({
            class: arrangement.class,
            subject: arrangement.subjectId?.name ?? "Unknown Subject"
        }));

        return res.status(200).json({
            employeeID: teacher.employeeID,
            assignments,
            subjects: uniqueSubjects.length,
            classes: uniqueClasses.length,
            students,
            isClassTeacher: Boolean(classTeacher),
            temporaryArrangement
        });
    } catch (error) {
        console.error("Get teacher home error:", error);

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
            userId: req.user?.userId,
            isDeleted: false
        });

        if (!teacher) {
            return res.status(404).json({
                message: "Teacher not found"
            });
        }

        // Fetch regular subject assignments.
        const assignments = await TeacherAssignment.find({
            teacherId: teacher._id
        })
            .populate({
                path: "subjectId",
                select: "name subjectCode"
            })
            .populate({
                path: "classId",
                select: "class"
            })
            .lean();

        // Fetch subjects temporarily assigned through arrangements.
        const arrangements = await Arrangement.find({
            arrangedTeacherId: teacher._id
        })
            .populate({
                path: "subjectId",
                select: "name subjectCode"
            })
            .lean();

        // Convert regular assignments into the frontend structure.
        const regularSubjects = assignments.flatMap(
            (assignment) => {
                const subject = assignment.subjectId as unknown as {
                    _id: { toString: () => string };
                    name: string;
                    subjectCode: string;
                } | null;

                const classDoc = assignment.classId as unknown as {
                    class: string;
                } | null;

                if (!subject || !classDoc) {
                    return [];
                }

                return [{
                    _id: subject._id.toString(),
                    name: subject.name,
                    subjectCode: subject.subjectCode,
                    class: classDoc.class
                }];
            }
        );

        // Convert temporary arrangements into the same structure.
        const temporarySubjects = arrangements.flatMap(
            (arrangement) => {
                const subject = arrangement.subjectId as unknown as {
                    _id: { toString: () => string };
                    name: string;
                    subjectCode: string;
                } | null;

                if (!subject) {
                    return [];
                }

                return [{
                    _id: subject._id.toString(),
                    name: subject.name,
                    subjectCode: subject.subjectCode,
                    class: arrangement.class
                }];
            }
        );

        // Combine regular and temporary subjects.
        const allSubjects = [
            ...regularSubjects,
            ...temporarySubjects
        ];

        // Remove duplicate subject/class combinations.
        const uniqueSubjects = Array.from(
            new Map(
                allSubjects.map((subject) => [
                    `${subject._id}-${subject.class}`,
                    subject
                ])
            ).values()
        );

        // Apply search.
        const filteredSubjects = uniqueSubjects.filter(
            (subject) =>
                search === "" ||
                subject.name.toLowerCase().includes(
                    search.toLowerCase()
                ) ||
                subject.subjectCode.toLowerCase().includes(
                    search.toLowerCase()
                )
        );

        // Sort by subject name.
        const sortOrder = order === "desc" ? -1 : 1;

        filteredSubjects.sort((a, b) =>
            a.name.localeCompare(b.name) * sortOrder
        );

        // Apply pagination after filtering and sorting.
        const totalSubjects = filteredSubjects.length;

        const totalPages = Math.ceil(
            totalSubjects / pageLimit
        );

        const skip = (currentPage - 1) * pageLimit;

        const subjects = filteredSubjects.slice(
            skip,
            skip + pageLimit
        );

        return res.status(200).json({
            subjects,
            totalSubjects,
            totalPages,
            currentPage,
            limit: pageLimit
        });
    } catch (error) {
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
            userId: req.user?.userId,
            isDeleted: false
        });

        if (!teacher) {
            return res.status(404).json({
                message: "Teacher not found"
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

        const selectedSubjectId =
            req.query.subject?.toString() || "All";

        const selectedClass =
            req.query.class?.toString() || "All";

        // 1. Get regular subject-class assignments.
        const assignments = await TeacherAssignment.find({
            teacherId: teacher._id
        })
            .populate({
                path: "subjectId",
                select: "name subjectCode"
            })
            .populate({
                path: "classId",
                select: "class"
            })
            .lean();

        // Normalize regular assignments into subject-class pairs.
        const regularPairs = assignments.flatMap(
            (assignment) => {
                const subject = assignment.subjectId as unknown as {
                    _id: {
                        toString: () => string;
                    };
                } | null;

                const classDoc = assignment.classId as unknown as {
                    class: string;
                } | null;

                if (!subject || !classDoc) {
                    return [];
                }

                return [{
                    subjectId: subject._id,
                    subjectIdString: subject._id.toString(),
                    class: classDoc.class
                }];
            }
        );

        // 2. Find temporary assignments for this teacher.
        const arrangements = await Arrangement.find({
            arrangedTeacherId: teacher._id
        })
            .populate({
                path: "subjectId",
                select: "name subjectCode"
            })
            .lean();

        // Normalize temporary arrangements into subject-class pairs.
        const temporaryPairs = arrangements.flatMap(
            (arrangement) => {
                const subject = arrangement.subjectId as unknown as {
                    _id: {
                        toString: () => string;
                    };
                } | null;

                if (!subject || !arrangement.class) {
                    return [];
                }

                return [{
                    subjectId: subject._id,
                    subjectIdString: subject._id.toString(),
                    class: arrangement.class
                }];
            }
        );

        // 3. Combine regular and temporary assignments.
        // Remove duplicates when the same subject-class pair
        // appears in both sources.
        const pairMap = new Map<
            string,
            {
                subjectId: any;
                subjectIdString: string;
                class: string;
            }
        >();

        [...regularPairs, ...temporaryPairs].forEach(
            (assignment) => {
                const key =
                    `${assignment.subjectIdString}-${assignment.class}`;

                pairMap.set(key, assignment);
            }
        );

        const allAllowedPairs = Array.from(pairMap.values());

        // 4. Validate the selected subject against all assignments.
        if (
            selectedSubjectId !== "All" &&
            !allAllowedPairs.some(
                (assignment) =>
                    assignment.subjectIdString === selectedSubjectId
            )
        ) {
            return res.status(400).json({
                message: "You are not assigned to this subject."
            });
        }

        // 5. Validate the selected class against all assignments.
        const availableClasses = [
            ...new Set(
                allAllowedPairs.map(
                    (assignment) => assignment.class
                )
            )
        ];

        if (
            selectedClass !== "All" &&
            !availableClasses.includes(selectedClass)
        ) {
            return res.status(400).json({
                message: "You are not assigned to this class."
            });
        }

        // 6. Apply the selected subject and class filters together.
        const allowedPairs = allAllowedPairs.filter(
            (assignment) => {
                const matchesSubject =
                    selectedSubjectId === "All" ||
                    assignment.subjectIdString === selectedSubjectId;

                const matchesClass =
                    selectedClass === "All" ||
                    assignment.class === selectedClass;

                return matchesSubject && matchesClass;
            }
        );

        // No matching assignments means there are no marks to show.
        if (allowedPairs.length === 0) {
            return res.status(200).json({
                marks: [],
                totalMarks: 0,
                totalPages: 0,
                currentPage,
                limit: pageLimit
            });
        }

        // 7. Find students belonging to the allowed classes.
        const assignedClasses = [
            ...new Set(
                allowedPairs.map(
                    (assignment) => assignment.class
                )
            )
        ];

        const students = await Student.find({
            class: {
                $in: assignedClasses as Array<
                    | "1st" | "2nd" | "3rd" | "4th"
                    | "5th" | "6th" | "7th" | "8th"
                    | "9th" | "10th" | "11th" | "12th"
                >
            }
        }).select("_id");

        const studentIds = students.map(
            (student) => student._id
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

        // 8. Get unique subject IDs from the allowed assignments.
        const subjectIds = [
            ...new Map(
                allowedPairs.map((assignment) => [
                    assignment.subjectIdString,
                    assignment.subjectId
                ])
            ).values()
        ];

        // 9. Build the marks aggregation pipeline.
        const pipeline: any[] = [
            {
                $match: {
                    studentId: {
                        $in: studentIds
                    },
                    subjectId: {
                        $in: subjectIds
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
            },
            {
                // Only allow the exact subject-class combinations
                // assigned regularly or temporarily to this teacher.
                $match: {
                    $or: allowedPairs.map((assignment) => ({
                        "studentId.class": assignment.class,
                        "subjectId._id": assignment.subjectId
                    }))
                }
            }
        ];

        // 10. Filter by exam type.
        if (exam !== "All") {
            pipeline.push({
                $match: {
                    exam
                }
            });
        }

        // 11. Search by student name.
        if (search) {
            pipeline.push({
                $match: {
                    "studentUser.name": {
                        $regex: search.replace(
                            /[.*+?^${}()|[\]\\]/g,
                            "\\$&"
                        ),
                        $options: "i"
                    }
                }
            });
        }

        // 12. Sort results.
        if (sortBy === "Student Name") {
            pipeline.push({
                $sort: {
                    "studentUser.name":
                        order === "desc" ? -1 : 1
                }
            });
        } else if (sortBy === "Subject Name") {
            pipeline.push({
                $sort: {
                    "subjectId.name":
                        order === "desc" ? -1 : 1
                }
            });
        } else if (sortBy === "Marks Obtained") {
            pipeline.push({
                $sort: {
                    marksObtained:
                        order === "desc" ? -1 : 1
                }
            });
        } else {
            pipeline.push({
                $sort: {
                    _id: 1
                }
            });
        }

        const skip = (currentPage - 1) * pageLimit;

        // 13. Paginate results and count all matching marks.
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

        const result = await Mark.aggregate(pipeline);

        const marks = result[0]?.marks || [];

        const totalMarks =
            result[0]?.total[0]?.count || 0;

        const totalPages = Math.ceil(
            totalMarks / pageLimit
        );

        // 14. Format the response for the frontend.
        const formattedMarks = marks.map(
            (mark: any) => ({
                _id: mark._id.toString(),
                studentId: {
                    _id: mark.studentId._id.toString(),
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
    } catch (error) {
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
            userId: req.user?.userId,
            isDeleted: false
        });

        if (!teacher) {
            return res.status(404).json({
                message: "Teacher not found."
            });
        }

        const search = req.query.search?.toString().trim() || "";
        const sortBy = req.query.sortBy?.toString() || "None";
        const order = req.query.order?.toString() || "asc";
        const showDeleted = req.query.showDeleted?.toString() === "true";
        const classFilter = req.query.classFilter?.toString() || "All";

        const currentPage = Math.max(Number(req.query.page) || 1, 1);
        const pageLimit = Math.max(Number(req.query.limit) || 5, 1);
        const skip = (currentPage - 1) * pageLimit;

        const validClasses = [
            "1st", "2nd", "3rd", "4th", "5th", "6th",
            "7th", "8th", "9th", "10th", "11th", "12th"
        ] as const;

        type ClassName = (typeof validClasses)[number];

        // 1. Find classes assigned through regular subject assignments.
        const assignments = await TeacherAssignment.find({
            teacherId: teacher._id
        })
            .select("classId")
            .lean();

        const classIds = [
            ...new Set(
                assignments.map(assignment =>
                    assignment.classId.toString()
                )
            )
        ];

        const regularClasses = classIds.length > 0
            ? await Class.find({
                _id: { $in: classIds }
            })
                .select("class")
                .lean()
            : [];

        // 2. Find classes where this teacher is the temporary replacement.
        const temporaryArrangements = await Arrangement.find({
            arrangedTeacherId: teacher._id
        })
            .select("class")
            .lean();

        // 3. Combine regular and temporary classes without duplicates.
        const assignedClasses = [
            ...new Set([
                ...regularClasses.map(item => item.class),
                ...temporaryArrangements.map(item => item.class)
            ])
        ].filter(
            (className): className is ClassName =>
                validClasses.some(validClass => validClass === className)
        );

        // 4. Determine whether the teacher is a class teacher.
        const isClassTeacher = Boolean(
            await Class.exists({
                teacherId: teacher._id
            })
        );

        // 5. Return empty data if the teacher has no assigned classes.
        if (assignedClasses.length === 0) {
            return res.status(200).json({
                students: [],
                totalStudents: 0,
                totalPages: 0,
                currentPage,
                limit: pageLimit,
                isClassTeacher,
                assignedClasses: []
            });
        }

        // 6. Validate the selected class.
        if (classFilter !== "All") {
            const isValidClass = validClasses.some(
                validClass => validClass === classFilter
            );

            if (!isValidClass) {
                return res.status(400).json({
                    message: "Invalid class selected."
                });
            }

            if (!assignedClasses.includes(classFilter as ClassName)) {
                return res.status(400).json({
                    message: "You are not assigned to this class."
                });
            }
        }

        // 7. Apply the selected class filter.
        const classesToFetch: ClassName[] =
            classFilter === "All"
                ? assignedClasses
                : [classFilter as ClassName];

        const match: Record<string, any> = {
            class: { $in: classesToFetch }
        };

        if (!showDeleted) {
            match.isDeleted = { $ne: true };
        }

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

        // 8. Search by student name.
        if (search) {
            pipeline.push({
                $match: {
                    "userId.name": {
                        $regex: search.replace(
                            /[.*+?^${}()|[\]\\]/g,
                            "\\$&"
                        ),
                        $options: "i"
                    }
                }
            });
        }

        // 9. Apply sorting.
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
        } else {
            pipeline.push({
                $sort: {
                    rollNumber: 1
                }
            });
        }

        // 10. Paginate the results and count matching students.
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

        const students = result[0]?.students ?? [];
        const totalStudents = result[0]?.total[0]?.count ?? 0;
        const totalPages = Math.ceil(totalStudents / pageLimit);

        return res.status(200).json({
            students,
            totalStudents,
            totalPages,
            currentPage,
            limit: pageLimit,
            isClassTeacher,
            assignedClasses
        });
    } catch (error) {
        next(error);
    }
};

export const deleteStudents = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const teacher = await Teacher.findOne({
            userId: req.user?.userId,
            isDeleted: { $ne: true }
        }).select("_id").lean();

        if (!teacher) {
            return res.status(404).json({
                message: "Teacher not found"
            });
        }

        const { ids } = req.body;

        if (
            !Array.isArray(ids) ||
            ids.length === 0 ||
            !ids.every(
                (id: unknown) =>
                    typeof id === "string" &&
                    mongoose.isValidObjectId(id)
            )
        ) {
            return res.status(400).json({
                message: "A non-empty array of valid student IDs is required"
            });
        }

        // 1. Find regular classes assigned through TeacherAssignment.
        const assignments = await TeacherAssignment.find({
            teacherId: teacher._id
        })
            .select("classId")
            .lean();

        const classIds = [
            ...new Set(
                assignments.map(
                    assignment => assignment.classId.toString()
                )
            )
        ];

        const regularClasses = classIds.length > 0
            ? await Class.find({
                _id: { $in: classIds }
            })
                .distinct("class")
            : [];

        // 2. Find classes where this teacher is a temporary replacement.
        const arrangements = await Arrangement.find({
            arrangedTeacherId: teacher._id
        })
            .distinct("class");

        // 3. Combine regular and temporary classes.
        const assignedClasses = [
            ...new Set([
                ...regularClasses,
                ...arrangements
            ])
        ];

        if (assignedClasses.length === 0) {
            return res.status(403).json({
                message: "You are not assigned to any class"
            });
        }

        // 4. Soft-delete only students belonging to the teacher's classes.
        const result = await Student.updateMany(
            {
                _id: { $in: ids },
                class: { $in: assignedClasses },
                isDeleted: { $ne: true }
            },
            {
                $set: {
                    isDeleted: true,
                    deletedAt: new Date()
                }
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                message: "No active students found in your assigned classes"
            });
        }

        return res.status(200).json({
            message: "Students soft-deleted successfully",
            deletedCount: result.modifiedCount
        });
    } catch (error) {
        next(error);
    }
};

export const restoreStudent = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const teacher = await Teacher.findOne({
            userId: req.user?.userId,
            isDeleted: { $ne: true }
        })
            .select("_id")
            .lean();

        if (!teacher) {
            return res.status(404).json({
                message: "Teacher not found"
            });
        }

        // 1. Get regular classes through TeacherAssignment.
        const assignments = await TeacherAssignment.find({
            teacherId: teacher._id
        })
            .select("classId")
            .lean();

        const classIds = [
            ...new Set(
                assignments.map(
                    assignment => assignment.classId.toString()
                )
            )
        ];

        const regularClasses = classIds.length > 0
            ? await Class.find({
                _id: { $in: classIds }
            }).distinct("class")
            : [];

        // 2. Get temporary classes through Arrangement.
        const temporaryClasses = await Arrangement.find({
            arrangedTeacherId: teacher._id
        }).distinct("class");

        // 3. Combine and deduplicate the teacher's classes.
        const assignedClasses = [
            ...new Set([
                ...regularClasses,
                ...temporaryClasses
            ])
        ];

        if (assignedClasses.length === 0) {
            return res.status(403).json({
                message: "You are not assigned to any class"
            });
        }

        // 4. Find the deleted student in an assigned class.
        const student = await Student.findOne({
            _id: req.params.id,
            class: { $in: assignedClasses },
            isDeleted: true
        });

        if (!student) {
            return res.status(404).json({
                message: "Deleted student not found in your assigned classes"
            });
        }

        // 5. Restore the student.
        student.isDeleted = false;
        student.deletedAt = null;

        await student.save();

        return res.status(200).json({
            message: "Student restored successfully"
        });
    } catch (error) {
        next(error);
    }
};

export const permanentlyDeleteStudent = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const teacher = await Teacher.findOne({
            userId: req.user?.userId,
            isDeleted: { $ne: true }
        })
            .select("_id")
            .lean();

        if (!teacher) {
            return res.status(404).json({
                message: "Teacher not found"
            });
        }

        // 1. Get regular classes through TeacherAssignment.
        const assignments = await TeacherAssignment.find({
            teacherId: teacher._id
        })
            .select("classId")
            .lean();

        const classIds = [
            ...new Set(
                assignments.map(
                    assignment => assignment.classId.toString()
                )
            )
        ];

        const regularClasses = classIds.length > 0
            ? await Class.find({
                _id: { $in: classIds }
            }).distinct("class")
            : [];

        // 2. Get temporary classes through Arrangement.
        const temporaryClasses = await Arrangement.find({
            arrangedTeacherId: teacher._id
        }).distinct("class");

        // 3. Combine and deduplicate assigned classes.
        const assignedClasses = [
            ...new Set([
                ...regularClasses,
                ...temporaryClasses
            ])
        ];

        if (assignedClasses.length === 0) {
            return res.status(403).json({
                message: "You are not assigned to any class"
            });
        }

        // 4. Find the deleted student in an assigned class.
        const student = await Student.findOne({
            _id: req.params.id,
            class: { $in: assignedClasses },
            isDeleted: true
        });

        if (!student) {
            return res.status(404).json({
                message: "Deleted student not found in your assigned classes"
            });
        }

        // 5. Permanently delete the associated user and student.
        await User.findByIdAndDelete(student.userId);
        await Student.findByIdAndDelete(student._id);

        return res.status(200).json({
            message: "Student permanently deleted"
        });
    } catch (error) {
        next(error);
    }
};

//Student CRUD
export const updateStudent = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id } = req.params;
        const { name, uid, rollNumber } = req.body;

        const teacher = await Teacher.findOne({
            userId: req.user?.userId,
            isDeleted: { $ne: true }
        })
            .select("_id")
            .lean();

        if (!teacher) {
            return res.status(404).json({
                message: "Teacher not found"
            });
        }

        // Find the active student.
        const student = await Student.findOne({
            _id: id,
            isDeleted: { $ne: true }
        });

        if (!student) {
            return res.status(404).json({
                message: "Active student not found"
            });
        }

        // Find the teacher's regular class assignments.
        const assignments = await TeacherAssignment.find({
            teacherId: teacher._id
        })
            .select("classId")
            .lean();

        const classIds = [
            ...new Set(
                assignments.map(assignment =>
                    assignment.classId.toString()
                )
            )
        ];

        const regularClasses = classIds.length > 0
            ? await Class.find({
                _id: { $in: classIds }
            }).distinct("class")
            : [];

        // Find temporary class assignments.
        const temporaryClasses = await Arrangement.find({
            arrangedTeacherId: teacher._id
        }).distinct("class");

        const assignedClasses = [
            ...new Set([
                ...regularClasses,
                ...temporaryClasses
            ])
        ];

        // Ensure the student belongs to one of the teacher's classes.
        if (!assignedClasses.includes(student.class)) {
            return res.status(403).json({
                message: "You are not authorized to update this student"
            });
        }

        // Update user details only when provided.
        const userUpdates: Record<string, string> = {};

        if (name !== undefined) {
            if (typeof name !== "string" || !name.trim()) {
                return res.status(400).json({
                    message: "Name cannot be empty"
                });
            }

            userUpdates.name = name.trim();
        }

        if (uid !== undefined) {
            if (typeof uid !== "string" || !uid.trim()) {
                return res.status(400).json({
                    message: "UID cannot be empty"
                });
            }

            userUpdates.uid = uid.trim().toLowerCase();
        }

        if (Object.keys(userUpdates).length > 0) {
            await User.findByIdAndUpdate(
                student.userId,
                { $set: userUpdates },
                { runValidators: true }
            );
        }

        // Update roll number only if provided.
        if (rollNumber !== undefined) {
            const parsedRollNumber = Number(rollNumber);

            if (
                !Number.isInteger(parsedRollNumber) ||
                parsedRollNumber < 1
            ) {
                return res.status(400).json({
                    message: "Roll number must be a positive integer"
                });
            }

            student.rollNumber = parsedRollNumber;
            await student.save();
        }

        return res.status(200).json({
            message: "Student updated successfully"
        });
    } catch (error) {
        next(error);
    }
};

const teacherValidClasses = [
    "1st", "2nd", "3rd", "4th", "5th", "6th",
    "7th", "8th", "9th", "10th", "11th", "12th"
] as const;

type TeacherClassName = typeof teacherValidClasses[number];

export const createStudent = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const {
            name,
            uid,
            password,
            rollNumber,
            class: selectedClass
        } = req.body;

        // Validate required fields.
        if (
            typeof name !== "string" ||
            !name.trim() ||
            typeof uid !== "string" ||
            !uid.trim() ||
            typeof password !== "string" ||
            !password ||
            typeof selectedClass !== "string" ||
            !selectedClass.trim()
        ) {
            await session.abortTransaction();

            return res.status(400).json({
                message: "Name, UID, password, and class are required"
            });
        }

        // Validate and narrow the class type.
        if (
            !teacherValidClasses.includes(
                selectedClass as TeacherClassName
            )
        ) {
            await session.abortTransaction();

            return res.status(400).json({
                message: "Invalid class selected"
            });
        }

        const validatedClass = selectedClass as TeacherClassName;

        // Validate roll number.
        const parsedRollNumber = Number(rollNumber);

        if (
            !Number.isInteger(parsedRollNumber) ||
            parsedRollNumber < 1
        ) {
            await session.abortTransaction();

            return res.status(400).json({
                message: "Roll number must be a positive integer"
            });
        }

        // Find the logged-in teacher.
        const teacher = await Teacher.findOne({
            userId: req.user?.userId,
            isDeleted: { $ne: true }
        })
            .select("_id")
            .session(session)
            .lean();

        if (!teacher) {
            await session.abortTransaction();

            return res.status(404).json({
                message: "Teacher not found"
            });
        }

        // Find the selected class.
        const classDocument = await Class.findOne({
            class: validatedClass
        })
            .select("_id")
            .session(session)
            .lean();

        if (!classDocument) {
            await session.abortTransaction();

            return res.status(400).json({
                message: "Invalid class selected"
            });
        }

        // Check whether the teacher has a regular assignment.
        const regularAssignment = await TeacherAssignment.exists({
            teacherId: teacher._id,
            classId: classDocument._id
        }).session(session);

        // Check whether the teacher has a temporary arrangement.
        const temporaryAssignment = await Arrangement.exists({
            arrangedTeacherId: teacher._id,
            class: validatedClass
        }).session(session);

        // Only teachers assigned or temporarily arranged to the
        // selected class can create students in that class.
        if (!regularAssignment && !temporaryAssignment) {
            await session.abortTransaction();

            return res.status(403).json({
                message: "You are not assigned to or arranged for this class"
            });
        }

        // Create the user.
        const [user] = await User.create(
            [
                {
                    name: name.trim(),
                    uid: uid.trim().toLowerCase(),
                    password,
                    role: "student"
                }
            ],
            { session }
        );

        // Create the student.
        await Student.create(
            [
                {
                    userId: user._id,
                    class: validatedClass,
                    rollNumber: parsedRollNumber
                }
            ],
            { session }
        );

        await session.commitTransaction();

        return res.status(201).json({
            message: "Student created successfully"
        });
    } catch (error) {
        await session.abortTransaction();
        return next(error);
    } finally {
        await session.endSession();
    }
};

export const deleteStudent = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const teacher = await Teacher.findOne({
            userId: req.user?.userId,
            isDeleted: { $ne: true }
        })
            .select("_id")
            .lean();

        if (!teacher) {
            return res.status(404).json({
                message: "Teacher not found"
            });
        }

        // Find regular classes assigned to the teacher.
        const assignments = await TeacherAssignment.find({
            teacherId: teacher._id
        })
            .select("classId")
            .lean();

        const classIds = [
            ...new Set(
                assignments.map(assignment =>
                    assignment.classId.toString()
                )
            )
        ];

        const regularClasses = classIds.length > 0
            ? await Class.find({
                _id: { $in: classIds }
            }).distinct("class")
            : [];

        // Find temporary class assignments.
        const temporaryClasses = await Arrangement.find({
            arrangedTeacherId: teacher._id
        }).distinct("class");

        const assignedClasses = [
            ...new Set([
                ...regularClasses,
                ...temporaryClasses
            ])
        ];

        if (assignedClasses.length === 0) {
            return res.status(403).json({
                message: "You are not assigned to any class"
            });
        }

        // Find the active student in an assigned class.
        const student = await Student.findOne({
            _id: req.params.id,
            class: { $in: assignedClasses },
            isDeleted: { $ne: true }
        });

        if (!student) {
            return res.status(404).json({
                message: "Active student not found in your assigned classes"
            });
        }

        student.isDeleted = true;
        student.deletedAt = new Date();

        await student.save();

        return res.status(200).json({
            message: "Student soft-deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};

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
export const updateMark = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
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
            userId: req.user?.userId,
            isDeleted: { $ne: true }
        });

        if (!teacher) {
            return res.status(404).json({
                message: "Teacher not found"
            });
        }

        const markToUpdate = await Mark.findById(id);

        if (!markToUpdate) {
            return res.status(404).json({
                message: "Mark not found"
            });
        }

        const student = await Student.findById(studentId);

        if (!student || student.isDeleted === true) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        // Find the subject belonging to the student's class.
        const subject = await Subject.findOne({
            name: subjectName,
            class: student.class
        });

        if (!subject) {
            return res.status(404).json({
                message: "Subject not found for this student's class"
            });
        }

        const classDocument = await Class.findOne({
            class: student.class
        }).select("_id");

        let isAuthorized = false;

        // Check the regular subject-class assignment.
        if (classDocument) {
            const assignment = await TeacherAssignment.exists({
                teacherId: teacher._id,
                subjectId: subject._id,
                classId: classDocument._id
            });

            if (assignment) {
                isAuthorized = true;
            }
        }

        // Check the temporary subject-class assignment if necessary.
        if (!isAuthorized) {
            const arrangement = await Arrangement.exists({
                arrangedTeacherId: teacher._id,
                subjectId: subject._id,
                class: student.class
            });

            if (arrangement) {
                isAuthorized = true;
            }
        }

        if (!isAuthorized) {
            return res.status(403).json({
                message:
                    "You are not assigned to teach this subject in this class"
            });
        }

        // Validate marks.
        const obtained = Number(marksObtained);
        const total = Number(totalMarks);

        if (
            !Number.isFinite(obtained) ||
            !Number.isFinite(total) ||
            obtained < 0 ||
            total <= 0 ||
            obtained > total
        ) {
            return res.status(400).json({
                message:
                    "Marks obtained must be between 0 and the maximum marks"
            });
        }

        // Prevent duplicates, excluding the mark being updated.
        const existingMark = await Mark.findOne({
            studentId: student._id,
            subjectId: subject._id,
            exam,
            _id: { $ne: markToUpdate._id }
        });

        if (existingMark) {
            return res.status(400).json({
                message:
                    "Marks for this student, subject and exam already exist"
            });
        }

        const mark = await Mark.findByIdAndUpdate(
            markToUpdate._id,
            {
                studentId: student._id,
                teacherId: teacher._id,
                subjectId: subject._id,
                exam,
                marksObtained: obtained,
                totalMarks: total
            },
            {
                new: true,
                runValidators: true
            }
        );

        return res.status(200).json({
            message: "Mark updated successfully",
            mark
        });
    } catch (error) {
        console.error("Error updating mark:", error);
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
            studentId,
            subjectName,
            exam,
            marksObtained,
            totalMarks
        } = req.body;

        const teacher = await Teacher.findOne({
            userId: req.user?.userId,
            isDeleted: { $ne: true }
        });

        if (!teacher) {
            return res.status(404).json({
                message: "Teacher not found"
            });
        }

        const student = await Student.findById(studentId);

        if (!student || student.isDeleted === true) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        // Find the subject belonging to the student's class.
        const subject = await Subject.findOne({
            name: subjectName,
            class: student.class
        });

        if (!subject) {
            return res.status(404).json({
                message: "Subject not found for this student's class"
            });
        }

        // Check for a regular subject-class assignment.
        const classDocument = await Class.findOne({
            class: student.class
        }).select("_id");

        let isAuthorized = false;

        if (classDocument) {
            const assignment = await TeacherAssignment.exists({
                teacherId: teacher._id,
                subjectId: subject._id,
                classId: classDocument._id
            });

            if (assignment) {
                isAuthorized = true;
            }
        }

        // If no regular assignment exists, check the temporary arrangement.
        if (!isAuthorized) {
            const arrangement = await Arrangement.exists({
                arrangedTeacherId: teacher._id,
                subjectId: subject._id,
                class: student.class
            });

            if (arrangement) {
                isAuthorized = true;
            }
        }

        if (!isAuthorized) {
            return res.status(403).json({
                message:
                    "You are not assigned to teach this subject in this class"
            });
        }

        // Validate marks.
        const obtained = Number(marksObtained);
        const total = Number(totalMarks);

        if (
            !Number.isFinite(obtained) ||
            !Number.isFinite(total) ||
            obtained < 0 ||
            total <= 0 ||
            obtained > total
        ) {
            return res.status(400).json({
                message:
                    "Marks obtained must be between 0 and the maximum marks"
            });
        }

        // Prevent duplicate marks for the same student, subject, and exam.
        const existingMark = await Mark.findOne({
            studentId: student._id,
            subjectId: subject._id,
            exam
        });

        if (existingMark) {
            return res.status(400).json({
                message:
                    "Marks for this student, subject and exam already exist"
            });
        }

        await Mark.create({
            studentId: student._id,
            teacherId: teacher._id,
            subjectId: subject._id,
            exam,
            marksObtained: obtained,
            totalMarks: total
        });

        return res.status(201).json({
            message: "Mark created successfully"
        });
    } catch (error) {
        console.error("Error creating mark:", error);
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

type SubjectMarks = {
    obtained: number;
    total: number;
};

type ClassName =
    | "1st" | "2nd" | "3rd" | "4th"
    | "5th" | "6th" | "7th" | "8th"
    | "9th" | "10th" | "11th" | "12th";

export const getExamResults = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const teacher = await Teacher.findOne({
            userId: req.user?.userId,
            isDeleted: false
        });

        if (!teacher) {
            return res.status(404).json({
                message: "Teacher not found"
            });
        }

        const examValue = req.query.exam?.toString() || "";

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

        const selectedClass =
            req.query.class?.toString() || "All";

        // 1. Find classes assigned through regular subject assignments.
        const assignments = await TeacherAssignment.find({
            teacherId: teacher._id
        })
            .populate({
                path: "classId",
                select: "class"
            })
            .lean();

        const regularClasses = assignments.flatMap(
            (assignment) => {
                const classDoc =
                    assignment.classId as unknown as {
                        class: string;
                    } | null;

                return classDoc ? [classDoc.class] : [];
            }
        );

        // 2. Find classes where this teacher is temporarily assigned.
        const arrangements = await Arrangement.find({
            arrangedTeacherId: teacher._id
        })
            .select("class")
            .lean();

        const temporaryClasses = arrangements.map(
            (arrangement) => arrangement.class
        );

        // 3. Combine regular and temporary classes without duplicates.
        const assignedClasses = [
            ...new Set([
                ...regularClasses,
                ...temporaryClasses
            ])
        ];

        // 4. Validate the selected class.
        if (
            selectedClass !== "All" &&
            !assignedClasses.includes(selectedClass)
        ) {
            return res.status(400).json({
                message: "You are not assigned to this class."
            });
        }

        // 5. Determine which classes to include in the results.
        const allowedClasses: ClassName[] =
            selectedClass === "All"
                ? assignedClasses as ClassName[]
                : [selectedClass as ClassName];

        // 6. Fetch students from the allowed classes.
        const students = await Student.find({
            class: {
                $in: allowedClasses
            }
        })
            .populate({
                path: "userId",
                select: "name uid"
            })
            .lean();

        if (students.length === 0) {
            return res.status(200).json({
                subjects: [],
                results: [],
                totalResults: 0,
                totalPages: 0,
                currentPage,
                limit: pageLimit
            });
        }

        const studentIds = students.map(
            (student) => student._id
        );

        // 7. Fetch all subjects belonging to the allowed classes.
        // Preserve the existing behavior of showing all class subjects.
        const classSubjects = await Subject.find({
            class: {
                $in: allowedClasses
            }
        })
            .select("name subjectCode class")
            .sort({
                name: 1
            })
            .lean();

        // 8. Group required subjects by class.
        const subjectsByClass = new Map<
            string,
            string[]
        >();

        classSubjects.forEach((subject) => {
            const existingSubjects =
                subjectsByClass.get(subject.class) ?? [];

            if (!existingSubjects.includes(subject.name)) {
                existingSubjects.push(subject.name);
            }

            subjectsByClass.set(
                subject.class,
                existingSubjects
            );
        });

        // 9. Build the complete subject list for the frontend.
        // Deduplicate subject names across classes.
        const uniqueSubjects = new Map<
            string,
            {
                name: string;
                subjectCode: string;
            }
        >();

        classSubjects.forEach((subject) => {
            if (!uniqueSubjects.has(subject.name)) {
                uniqueSubjects.set(subject.name, {
                    name: subject.name,
                    subjectCode: subject.subjectCode
                });
            }
        });

        const subjects = Array.from(
            uniqueSubjects.values()
        ).sort((a, b) =>
            a.name.localeCompare(b.name)
        );

        // 10. Fetch marks for all students in the selected exam.
        const marks = await Mark.find({
            studentId: {
                $in: studentIds
            },
            exam
        })
            .populate({
                path: "subjectId",
                select: "name subjectCode class"
            })
            .lean();

        // 11. Group marks by student ID.
        const marksByStudent = new Map<
            string,
            typeof marks
        >();

        marks.forEach((mark) => {
            const studentId = mark.studentId.toString();

            const studentMarks =
                marksByStudent.get(studentId) ?? [];

            studentMarks.push(mark);

            marksByStudent.set(
                studentId,
                studentMarks
            );
        });

        // 12. Calculate results using every subject in each student's class.
        const results = students.map((student) => {
            const studentMarks =
                marksByStudent.get(
                    student._id.toString()
                ) ?? [];

            const requiredSubjects =
                subjectsByClass.get(student.class) ?? [];

            const subjectMarks: Record<
                string,
                SubjectMarks | null
            > = {};

            // Initialize every required subject as unassessed.
            requiredSubjects.forEach((subjectName) => {
                subjectMarks[subjectName] = null;
            });

            // Add marks belonging to the student's own class.
            studentMarks.forEach((mark) => {
                if (!mark.subjectId) {
                    return;
                }

                const subject =
                    mark.subjectId as unknown as {
                        name: string;
                        class: string;
                    };

                if (subject.class !== student.class) {
                    return;
                }

                if (
                    !requiredSubjects.includes(subject.name)
                ) {
                    return;
                }

                subjectMarks[subject.name] = {
                    obtained: mark.marksObtained,
                    total: mark.totalMarks
                };
            });

            let obtainedMarks = 0;
            let totalMarks = 0;

            let hasMissingMarks = false;
            let hasFailedSubject = false;
            let hasAnyMarks = false;

            // Calculate the overall result.
            requiredSubjects.forEach((subjectName) => {
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

                result =
                    hasFailedSubject || totalMarks <= 0
                        ? "Fail"
                        : "Pass";
            }

            const user = student.userId as unknown as {
                name?: string;
                uid?: string;
            } | null;

            return {
                studentName:
                    user?.name ?? "Student Deleted",

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

        // 13. Search by student name or UID.
        let filteredResults = results;

        if (search !== "") {
            const searchValue = search.toLowerCase();

            filteredResults = filteredResults.filter(
                (student) =>
                    student.studentName
                        .toLowerCase()
                        .includes(searchValue) ||
                    student.uid
                        .toLowerCase()
                        .includes(searchValue)
            );
        }

        // 14. Sort the results.
        if (sortBy === "Student Name") {
            filteredResults.sort((a, b) =>
                a.studentName.localeCompare(b.studentName)
            );
        } else if (sortBy === "UID") {
            filteredResults.sort((a, b) =>
                a.uid.localeCompare(b.uid)
            );
        } else if (sortBy === "Total Marks") {
            filteredResults.sort(
                (a, b) =>
                    (a.total?.obtained ?? 0) -
                    (b.total?.obtained ?? 0)
            );
        } else if (sortBy === "Percentage") {
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

        // 15. Paginate after filtering and sorting.
        const totalResults = filteredResults.length;

        const totalPages = Math.ceil(
            totalResults / pageLimit
        );

        const skip = (currentPage - 1) * pageLimit;

        const paginatedResults = filteredResults.slice(
            skip,
            skip + pageLimit
        );

        return res.status(200).json({
            subjects,
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

//Attendance:
export const getStudentsForAttendance = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const date = req.query.date?.toString() || "";
        const search = req.query.search?.toString().trim() || "";
        const selectedClass = req.query.class?.toString() || "";

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

        if (!selectedClass) {
            return res.status(400).json({
                message: "Class is required"
            });
        }

        const selectedDate = new Date(date);

        if (isNaN(selectedDate.getTime())) {
            return res.status(400).json({
                message: "Invalid date"
            });
        }

        // Validate the selected class.
        const validClasses = [
            "1st", "2nd", "3rd", "4th",
            "5th", "6th", "7th", "8th",
            "9th", "10th", "11th", "12th"
        ] as const;

        if (
            !validClasses.includes(
                selectedClass as (typeof validClasses)[number]
            )
        ) {
            return res.status(400).json({
                message: "Invalid class selected"
            });
        }

        const className =
            selectedClass as (typeof validClasses)[number];

        const teacher = await Teacher.findOne({
            userId: req.user?.userId,
            isDeleted: false
        });

        if (!teacher) {
            return res.status(404).json({
                message: "Teacher not found"
            });
        }

        // 1. Find regular class assignments.
        const assignments = await TeacherAssignment.find({
            teacherId: teacher._id
        })
            .populate({
                path: "classId",
                select: "class"
            })
            .lean();

        const regularClasses = assignments
            .map((assignment) => {
                const classDoc = assignment.classId as unknown as
                    | { class: string }
                    | null;

                return classDoc?.class;
            })
            .filter(
                (name): name is string =>
                    typeof name === "string"
            );

        // 2. Find temporary class arrangements.
        const arrangements = await Arrangement.find({
            arrangedTeacherId: teacher._id
        })
            .select("class")
            .lean();

        const temporaryClasses = arrangements.map(
            (arrangement) => arrangement.class
        );

        // 3. Combine and deduplicate assigned classes.
        const assignedClasses = [
            ...new Set([
                ...regularClasses,
                ...temporaryClasses
            ])
        ];

        // 4. Verify that the teacher is assigned to this class
        // or is temporarily arranged for it.
        if (!assignedClasses.includes(className)) {
            return res.status(403).json({
                message:
                    "You are not assigned to or arranged for this class"
            });
        }

        // 5. Check whether the teacher is the actual class teacher.
        const classTeacherRecord = await Class.findOne({
            class: className,
            teacherId: teacher._id
        })
            .select("_id")
            .lean();

        const isClassTeacher = Boolean(classTeacherRecord);

        // 6. Build the student filter.
        const studentFilter: Record<string, any> = {
            class: className,
            isDeleted: { $ne: true }
        };

        // 7. Apply search by student name or UID.
        if (search) {
            const escapedSearch = search.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );

            const matchingUsers = await User.find({
                $or: [
                    {
                        name: {
                            $regex: escapedSearch,
                            $options: "i"
                        }
                    },
                    {
                        uid: {
                            $regex: escapedSearch,
                            $options: "i"
                        }
                    }
                ]
            }).select("_id");

            studentFilter.userId = {
                $in: matchingUsers.map((user) => user._id)
            };
        }

        // 8. Count students and calculate pagination.
        const totalStudents =
            await Student.countDocuments(studentFilter);

        const totalPages = Math.ceil(
            totalStudents / pageLimit
        );

        const validPage =
            totalPages > 0
                ? Math.min(currentPage, totalPages)
                : 1;

        const skip = (validPage - 1) * pageLimit;

        // 9. Fetch paginated students.
        const students = await Student.find(studentFilter)
            .select("_id userId rollNumber")
            .populate({
                path: "userId",
                select: "name uid"
            })
            .sort({ rollNumber: 1 })
            .skip(skip)
            .limit(pageLimit)
            .lean();

        const studentIds = students.map(
            (student) => student._id
        );

        // 10. Check whether attendance has been marked
        // for any active student in this class on this date.
        const allClassStudentIds = await Student.find({
            class: className,
            isDeleted: { $ne: true }
        }).distinct("_id");

        const attendanceMarked = await Attendance.exists({
            studentId: { $in: allClassStudentIds },
            date: selectedDate
        });

        // 11. Find approved leaves for the displayed students.
        const approvedLeaves = await Leave.find({
            status: "Approved",
            startDate: { $lte: selectedDate },
            endDate: { $gte: selectedDate },
            studentId: { $in: studentIds }
        }).select("studentId");

        const studentsOnLeave = new Set(
            approvedLeaves
                .filter((leave) => leave.studentId)
                .map((leave) => leave.studentId!.toString())
        );

        // 12. Fetch existing attendance records.
        const existingAttendance = await Attendance.find({
            date: selectedDate,
            studentId: { $in: studentIds }
        }).select("studentId status");

        const attendanceMap = new Map(
            existingAttendance.map((record) => [
                record.studentId.toString(),
                record.status
            ])
        );

        // 13. Prepare the response data.
        const paginatedStudents = students.map((student) => ({
            _id: student._id,
            userId: student.userId,
            onLeave: studentsOnLeave.has(
                student._id.toString()
            ),
            attendanceStatus:
                attendanceMap.get(student._id.toString()) ?? null
        }));

        return res.status(200).json({
            class: className,
            isClassTeacher,
            students: paginatedStudents,
            attendanceMarked: Boolean(attendanceMarked),
            totalStudents,
            totalPages,
            currentPage: validPage,
            limit: pageLimit
        });
    } catch (error) {
        console.error(
            "Error fetching students for attendance:",
            error
        );

        return next(error);
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
            class: selectedClass,
            attendance = [],
            markAll = null
        } = req.body;

        // Allowed class values from the Student schema.
        const validClasses = [
            "1st", "2nd", "3rd", "4th", "5th", "6th",
            "7th", "8th", "9th", "10th", "11th", "12th"
        ] as const;

        type ClassName = (typeof validClasses)[number];

        // Validate date.
        if (!date) {
            return res.status(400).json({
                message: "Date is required"
            });
        }

        // Validate class and narrow its type.
        if (
            typeof selectedClass !== "string" ||
            !validClasses.includes(selectedClass as ClassName)
        ) {
            return res.status(400).json({
                message: "A valid class is required"
            });
        }

        const className = selectedClass as ClassName;

        // Validate attendance payload.
        if (!Array.isArray(attendance)) {
            return res.status(400).json({
                message: "Attendance must be an array"
            });
        }

        const selectedDate = new Date(date);

        if (isNaN(selectedDate.getTime())) {
            return res.status(400).json({
                message: "Invalid date"
            });
        }

        // Prevent attendance on Sundays.
        if (selectedDate.getDay() === 0) {
            return res.status(400).json({
                message: "Attendance cannot be marked on Sunday"
            });
        }

        // Prevent attendance on holidays.
        const holiday = await Holiday.findOne({
            date: selectedDate
        });

        if (holiday) {
            return res.status(400).json({
                message:
                    `Attendance cannot be marked because ${holiday.name} is a holiday`
            });
        }

        // Find the logged-in teacher.
        const teacher = await Teacher.findOne({
            userId: req.user?.userId,
            isDeleted: false
        });

        if (!teacher) {
            return res.status(404).json({
                message: "Teacher not found"
            });
        }

        // Only the actual class teacher may mark attendance.
        const classTeacherRecord = await Class.findOne({
            class: className,
            teacherId: teacher._id
        }).select("_id");

        if (!classTeacherRecord) {
            return res.status(403).json({
                message:
                    "Only the class teacher can mark attendance for this class"
            });
        }

        // Validate markAll.
        if (
            markAll !== null &&
            markAll !== "Present" &&
            markAll !== "Absent"
        ) {
            return res.status(400).json({
                message: "Invalid markAll value"
            });
        }

        // Fetch active students in this class.
        const students = await Student.find({
            class: className,
            isDeleted: { $ne: true }
        }).select("_id");

        const studentIds = students.map(student =>
            student._id.toString()
        );

        const studentIdSet = new Set(studentIds);

        // Validate submitted student IDs.
        const invalidStudent = attendance.some(
            (record: {
                studentId?: string;
                status?: string;
            }) =>
                !record.studentId ||
                !studentIdSet.has(record.studentId)
        );

        if (invalidStudent) {
            return res.status(403).json({
                message:
                    "You can only mark attendance for students in the selected class"
            });
        }

        // Validate attendance statuses.
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

        // Reject duplicate student IDs.
        const submittedIds = attendance.map(
            (record: { studentId: string }) =>
                record.studentId
        );

        if (
            new Set(submittedIds).size !== submittedIds.length
        ) {
            return res.status(400).json({
                message:
                    "Duplicate student attendance entries are not allowed"
            });
        }

        // Prevent marking attendance more than once for this class and date.
        const existingAttendance = await Attendance.findOne({
            studentId: { $in: studentIds },
            date: selectedDate
        });

        if (existingAttendance) {
            return res.status(400).json({
                message:
                    "Attendance has already been marked for this date"
            });
        }

        // Find students with approved leave.
        const approvedLeaves = await Leave.find({
            status: "Approved",
            startDate: { $lte: selectedDate },
            endDate: { $gte: selectedDate },
            studentId: { $in: studentIds }
        }).select("studentId");

        const leaveStudentIds = new Set(
            approvedLeaves
                .filter(leave => leave.studentId)
                .map(leave => leave.studentId!.toString())
        );

        // Store individually selected attendance statuses.
        const individualAttendance = new Map<
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

        const attendanceRecords: {
            studentId: typeof students[number]["_id"];
            teacherId: typeof teacher._id;
            date: Date;
            status: "Present" | "Absent";
        }[] = [];

        const missingStudentIds: string[] = [];

        // Build attendance records for all active students.
        for (const student of students) {
            const studentId = student._id.toString();

            // Do not mark students who are on approved leave.
            if (leaveStudentIds.has(studentId)) {
                continue;
            }

            const individualStatus =
                individualAttendance.get(studentId);

            const finalStatus = individualStatus ?? markAll;

            if (
                finalStatus !== "Present" &&
                finalStatus !== "Absent"
            ) {
                missingStudentIds.push(studentId);
                continue;
            }

            attendanceRecords.push({
                studentId: student._id,
                teacherId: teacher._id,
                date: selectedDate,
                status: finalStatus
            });
        }

        if (missingStudentIds.length > 0) {
            return res.status(400).json({
                message:
                    "Please mark attendance for all students before submitting."
            });
        }

        if (attendanceRecords.length === 0) {
            return res.status(400).json({
                message: "No attendance records to submit."
            });
        }

        // Save attendance records.
        await Attendance.insertMany(attendanceRecords);

        return res.status(201).json({
            message: "Attendance marked successfully"
        });
    } catch (error) {
        console.log(error);
        return next(error);
    }
};

export const getAttendance = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const date = req.query.date?.toString() || "";
        const search = req.query.search?.toString().trim() || "";
        const selectedClass = req.query.class?.toString() || "";

        const currentPage = Math.max(
            Number(req.query.page) || 1,
            1
        );

        const pageLimit = Math.max(
            Number(req.query.limit) || 10,
            1
        );

        const validClasses = [
            "1st", "2nd", "3rd", "4th", "5th", "6th",
            "7th", "8th", "9th", "10th", "11th", "12th"
        ] as const;

        type ClassName = (typeof validClasses)[number];

        if (!date) {
            return res.status(400).json({
                message: "Date is required"
            });
        }

        if (
            !selectedClass ||
            !validClasses.includes(selectedClass as ClassName)
        ) {
            return res.status(400).json({
                message: "A valid class is required"
            });
        }

        const className = selectedClass as ClassName;

        const selectedDate = new Date(date);

        if (isNaN(selectedDate.getTime())) {
            return res.status(400).json({
                message: "Invalid date"
            });
        }

        // Find the logged-in teacher.
        const teacher = await Teacher.findOne({
            userId: req.user?.userId,
            isDeleted: false
        }).lean();

        if (!teacher) {
            return res.status(404).json({
                message: "Teacher not found"
            });
        }

        // Find regular class assignments.
        const assignments = await TeacherAssignment.find({
            teacherId: teacher._id
        })
            .populate({
                path: "classId",
                select: "class"
            })
            .lean();

        const regularClasses = assignments
            .map(assignment => {
                const classDoc = assignment.classId as unknown as {
                    class: string;
                } | null;

                return classDoc?.class;
            })
            .filter(
                (classValue): classValue is string =>
                    Boolean(classValue)
            );

        // Find temporary class arrangements.
        const arrangements = await Arrangement.find({
            arrangedTeacherId: teacher._id
        })
            .select("class")
            .lean();

        const temporaryClasses = arrangements.map(
            arrangement => arrangement.class
        );

        // Combine and deduplicate regular and temporary classes.
        const assignedClasses = [
            ...new Set([
                ...regularClasses,
                ...temporaryClasses
            ])
        ];

        // Ensure the teacher can access the selected class.
        if (!assignedClasses.includes(className)) {
            return res.status(403).json({
                message:
                    "You are not assigned to or arranged for this class"
            });
        }

        // Build the student query.
        const studentFilter = {
            class: className,
            isDeleted: { $ne: true } as const
        };

        let studentQuery = Student.find(studentFilter);

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

            const matchingUserIds = matchingUsers.map(
                user => user._id
            );

            studentQuery = Student.find({
                ...studentFilter,
                userId: { $in: matchingUserIds }
            });
        }

        // Fetch students and retain their roll numbers for sorting.
        const students = await studentQuery
            .select("_id class rollNumber userId")
            .populate({
                path: "userId",
                select: "name uid"
            })
            .sort({ rollNumber: 1 })
            .lean();

        const studentIds = students.map(
            student => student._id
        );

        // Fetch attendance records for these students on the selected date.
        const attendance = await Attendance.find({
            studentId: { $in: studentIds },
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

        // Find students with approved leave.
        const approvedLeaves = await Leave.find({
            studentId: { $in: studentIds },
            status: "Approved",
            startDate: { $lte: selectedDate },
            endDate: { $gte: selectedDate }
        })
            .select("_id studentId")
            .lean();

        const leaveStudentIds = new Set(
            approvedLeaves
                .filter(leave => leave.studentId)
                .map(leave => leave.studentId!.toString())
        );

        const leaveMap = new Map(
            approvedLeaves
                .filter(leave => leave.studentId)
                .map(leave => [
                    leave.studentId!.toString(),
                    leave
                ])
        );

        // Map attendance records by student ID.
        const attendanceMap = new Map(
            attendance
                .filter(record => record.studentId)
                .map(record => {
                    const populatedStudent =
                        record.studentId as unknown as {
                            _id: typeof students[number]["_id"];
                            class: ClassName;
                            rollNumber: number;
                            userId: {
                                name?: string;
                                uid?: string;
                            } | null;
                        };

                    return [
                        populatedStudent._id.toString(),
                        record
                    ];
                })
        );

        // Create a lookup for student details.
        const studentMap = new Map(
            students.map(student => [
                student._id.toString(),
                student
            ])
        );

        // Build the final attendance result.
        const result = students.map(student => {
            const studentId = student._id.toString();

            if (leaveStudentIds.has(studentId)) {
                const leave = leaveMap.get(studentId);

                return {
                    _id: `${leave?._id}-${date}`,
                    studentId: student,
                    date: selectedDate,
                    status: "Leave" as const
                };
            }

            const attendanceRecord =
                attendanceMap.get(studentId);

            if (attendanceRecord) {
                return {
                    _id: attendanceRecord._id,
                    studentId:
                        studentMap.get(studentId) ?? student,
                    date: attendanceRecord.date,
                    status: attendanceRecord.status
                };
            }

            return {
                _id: `unmarked-${studentId}-${date}`,
                studentId: student,
                date: selectedDate,
                status: "Not Marked" as const
            };
        });

        // Sort by roll number using the student documents.
        result.sort(
            (a, b) =>
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

        // Calculate counts across all filtered students.
        const presentCount = result.filter(
            record => record.status === "Present"
        ).length;

        const absentCount = result.filter(
            record => record.status === "Absent"
        ).length;

        const leaveCount = result.filter(
            record => record.status === "Leave"
        ).length;

        return res.status(200).json({
            class: className,
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
        return next(error);
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
        // Find the student and populate their user details.
        const student = await Student.findById(studentId)
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

        // Find the Class document corresponding to the student's class.
        const classDocument = await Class.findOne({
            class: student.class
        })
            .select("_id")
            .lean();

        if (!classDocument) {
            return res.status(404).json({
                message: "Class not found"
            });
        }

        // Check whether the logged-in teacher has an assignment in this class.
        const assignment = await TeacherAssignment.exists({
            teacherId: teacher._id,
            classId: classDocument._id
        });

        if (!assignment) {
            return res.status(403).json({
                message: "You are not assigned to teach in this student's class"
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


export const getStudentMonthlyAttendance = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const studentId =
            req.query.studentId?.toString() || "";

        const year = Number(req.query.year);
        const month = Number(req.query.month);

        if (!studentId) {
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
                message: "A valid year and month are required"
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

        // Ensure the student belongs to the teacher's assigned class
        // Find the student and populate their user details.
        const student = await Student.findById(studentId)
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

        // Find the Class document corresponding to the student's class.
        const classDocument = await Class.findOne({
            class: student.class
        })
            .select("_id")
            .lean();

        if (!classDocument) {
            return res.status(404).json({
                message: "Class not found"
            });
        }

        // Verify that the teacher has an assignment in this class.
        const assignment = await TeacherAssignment.exists({
            teacherId: teacher._id,
            classId: classDocument._id
        });

        if (!assignment) {
            return res.status(403).json({
                message: "You are not assigned to teach in this student's class"
            });
        }

        const monthStart = new Date(
            Date.UTC(year, month - 1, 1)
        );

        const nextMonthStart = new Date(
            Date.UTC(year, month, 1)
        );

        // Fetch attendance only within the selected month
        const attendanceRecords = await Attendance.find({
            studentId: student._id,
            date: {
                $gte: monthStart,
                $lt: nextMonthStart
            }
        })
            .select("date status")
            .sort({ date: 1 })
            .lean();

        // Fetch approved leaves overlapping the selected month
        const approvedLeaves = await Leave.find({
            studentId: student._id,
            status: "Approved",
            startDate: { $lt: nextMonthStart },
            endDate: { $gte: monthStart }
        })
            .select("startDate endDate")
            .sort({ startDate: 1 })
            .lean();

        // Actual attendance takes priority over leave
        const attendanceByDate = new Map<
            string,
            { date: string; status: string }
        >();

        for (const record of attendanceRecords) {
            const date = new Date(record.date)
                .toISOString()
                .slice(0, 10);

            attendanceByDate.set(date, {
                date,
                status: record.status
            });
        }

        // Expand approved leave dates within the selected month
        for (const leave of approvedLeaves) {
            const leaveStart = new Date(leave.startDate)
                .toISOString()
                .slice(0, 10);

            const leaveEnd = new Date(leave.endDate)
                .toISOString()
                .slice(0, 10);

            const start = new Date(
                Math.max(
                    new Date(leaveStart).getTime(),
                    monthStart.getTime()
                )
            );

            const end = new Date(
                Math.min(
                    new Date(leaveEnd).getTime(),
                    nextMonthStart.getTime() - 24 * 60 * 60 * 1000
                )
            );

            for (
                const currentDate = new Date(start);
                currentDate <= end;
                currentDate.setUTCDate(
                    currentDate.getUTCDate() + 1
                )
            ) {
                const date = currentDate
                    .toISOString()
                    .slice(0, 10);

                if (!attendanceByDate.has(date)) {
                    attendanceByDate.set(date, {
                        date,
                        status: "Leave"
                    });
                }
            }
        }

        const attendance = Array.from(
            attendanceByDate.values()
        ).sort((a, b) =>
            a.date.localeCompare(b.date)
        );

        return res.status(200).json({
            attendance
        });
    } catch (error) {
        next(error);
    }
};

export const getMyAttendance = async (
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

        const teacher = await Teacher.findOne({
            userId: req.user?.userId,
            isDeleted: { $ne: true }
        })
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

        const teacherId = teacher._id;

        const [attendance, approvedLeaves] =
            await Promise.all([
                TeacherAttendance.find({
                    teacherId
                })
                    .select("_id date status")
                    .lean(),

                Leave.find({
                    teacherId,
                    status: "Approved"
                })
                    .select("_id startDate endDate")
                    .sort({ startDate: 1 })
                    .lean()
            ]);

        const attendanceDates = new Set(
            attendance.map(record =>
                new Date(record.date)
                    .toISOString()
                    .slice(0, 10)
            )
        );

        const leaveRecords: {
            _id: string;
            date: Date;
            status: "Leave";
        }[] = [];

        for (const leave of approvedLeaves) {
            const currentDate = new Date(
                leave.startDate
            );

            const endDate = new Date(
                leave.endDate
            );

            currentDate.setUTCHours(0, 0, 0, 0);
            endDate.setUTCHours(0, 0, 0, 0);

            while (currentDate <= endDate) {
                const dateString = currentDate
                    .toISOString()
                    .slice(0, 10);

                if (!attendanceDates.has(dateString)) {
                    leaveRecords.push({
                        _id: `${leave._id}-${dateString}`,
                        date: new Date(currentDate),
                        status: "Leave"
                    });
                }

                currentDate.setUTCDate(
                    currentDate.getUTCDate() + 1
                );
            }
        }

        const result = [
            ...attendance.map(record => ({
                _id: record._id.toString(),
                date: record.date,
                status: record.status as
                    | "Present"
                    | "Absent"
                    | "Leave"
            })),
            ...leaveRecords
        ];

        result.sort(
            (a, b) =>
                new Date(a.date).getTime() -
                new Date(b.date).getTime()
        );

        const presentCount = result.filter(
            record => record.status === "Present"
        ).length;

        const absentCount = result.filter(
            record => record.status === "Absent"
        ).length;

        const leaveCount = result.filter(
            record => record.status === "Leave"
        ).length;

        const totalDays =
            presentCount + absentCount;

        const percentage = totalDays > 0
            ? Number(
                (
                    (presentCount / totalDays) * 100
                ).toFixed(2)
            )
            : 0;

        const totalRecords = result.length;

        const totalPages = Math.ceil(
            totalRecords / pageLimit
        );

        const validPage = totalPages > 0
            ? Math.min(currentPage, totalPages)
            : 1;

        const skip = (validPage - 1) * pageLimit;

        const paginatedAttendance = result.slice(
            skip,
            skip + pageLimit
        );

        const user = teacher.userId as any;

        return res.status(200).json({
            teacher: {
                name: user?.name ?? "",
                uid: user?.uid ?? "",
                employeeID: teacher.employeeID
            },
            attendance: paginatedAttendance,
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
    } catch (error) {
        next(error);
    }
};


export const getMyMonthlyAttendance = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const year = Number(req.query.year);
        const month = Number(req.query.month);

        if (
            !Number.isInteger(year) ||
            year < 1000 ||
            year > 9999 ||
            !Number.isInteger(month) ||
            month < 1 ||
            month > 12
        ) {
            return res.status(400).json({
                message: "A valid year and month are required"
            });
        }

        const teacher = await Teacher.findOne({
            userId: req.user?.userId,
            isDeleted: { $ne: true }
        })
            .select("_id employeeID userId")
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

        const monthStart = new Date(
            Date.UTC(year, month - 1, 1)
        );

        const nextMonthStart = new Date(
            Date.UTC(year, month, 1)
        );

        const [attendanceRecords, approvedLeaves] =
            await Promise.all([
                TeacherAttendance.find({
                    teacherId: teacher._id,
                    date: {
                        $gte: monthStart,
                        $lt: nextMonthStart
                    }
                })
                    .select("date status")
                    .sort({ date: 1 })
                    .lean(),

                Leave.find({
                    teacherId: teacher._id,
                    status: "Approved",
                    startDate: { $lt: nextMonthStart },
                    endDate: { $gte: monthStart }
                })
                    .select("startDate endDate")
                    .lean()
            ]);

        const attendanceByDate = new Map<
            string,
            { date: string; status: "Present" | "Absent" | "Leave" }
        >();

        for (const record of attendanceRecords) {
            const date = new Date(record.date)
                .toISOString()
                .slice(0, 10);

            attendanceByDate.set(date, {
                date,
                status: record.status
            });
        }

        for (const leave of approvedLeaves) {
            const leaveStart = new Date(
                leave.startDate
            );

            const leaveEnd = new Date(
                leave.endDate
            );

            leaveStart.setUTCHours(0, 0, 0, 0);
            leaveEnd.setUTCHours(0, 0, 0, 0);

            const start = new Date(
                Math.max(
                    leaveStart.getTime(),
                    monthStart.getTime()
                )
            );

            const end = new Date(
                Math.min(
                    leaveEnd.getTime(),
                    nextMonthStart.getTime() - 86400000
                )
            );

            for (
                const currentDate = new Date(start);
                currentDate <= end;
                currentDate.setUTCDate(
                    currentDate.getUTCDate() + 1
                )
            ) {
                const date = currentDate
                    .toISOString()
                    .slice(0, 10);

                // Actual attendance takes priority over leave.
                if (!attendanceByDate.has(date)) {
                    attendanceByDate.set(date, {
                        date,
                        status: "Leave"
                    });
                }
            }
        }

        const user = teacher.userId as any;

        return res.status(200).json({
            teacher: {
                name: user?.name ?? "",
                uid: user?.uid ?? "",
                employeeID: teacher.employeeID
            },
            attendance: Array.from(
                attendanceByDate.values()
            ).sort((a, b) =>
                a.date.localeCompare(b.date)
            )
        });
    } catch (error) {
        next(error);
    }
};


export const getTeacherSubjects = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const teacher = await Teacher.findOne({
            userId: req.user?.userId,
            isDeleted: false
        });

        if (!teacher) {
            return res.status(404).json({
                message: "Teacher not found"
            });
        }

        // Fetch regular subject assignments
        const assignments = await TeacherAssignment.find({
            teacherId: teacher._id
        })
            .populate({
                path: "subjectId",
                select: "name subjectCode"
            })
            .populate({
                path: "classId",
                select: "class"
            })
            .lean();

        const regularSubjects = assignments.flatMap((assignment) => {
            const subject = assignment.subjectId as unknown as {
                _id: { toString: () => string };
                name: string;
                subjectCode: string;
            } | null;

            const classDoc = assignment.classId as unknown as {
                class: string;
            } | null;

            if (!subject || !classDoc) {
                return [];
            }

            return [{
                _id: subject._id.toString(),
                name: subject.name,
                subjectCode: subject.subjectCode,
                class: classDoc.class
            }];
        });

        // Fetch temporary subject assignments
        const arrangements = await Arrangement.find({
            arrangedTeacherId: teacher._id
        })
            .populate({
                path: "subjectId",
                select: "name subjectCode"
            })
            .lean();

        const temporarySubjects = arrangements.flatMap((arrangement) => {
            const subject = arrangement.subjectId as unknown as {
                _id: { toString: () => string };
                name: string;
                subjectCode: string;
            } | null;

            if (!subject) {
                return [];
            }

            return [{
                _id: subject._id.toString(),
                name: subject.name,
                subjectCode: subject.subjectCode,
                class: arrangement.class
            }];
        });

        // Combine regular and temporary assignments.
        // A subject assigned through both sources should appear only once
        // for the same class.
        const uniqueSubjects = new Map<
            string,
            {
                _id: string;
                name: string;
                subjectCode: string;
                class: string;
            }
        >();

        [...regularSubjects, ...temporarySubjects].forEach((subject) => {
            const key = `${subject._id}-${subject.class}`;

            if (!uniqueSubjects.has(key)) {
                uniqueSubjects.set(key, subject);
            }
        });

        const subjects = Array.from(uniqueSubjects.values());

        // Sort by subject name, then class
        subjects.sort((a, b) => {
            const nameComparison = a.name.localeCompare(b.name);

            if (nameComparison !== 0) {
                return nameComparison;
            }

            return a.class.localeCompare(b.class);
        });

        return res.status(200).json({
            subjects
        });
    } catch (error) {
        next(error);
    }
};