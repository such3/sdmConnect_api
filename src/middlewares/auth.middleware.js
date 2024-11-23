import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";

// Middleware to verify the access token and authorize the user
export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    console.log("Verifying JWT...");

    // Step 1: Extract the token from cookies, headers, or query parameters
    const token =
      req.cookies?.accessToken ||
      req.headers["authorization"]?.replace("Bearer ", "") ||
      req.query.accessToken;

    console.log("Extracted token:", token);

    // Step 2: If no token is found, return an error (Unauthorized)
    if (!token) {
      console.log("Error: No token provided");
      throw new ApiError(401, "Access token is required for authentication");
    }

    // Step 3: Verify the token using the secret key
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      console.log("Token decoded:", decodedToken);
    } catch (error) {
      console.log("Error: Invalid or expired token");
      if (error.name === "TokenExpiredError") {
        throw new ApiError(401, "Token has expired, please log in again");
      }
      throw new ApiError(401, "Invalid access token");
    }

    // Step 4: Check if the user ID in the token is valid
    if (
      !decodedToken._id ||
      !mongoose.Types.ObjectId.isValid(decodedToken._id)
    ) {
      console.log("Error: Invalid user ID in token");
      throw new ApiError(401, "Invalid user ID in access token");
    }

    // Step 5: Fetch the user associated with the token
    console.log("Fetching user from database with ID:", decodedToken._id);
    const user = await User.findById(decodedToken._id).select(
      "-password -refreshToken -__v"
    );

    // Step 6: If user is not found, throw an error (Invalid Access Token)
    if (!user) {
      console.log("Error: User not found for the provided token");
      throw new ApiError(404, "User Not Found: Invalid Access Token");
    }

    // Step 7: Attach the user to the request object for future use
    req.user = user;
    console.log("User found and attached to request object:", user._id);

    // Step 8: Proceed to the next middleware or route handler
    next();
  } catch (error) {
    // Handle errors, such as invalid token, expired token, or other JWT-related issues
    console.log("Error:", error.message);
    throw new ApiError(401, error?.message || "Invalid Access Token");
  }
});
