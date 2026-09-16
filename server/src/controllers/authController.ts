import { Request, Response, NextFunction } from "express";
import User from "../models/User";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { uid, password } = req.body;
        const user = await User.findOne({ uid });

        if (!user) {
            return res.status(401).json({
                message: "Invalid uid or password"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid uid or password"
            });
        }

        const secret = process.env.JWT_SECRET;

        if (!secret) {
            throw new Error("JWT secret not defined");
        }

        const token = jwt.sign(
            {
                userId: user._id,
                role: user.role
            },
            secret,
            {
                expiresIn: "1d"
            }
        );

        res.status(200).json({
            message: "login Successful",
            token,
            user: {
                name: user.name,
                uid: user.uid,
                role: user.role
            }
        });
    }
    catch (error) {
        next(error);
    }
};

export const changePassword = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { oldPassword, newPassword } = req.body;

        const user = await User.findById(req.user?.userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const isMatch = await bcrypt.compare(
            oldPassword,
            user.password
        );

        if (!isMatch) {
            return res.status(400).json({
                message: "Old password is incorrect"
            });
        }

        const hashedPassword = await bcrypt.hash(
            newPassword,
            10
        );

        user.password = hashedPassword;

        await user.save();

        res.status(200).json({
            message: "Password changed successfully"
        });
    }
    catch (error) {
        next(error);
    }
};