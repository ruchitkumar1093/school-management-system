import express from "express";
import { login, changePassword } from "../controllers/authController";
const router = express.Router();
import verifyToken from "../middlewares/authMiddleware";

router.post("/login", login);

router.put("/changePassword", verifyToken, changePassword);

export default router;