import mongoose from "mongoose";
import dotenv from "dotenv";
import { up } from "./seedDemoData";

dotenv.config();

const runMigration = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI!);

        console.log("Connected to MongoDB");

        const db = mongoose.connection.db;

        if (!db) {
            throw new Error("Database connection not available");
        }

        const usersCount = await db.collection("users").countDocuments();

        if (usersCount > 0) {
            console.log("Database already contains data");
            console.log("Demo data migration was not run");
            return;
        }

        console.log("Starting demo data migration...");

        await up();

        console.log("Demo data migration completed successfully");
    }
    catch (error) {
        console.error("Migration failed:", error);
    }
    finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
    }
};

runMigration();