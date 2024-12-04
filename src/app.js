import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import dotenv from "dotenv";
import multer from "multer";

// Initialize environment variables from .env file
dotenv.config();

// Create an Express app instance
const app = express();

// Set EJS as the view engine and specify the views directory
app.set("view engine", "ejs"); // Set EJS as the template engine
app.set("views", path.join(process.cwd(), "src", "views")); // Define the directory for views
console.log("Views directory:", path.join(process.cwd(), "src", "views"));

// Middleware to serve static files from 'uploads' folder
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads")) // Serve static files from 'uploads' folder
);

// CORS configuration to allow specific origins and credentials
app.use(
  cors({
    origin: process.env.CORS_ORIGIN, // Allow only specific origins from .env
    credentials: true, // Enable credentials to allow cookies
    methods: ["GET", "POST", "PUT", "DELETE"], // Specify allowed HTTP methods
    allowedHeaders: ["Content-Type", "Authorization"], // Specify allowed headers
  })
);

// Security middleware to protect HTTP headers
app.use(helmet()); // Adds security-related HTTP headers to protect the app

// Rate limiting middleware to prevent abuse (limits the number of requests)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Time window of 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: "Too many requests, please try again later.", // Message to show when the limit is exceeded
});
app.use(limiter);

// Body parsing and limits for incoming requests
app.use(express.json({ limit: "16kb" })); // Limit the size of JSON payloads
app.use(express.urlencoded({ extended: true, limit: "16kb" })); // Parse URL-encoded data
app.use(cookieParser()); // Parse cookies sent with requests

// Serve static files (CSS, images, etc.) from the public directory
app.use(express.static(path.join(process.cwd(), "public"))); // Public directory for assets

// Import routes (user and admin routes)
import userRouter from "./routes/user.routes.js";
import adminRouter from "./routes/admin.routes.js";

// Default route to render the 'layout' template
app.get("/", (req, res, next) => {
  try {
    res.status(200).render("layout", { title: "Sucheendra" }); // Render 'layout.ejs'
  } catch (error) {
    console.error("Error rendering template:", error); // Log error if rendering fails
    next(error); // Pass the error to the global error handler
  }
});

// API routes for users and admin
app.use("/api/v1/users", userRouter); // User-related routes
app.use("/api/v1/admin", adminRouter); // Admin-related routes

// Global error handler for uncaught exceptions and rejections
app.use((err, req, res, next) => {
  // Log the error stack trace in development (detailed error logging)
  if (process.env.NODE_ENV === "development") {
    console.error(err.stack); // Log full stack trace in development
  } else {
    // For production, only log the error message
    console.error(err.message);
  }

  // Handle Mongoose ValidationError (e.g., invalid input data)
  if (err.name === "ValidationError") {
    return res.status(400).json({
      status: "fail",
      message: `Validation Error: ${err.message}`, // Provide error message
      details: err.errors, // Include validation error details (optional)
    });
  }

  // Handle Mongoose CastError (e.g., invalid ObjectId format)
  if (err.name === "CastError") {
    return res.status(400).json({
      status: "fail",
      message: `Invalid ID format: ${err.value}`, // Include invalid ID value
    });
  }

  // Handle Multer errors (e.g., file size limit exceeded or invalid file type)
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      status: "fail",
      message: `Multer Error: ${err.message}`, // Display Multer-specific error message
    });
  }

  // Handle custom API errors (from your custom ApiError class or other custom errors)
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      status: err.statusCode >= 500 ? "error" : "fail", // Set status to 'error' for 500-range codes
      message: err.message, // Send the error message
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined, // Include stack trace in development
    });
  }

  // Handle unexpected errors (catch-all for other types of errors)
  console.error("Unexpected error:", err); // Log unexpected errors
  return res.status(500).json({
    status: "error", // Fallback to 'error' status
    message: "Internal Server Error", // Generic error message
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined, // Include stack trace in development
  });
});

// Catch-all route for undefined endpoints (404 handler)
app.all("*", (req, res) => {
  // Return a 404 error if the route does not exist
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Export the app instance for server setup
export default app;
