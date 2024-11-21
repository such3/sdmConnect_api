import mongoose from "mongoose";
// import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose
      .connect(process.env.MONGODB_URL)
      .then(() => console.log("Connected to MongoDB"))
      .catch((err) => console.error("MongoDB connection error:", err));
    console.log("\n MongoDB connected ");
  } catch (error) {
    console.log("MONGO DB connection error : ", error);
    process.exit(1);
  }
};

export default connectDB;
