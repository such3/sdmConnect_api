import { ApiError } from "../utils/ApiError.js";

// Middleware to check if the user is an admin
export const verifyAdmin = (req, res, next) => {
  try {
    // Check if the user is authenticated (verified via verifyJWT middleware)
    if (!req.user) {
      throw new ApiError(401, "User is not authenticated");
    }

    // Check if the user's role is "admin"
    if (req.user.role !== "admin") {
      throw new ApiError(403, "Access denied: Admins only");
    }

    // If the user is an admin, proceed to the next middleware or route handler
    next();
  } catch (error) {
    // Handle the error
    next(error); // Pass the error to the global error handler
  }
};
