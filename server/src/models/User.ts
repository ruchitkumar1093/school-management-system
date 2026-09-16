import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        
        uid: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            lowercase: true
        },

        password: {
            type: String,
            required: true
        },

        role: {
            type: String,
            enum: ["principal", "teacher", "student"],
            required: true
        }
    },
    {
        collection: "users"
    }
);

const User = mongoose.model("User", userSchema);
export default User;