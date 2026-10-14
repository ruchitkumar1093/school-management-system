import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";

const verifyToken = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Token not found"
        });
    }

    const token = authHeader.split(" ")[1];

    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error("JWT secret not found");
    }

    interface JwtPayload {
        userId: string;
        role: "principal" | "teacher" | "student";
    }

    try {
        const decoded = jwt.verify(
            token,
            secret
        ) as JwtPayload;

        const user = await User.findById(decoded.userId);

        if (!user || user.isActive === false) {
            return res.status(401).json({
                message: "Account is deactivated",
                code: "ACCOUNT_DEACTIVATED"
            });
        }
        req.user = {
            userId: decoded.userId,
            role: decoded.role
        };

        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({
                message: "Token expired",
                code: "TOKEN_EXPIRED"
            });
        }

        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({
                message: "Not authorized"
            });
        }

        next(error);
    }
};

export default verifyToken;