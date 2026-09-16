import { Request, Response, NextFunction } from "express";

const authorizeRole = (requiredRole: "principal" | "teacher" | "student") => {
    return (req: Request, res: Response, next: NextFunction) => {
        try{
            if(requiredRole !== req.user?.role){
                return res.status(403).json({
                    message: "Access denied"
                });
            }
            next();
        }
        catch(error){
            next(error);
        }
    }
}

export default authorizeRole;