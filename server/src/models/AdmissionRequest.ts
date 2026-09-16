import mongoose from "mongoose";

const admissionRequestSchema = new mongoose.Schema(
    {
        studentName: {
            type: String,
            required: true,
            trim: true
        },

        dateOfBirth: {
            type: Date,
            required: true
        },

        gender: {
            type: String,
            enum: ["Male", "Female", "Other"],
            required: true
        },

        classApplyingFor: {
            type: String,
            enum: [
                "1st",
                "2nd",
                "3rd",
                "4th",
                "5th",
                "6th",
                "7th",
                "8th",
                "9th",
                "10th",
                "11th",
                "12th"
            ],
            required: true
        },

        previousClass: {
            type: String,
            enum: [
                "1st",
                "2nd",
                "3rd",
                "4th",
                "5th",
                "6th",
                "7th",
                "8th",
                "9th",
                "10th",
                "11th",
                "12th"
            ],
            required: true
        },


        fatherName: {
            type: String,
            required: true,
            trim: true
        },

        motherName: {
            type: String,
            required: true,
            trim: true
        },

        phone: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            trim: true,
            lowercase: true,
            required: true
        },

        address: {
            type: String,
            required: true,
            trim: true
        },

        city: {
            type: String,
            required: true,
            trim: true
        },

        state: {
            type: String,
            required: true,
            trim: true
        },

        pinCode: {
            type: String,
            required: true,
            trim: true
        },

        bloodGroup: {
            type: String,
            enum: [
                "A+",
                "A-",
                "B+",
                "B-",
                "AB+",
                "AB-",
                "O+",
                "O-"
            ]
        },

        aadhaarNumber: {
            type: String,
            trim: true,
            required: true
        },

        academicYear: {
            type: String,
            required: true
        },

        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student"
        },
    },
    {
        timestamps: true
    }
);

const AdmissionRequest = mongoose.model("AdmissionRequest", admissionRequestSchema);

export default AdmissionRequest;