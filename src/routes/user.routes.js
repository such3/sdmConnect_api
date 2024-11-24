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
import {
  rateResource,
  removeRating,
  getResourceRating,
} from "../controllers/rating.controller.js";

import {
  addComment,
  editComment,
  deleteComment,
  getComments,
} from "../controllers/comment.controller.js";
import { uploadSinglePdf } from "../middlewares/multerDoc.middleware.js";
import { downloadResource } from "../controllers/resource.controller.js"; // Controller to handle file downloads
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
router.route("/resource").post(verifyJWT, uploadSinglePdf, createResource);
router.route("/resources").get(verifyJWT, getAllResources);
router.route("/resource/:resourceId").get(verifyJWT, getSingleResource);
router.route("/resource/:resourceId").put(verifyJWT, updateResource);
router.route("/resource/:resourceId").delete(verifyJWT, deleteResource);

// Rating Routes (Secured for users)

// Rate a resource
router.route("/resource/:resourceId/rate").post(verifyJWT, rateResource);

// Remove a rating
router.route("/resource/:resourceId/rating").delete(verifyJWT, removeRating);

// Get resource rating (average rating)
router.route("/resource/:resourceId/rating").get(verifyJWT, getResourceRating);

// Comment Routes
// Add a comment to a resource
router.route("/resource/:resourceId/comment").post(verifyJWT, addComment);

// Edit a comment
router
  .route("/resource/:resourceId/comment/:commentId")
  .put(verifyJWT, editComment);

// Delete a comment
router
  .route("/resource/:resourceId/comment/:commentId")
  .delete(verifyJWT, deleteComment);

// Download resource route (protected)
router.get("/resource/download/:filename", verifyJWT, downloadResource);

// Get all comments for a resource
router.route("/resource/:resourceId/comments").get(verifyJWT, getComments);
export default router;
