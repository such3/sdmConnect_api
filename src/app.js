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

// Set up Pug as the view engine and specify the views directory
app.set("view engine", "pug");
app.set("views", path.join(process.cwd(), "src", "views")); // Ensure this path is correct
console.log("Views directory:", path.join(process.cwd(), "views"));

// Middleware to serve static files from 'uploads' folder
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads")) // Adjust path if needed
);

// CORS configuration to allow specific origins and credentials
app.use(
  cors({
    origin: process.env.CORS_ORIGIN, // Make sure this is correctly set in .env
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Security middlewares
app.use(helmet()); // Adds security-related HTTP headers

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: "Too many requests, please try again later.",
});
app.use(limiter);

// Body parsing and limits for incoming requests
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser()); // To parse cookies in requests
app.use(express.static("public")); // Serve static files (e.g., CSS, JS, images)

// Import your routes (adjust paths if needed)
import userRouter from "./routes/user.routes.js";
import adminRouter from "./routes/admin.routes.js";
import { verifyJWT } from "./middlewares/auth.middleware.js";
import { title } from "process";

// Default route to render the 'base.pug' template
app.get("/", (req, res, next) => {
  try {
    res.status(200).render("base", { title: "Sucheendra" }); // Make sure 'base.pug' exists in the views folder
  } catch (error) {
    console.error("Error rendering template:", error); // Log the error if rendering fails
    next(error); // Pass the error to the global error handler
  }
});

// API routes for users and admin
app.use("/api/v1/users", userRouter); // User-related routes
app.use("/api/v1/admin", adminRouter); // Admin-related routes

// Global error handler for uncaught exceptions and rejections
app.use((err, req, res, next) => {
  console.error(err); // Log error stack trace in development

  // Handle known errors like validation or cast errors
  if (err.name === "ValidationError") {
    return res.status(400).json({ message: err.message });
  }

  if (err.name === "CastError") {
    return res.status(400).json({ message: "Invalid ID format" });
  }

  // Handle Multer errors (e.g., file size limit)
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: `Multer Error: ${err.message}` });
  }

  // Custom API errors (if your custom error handler is used)
  if (err.statusCode) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  // Fallback to a generic internal server error if no specific handler matches
  return res.status(500).json({ message: "Internal Server Error" });
});

// Catch-all route for undefined endpoints (404 handler)
app.all("*", (req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

export default app;
