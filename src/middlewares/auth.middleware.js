import jwt from "jsonwebtoken"; // Import JWT for token verification
import { ApiError } from "../utils/ApiError.js"; // Import the custom error handler
import asyncHandler from "../utils/asyncHandler.js"; // Import async handler utility for better async error handling
import { User } from "../models/user.model.js"; // Import the User model for fetching user data from the database
import mongoose from "mongoose"; // Import mongoose for object validation

/**
 * Middleware to verify the access token and authorize the user.
 *
 * This middleware:
 * 1. Extracts the token from the request (from cookies, headers, or query).
 * 2. Verifies the token using JWT and checks for token expiration.
 * 3. Confirms that the user ID embedded in the token is valid.
 * 4. Fetches the user associated with the token from the database.
 * 5. If valid, attaches the user to the request object for further use.
 * 6. Proceeds to the next middleware or route handler.
 */
export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    // Step 1: Extract the token from the request (cookies, headers, or query parameters)
    const token =
      req.cookies?.accessToken || // Try to get token from cookies
      req.headers["authorization"]?.replace("Bearer ", "") || // Or from the Authorization header
      req.query.accessToken; // Or from the query parameters

    // If no token is found, return an error (Unauthorized)
    if (!token) {
      throw new ApiError(401, "You need to login to access this route"); // If no token, throw 401 error
    }

    // Step 2: Verify the token using the secret key
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET); // Verify the token using the secret key
    } catch (error) {
      // Token verification failed
      if (error.name === "TokenExpiredError") {
        throw new ApiError(401, "Token has expired, please log in again"); // If expired, throw 401 error
      }
      throw new ApiError(401, "Invalid access token"); // If invalid token, throw 401 error
    }

    // Step 3: Check if the user ID in the token is valid
    if (
      !decodedToken._id || // Check if the user ID is missing
      !mongoose.Types.ObjectId.isValid(decodedToken._id) // Validate if the user ID is a valid MongoDB ObjectId
    ) {
      throw new ApiError(401, "Invalid user ID in access token"); // If not valid, throw 401 error
    }

    // Step 4: Fetch the user associated with the token from the database
    const user = await User.findById(decodedToken._id).select(
      "-password -refreshToken -__v" // Exclude sensitive fields (password, refresh token, and version)
    );

    // If user is not found, throw an error (Invalid Access Token)
    if (!user) {
      throw new ApiError(404, "User Not Found: Invalid Access Token"); // If no user is found, throw 404 error
    }

    // Step 5: Attach the user to the request object for future use in other route handlers or middlewares
    req.user = user;

    // Step 6: Proceed to the next middleware or route handler
    next(); // Call next() to pass the request along the middleware chain
  } catch (error) {
    // If an error occurs at any step, handle it and pass it to the global error handler
    next(error); // Pass the error to the next middleware (global error handler)
  }
});
