
import mongoose from "mongoose";

const teacherAssignmentSchema = new mongoose.Schema(
    {
        teacherId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Teacher",
            required: true
        },

        subjectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Subject",
            required: true
        },

        classId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Class",
            required: true
        }
    },
    {
        timestamps: true
    }
);

// A subject in a particular class can belong to only one teacher.
teacherAssignmentSchema.index(
    { subjectId: 1, classId: 1 },
    { unique: true }
);

// Useful when retrieving assignments for a teacher.
teacherAssignmentSchema.index(
    { teacherId: 1, classId: 1 }
);

const TeacherAssignment = mongoose.model(
    "TeacherAssignment",
    teacherAssignmentSchema
);

export default TeacherAssignment;
