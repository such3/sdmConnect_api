// user.routes.js
import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"; // Middleware to handle file uploads
import { verifyJWT } from "../middlewares/auth.middleware.js"; // Middleware to verify JWT
import {
  createResource,
  getAllResources,
  getSingleResource,
  updateResource,
  deleteResource,
} from "../controllers/resource.controller.js";

// Create a new Express Router instance
const router = Router();

// Register Route
router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

// Login Route
router.route("/login").post(loginUser);

// Logout Route
router.route("/logout").post(verifyJWT, logoutUser);

// Refresh Token Route
router.route("/refresh-token").post(refreshAccessToken);

// Resource Routes (Secured for users)
router.route("/resource").post(verifyJWT, createResource);
router.route("/resources").get(verifyJWT, getAllResources);
router.route("/resource/:resourceId").get(verifyJWT, getSingleResource);
router.route("/resource/:resourceId").put(verifyJWT, updateResource);
router.route("/resource/:resourceId").delete(verifyJWT, deleteResource);

export default router;
