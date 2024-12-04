import { ApiError } from "../utils/ApiError.js"; // Import the ApiError utility for custom error handling

/**
 * Middleware to check if the user has an "admin" role.
 * This middleware ensures that only users with the admin role can access specific routes.
 *
 * The middleware performs two key checks:
 * 1. Whether the user is authenticated (the user must be added to `req.user` via previous middleware like `verifyJWT`).
 * 2. Whether the authenticated user has the role of "admin".
 *
 * If either of these conditions is not met, an error is thrown, and the request is terminated.
 *
 * If the checks pass, the middleware allows the request to proceed to the next handler or middleware.
 */
export const verifyAdmin = (req, res, next) => {
  try {
    // 1. Check if the user is authenticated (verified via a previous JWT verification middleware)
    // If no user is found, the user is not authenticated.
    if (!req.user) {
      throw new ApiError(401, "User is not authenticated"); // Throw an authentication error (401 Unauthorized)
    }

    // 2. Check if the user's role is "admin"
    // If the user's role is not "admin", access is denied.
    if (req.user.role !== "admin") {
      throw new ApiError(403, "Access denied: Admins only"); // Throw a permission error (403 Forbidden)
    }

    // If both checks pass, allow the request to proceed to the next middleware or route handler.
    next();
  } catch (error) {
    // Catch any errors (authentication or permission) and pass them to the global error handler
    next(error); // Pass the error to the next middleware for handling
  }
};
