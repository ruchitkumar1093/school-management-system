import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

dotenv.config();

type Migration = {
    _id: string;
    executedAt: Date;
};

const runMigration = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI!);

        console.log("Connected to MongoDB");

        const db = mongoose.connection.db;

        if (!db) {
            throw new Error("Database connection not available");
        }

        const migrationsCollection =
            db.collection<Migration>("migrations");

        const migrationFiles = fs
            .readdirSync(__dirname)
            .filter(
                (file) =>
                    /^\d+_.*\.(ts|js)$/.test(file) &&
                    file !== "migrate.ts"
            )
            .sort();

        if (migrationFiles.length === 0) {
            console.log("No migrations found");
            return;
        }

        for (const migrationFile of migrationFiles) {
            const migrationName = path.basename(
                migrationFile,
                path.extname(migrationFile)
            );

            const migrationAlreadyRun =
                await migrationsCollection.findOne({
                    _id: migrationName
                });

            if (migrationAlreadyRun) {
                console.log(`Skipping ${migrationName}`);
                continue;
            }

            console.log(`Running ${migrationName}...`);

            const migrationPath = path.join(
                __dirname,
                migrationFile
            );

            const migration = await import(
                pathToFileURL(migrationPath).href
            );

            if (typeof migration.up !== "function") {
                throw new Error(
                    `${migrationName} does not export an up function`
                );
            }

            await migration.up();

            await migrationsCollection.insertOne({
                _id: migrationName,
                executedAt: new Date()
            });

            console.log(
                `${migrationName} completed successfully`
            );
        }

        console.log("Migration process completed successfully");
    }
    catch (error) {
        console.error("Migration failed:", error);
        process.exitCode = 1;
    }
    finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
    }
};

runMigration();