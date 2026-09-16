import { Request, Response, NextFunction } from "express";
import AdmissionRequest from "../models/AdmissionRequest";
import User from "../models/User";
import Student from "../models/Student";
import mongoose from "mongoose";
import bcrypt from "bcrypt";

export const createAdmission = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {
            studentName,
            dateOfBirth,
            gender,
            classApplyingFor,
            previousClass,
            fatherName,
            motherName,
            phone,
            email,
            address,
            city,
            state,
            pinCode,
            bloodGroup,
            aadhaarNumber,
            academicYear
        } = req.body;

        const admission = await AdmissionRequest.create({
            studentName,
            dateOfBirth,
            gender,
            classApplyingFor,
            previousClass,
            fatherName,
            motherName,
            phone,
            email,
            address,
            city,
            state,
            pinCode,
            bloodGroup,
            aadhaarNumber,
            academicYear
        });

        res.status(201).json({
            message: "Admission application submitted successfully",
            admission
        });
    }
    catch (error) {
        console.log(error);
        next(error);
    }
};


export const getAdmissions = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const admissions = await AdmissionRequest.find()
            .sort({ createdAt: -1 });

        res.status(200).json(admissions);
    }
    catch (error) {
        console.log(error);
        next(error);
    }
};


export const getAdmissionById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id } = req.params;

        const admission = await AdmissionRequest.findById(id);

        if (!admission) {
            return res.status(404).json({
                message: "Admission application not found"
            });
        }

        res.status(200).json(admission);
    }
    catch (error) {
        console.log(error);
        next(error);
    }
};


export const rejectAdmission = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const session = await mongoose.startSession();

    try {
        const { id } = req.params;

        const admission = await AdmissionRequest.findById(id);

        if (!admission) {
            return res.status(404).json({
                message: "Admission application not found"
            });
        }

        if (admission.status === "rejected") {
            return res.status(400).json({
                message: "Admission application is already rejected"
            });
        }

        await session.withTransaction(async () => {

            if (admission.status === "approved") {

                if (admission.studentId) {
                    await Student.findByIdAndDelete(
                        admission.studentId,
                        { session }
                    );
                }

                if (admission.userId) {
                    await User.findByIdAndDelete(
                        admission.userId,
                        { session }
                    );
                }
            }

            admission.status = "rejected";

            await admission.save({ session });
        });

        res.status(200).json({
            message: "Admission application rejected"
        });

    } catch (error) {
        console.log(error);
        next(error);
    } finally {
        await session.endSession();
    }
};

export const deleteRejectedAdmissions = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const result = await AdmissionRequest.deleteMany({
            status: "rejected"
        });

        res.status(200).json({
            message: "All rejected admission applications deleted successfully",
            deletedCount: result.deletedCount
        });
    }
    catch (error) {
        console.log(error);
        next(error);
    }
};

export const approveAdmission = async (req: Request, res: Response, next: NextFunction) => {
    const session = await mongoose.startSession();

    try {
        const { id } = req.params;

        const admission = await AdmissionRequest.findById(id).session(session);

        if (!admission) {
            return res.status(404).json({
                message: "Admission application not found"
            });
        }

        if (admission.status === "approved") {
            return res.status(400).json({
                message: "Admission application is already approved"
            });
        }

        session.startTransaction();

        const lastStudentUser = await User.findOne({
            role: "student"
        })
            .sort({ uid: -1 })
            .session(session);

        let uidNumber = 1;

        if (lastStudentUser) {
            uidNumber =
                parseInt(
                    lastStudentUser.uid.replace("stu", ""),
                    10
                ) + 1;
        }

        const uid = `stu${uidNumber.toString().padStart(4, "0")}`;

        const password = new Date(admission.dateOfBirth)
            .toLocaleDateString("en-GB")
            .replaceAll("/", "");

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create(
            [
                {
                    name: admission.studentName,
                    uid,
                    password: hashedPassword,
                    role: "student"
                }
            ],
            { session }
        );

        const lastStudent = await Student.findOne({
            class: admission.classApplyingFor
        })
            .sort({ rollNumber: -1 })
            .session(session);

        const rollNumber = lastStudent
            ? lastStudent.rollNumber + 1
            : 1;

        const student = await Student.create(
            [
                {
                    userId: user[0]._id,
                    class: admission.classApplyingFor,
                    rollNumber
                }
            ],
            { session }
        );

        admission.status = "approved";
        admission.userId = user[0]._id;
        admission.studentId = student[0]._id;

        await admission.save({ session });

        await session.commitTransaction();

        res.status(200).json({
            message: "Admission application approved successfully",
            student: student[0],
            admission
        });

    } catch (error) {
        await session.abortTransaction();

        console.log(error);
        next(error);

    } finally {
        await session.endSession();
    }
};