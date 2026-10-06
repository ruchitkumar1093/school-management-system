import { Request, Response } from "express";
import Holiday from "../models/Holiday";
import Attendance from "../models/Attendance";

// Get all holidays
export const getHolidays = async (
    req: Request,
    res: Response
) => {
    try {
        const holidays = await Holiday.find()
            .sort({ date: 1 });

        return res.status(200).json(holidays);
    }
    catch (error) {
        console.error("Get holidays error:", error);

        return res.status(500).json({
            message: "Failed to get holidays"
        });
    }
};


// Add a new holiday
export const addHoliday = async (
    req: Request,
    res: Response
) => {
    try {
        const { date, name } = req.body;

        if (!date || !name?.trim()) {
            return res.status(400).json({
                message: "Date and holiday name are required"
            });
        }

        const holidayDate = new Date(date);

        const existingHoliday = await Holiday.findOne({
            date: holidayDate
        });

        if (existingHoliday) {
            return res.status(409).json({
                message: "A holiday already exists on this date"
            });
        }

        const existingAttendance = await Attendance.findOne({
            date: holidayDate
        });

        if (existingAttendance) {
            return res.status(409).json({
                message: "A holiday cannot be created because attendance has already been marked for this date"
            });
        }

        const holiday = await Holiday.create({
            date: holidayDate,
            name: name.trim()
        });

        return res.status(201).json(holiday);
    }
    catch (error) {
        console.error("Add holiday error:", error);

        return res.status(500).json({
            message: "Failed to add holiday"
        });
    }
};


// Update an existing holiday
export const updateHoliday = async (
    req: Request,
    res: Response
) => {
    try {
        const { id } = req.params;
        const { date, name } = req.body;

        if (!date || !name?.trim()) {
            return res.status(400).json({
                message: "Date and holiday name are required"
            });
        }

        const existingHoliday = await Holiday.findById(id);

        if (!existingHoliday) {
            return res.status(404).json({
                message: "Holiday not found"
            });
        }

        const holidayDate = new Date(date);

        const duplicateHoliday = await Holiday.findOne({
            date: holidayDate,
            _id: { $ne: id }
        });

        if (duplicateHoliday) {
            return res.status(409).json({
                message: "A holiday already exists on this date"
            });
        }

        const existingAttendance = await Attendance.findOne({
            date: holidayDate
        });

        if (existingAttendance) {
            return res.status(409).json({
                message: "This holiday cannot be moved to this date because attendance has already been marked for this date"
            });
        }

        existingHoliday.date = holidayDate;
        existingHoliday.name = name.trim();

        await existingHoliday.save();

        return res.status(200).json(existingHoliday);
    }
    catch (error) {
        console.error("Update holiday error:", error);

        return res.status(500).json({
            message: "Failed to update holiday"
        });
    }
};


// Delete a holiday
export const deleteHoliday = async (
    req: Request,
    res: Response
) => {
    try {
        const { id } = req.params;

        const holiday = await Holiday.findByIdAndDelete(id);

        if (!holiday) {
            return res.status(404).json({
                message: "Holiday not found"
            });
        }

        return res.status(200).json({
            message: "Holiday deleted successfully"
        });
    }
    catch (error) {
        console.error("Delete holiday error:", error);

        return res.status(500).json({
            message: "Failed to delete holiday"
        });
    }
};