import mongoose from "mongoose";

const connectDB = async () => {
    try{
        const uri = process.env.MONGO_URI;
        if(!uri){
            throw new Error("MONGO_URI is not defined");
        }
        await mongoose.connect(uri);
        console.log("MongoDB connected");
    }
    catch(error: any){
        console.log("MongoDB connection failed", error.message);
        process.exit(1);
    }
    
}

export default connectDB;