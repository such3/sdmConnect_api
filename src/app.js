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
app.use(express.static("public")); // Serve static files
app.use(cookieParser()); // Parse cookies in requests

// Routes import
import userRouter from "./routes/user.routes.js";

// Routes declaration
app.use("/api/v1/users", userRouter);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack); // Log the error
  res.status(500).json({
    message: "Internal Server Error", // Return a generic error message
  });
});

export default app;
