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

const app = express();

// Serve static files from the 'uploads' directory
app.use(
  "/uploads",
  verifyJWT,
  express.static(path.join(process.cwd(), "uploads"))
);

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN, // Set the allowed origin
    credentials: true, // Allow cookies to be sent with requests
    methods: ["GET", "POST", "PUT", "DELETE"], // Allowed methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
  })
);

// Security enhancements
app.use(helmet()); // Adds HTTP headers to protect the app

// Rate limiting setup to avoid too many requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter); // Apply rate limiting

// Body parsing and limits
app.use(express.json({ limit: "16kb" })); // Set limit for JSON requests
app.use(express.urlencoded({ extended: true, limit: "16kb" })); // Set limit for URL-encoded requests
app.use(express.static("public")); // Serve static files (e.g., for file uploads)
app.use(cookieParser()); // Parse cookies in requests

// Routes import
import userRouter from "./routes/user.routes.js";
import adminRouter from "./routes/admin.routes.js";
import { verifyJWT } from "./middlewares/auth.middleware.js";

// Route declaration
app.use("/api/v1/users", userRouter); // User-related routes
app.use("/api/v1/admin", adminRouter); // Admin-related routes

// Global error handler for uncaught exceptions and rejections
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV === "development") {
    console.error(err); // Log error stack trace in development
  }

  // Check for known error type (e.g., ValidationError, CastError) and send appropriate response
  if (err.name === "ValidationError") {
    return res.status(400).json({ message: err.message });
  }

  if (err.name === "CastError") {
    return res.status(400).json({ message: "Invalid ID format" });
  }

  // Handle Multer-specific errors (e.g., file size limit, file type)
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: `Multer Error: ${err.message}` });
  }

  // Handle custom API errors (e.g., ApiError from your custom error handler)
  if (err.statusCode) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  // Fallback to a generic error message for unexpected errors
  return res.status(500).json({ message: "Internal Server Error" });
});

// Catch-all route for undefined endpoints (404 handler)
app.all("*", (req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

export default app;
