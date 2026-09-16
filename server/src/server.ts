import dotenv from "dotenv";
dotenv.config();
import express from "express";
import connectDB from "./config/db";
import errorHandler from "./middlewares/errorHandler";
import cors from "cors";

import verifyToken from "./middlewares/authMiddleware";
import authorizeRole from "./middlewares/authorizeRole";

import authRouter from "./routes/authRoutes";
import principalRoutes from "./routes/principalRoutes";
import teacherRoutes from "./routes/teacherRoutes";
import studentRoutes from "./routes/studentRoutes";
import admissionRoutes from "./routes/admissionRoutes";

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 5000
app.get("/", (req, res) => {
    res.send("Backend is running");
});

app.use(cors({
    origin: "http://localhost:5173"
}));    

app.use("/api", authRouter);

app.use("/api/principal", verifyToken, authorizeRole("principal"), principalRoutes);
app.use("/api/teacher", verifyToken, authorizeRole("teacher"), teacherRoutes);
app.use("/api/student", verifyToken, authorizeRole("student"), studentRoutes);

app.use("/api/admissionRequest", admissionRoutes);

app.use(errorHandler);


app.listen(PORT, () => {
    console.log("server is running on port 5000");
});

connectDB();