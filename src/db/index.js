import mongoose from "mongoose";

// Function to connect to MongoDB
const connectDB = async () => {
  try {
    // Attempt to connect to MongoDB using the connection string from environment variables
    const connectionInstance = await mongoose
      .connect(process.env.MONGODB_URL) // Connect to MongoDB using the provided URL
      .then(() => console.log("Connected to MongoDB")) // Log a success message once the connection is established
      .catch((err) => console.error("MongoDB connection error:", err)); // Catch any connection errors
    console.log("\n MongoDB connected ");
  } catch (error) {
    // If an error occurs during the connection attempt, log it and exit the process with a failure code
    console.log("MONGO DB connection error : ", error);
    process.exit(1); // Exit the application with a failure status (1)
  }
};

// Export the function so it can be used elsewhere in the application
export default connectDB;
