import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

const app = express();

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
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
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

  // Handle custom API errors (e.g., ApiError from your custom error handler)
  if (err.statusCode) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  // Fallback to a generic error message
  return res.status(500).json({ message: "Internal Server Error" });
});

// Catch-all route for undefined endpoints (404 handler)
app.all("*", (req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

export default app;
