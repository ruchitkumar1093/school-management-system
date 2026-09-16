import "express";

declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                role: "principal" | "teacher" | "student";
            };
        }
    }
}