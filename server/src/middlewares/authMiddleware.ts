import {Request, Response, NextFunction} from "express";
import jwt from "jsonwebtoken";

const verifyToken = (req: Request, res: Response, next: NextFunction) => {

    const authHeader = req.headers.authorization;

    if(!authHeader){
        return res.status(404).json({
            message: "token not found"
        });
    }

    const token = authHeader.split(" ")[1];

    const secret = process.env.JWT_SECRET;
    if(!secret){
        throw new Error("JWT secret not found");
    }

    interface jwtPayload{
        userId: string;
        role: "principal" | "teacher" | "student";
    }

    try{
        const decoded = jwt.verify(token, secret) as jwtPayload;

        req.user = {
            userId: decoded.userId,
            role: decoded.role
        }

        next();
    }

    catch(error){
        return res.status(400).json({
            message: "not authorized"
        });
    }
    
}

export default verifyToken;