import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"; // Middleware to handle file uploads
import { verifyJWT } from "../middlewares/auth.middleware.js"; // Middleware to verify JWT
import { refreshAccessToken } from "../controllers/user.controller.js";

// Create a new Express Router instance
const router = Router();

// Register Route
// Handle POST requests to /register
// Uses the upload middleware to handle file uploads (avatar and coverImage)
router.route("/register").post(
  // File upload handling
  upload.fields([
    { name: "avatar", maxCount: 1 }, // Handle avatar image upload
    { name: "coverImage", maxCount: 1 }, // Handle cover image upload (optional)
  ]),
  // Controller function for handling user registration
  registerUser
);

// Login Route
// Handle POST requests to /login
router.route("/login").post(loginUser);

// Logout Route (secured)
// Handle POST requests to /logout
// The verifyJWT middleware ensures the user is authenticated before logging out
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
// Export the router to be used in other files (usually app.js or server.js)
export default router;
