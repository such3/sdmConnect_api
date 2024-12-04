// Import necessary utilities, models, and libraries
import asyncHandler from "../utils/asyncHandler.js"; // Handles async functions with error handling
import { ApiError } from "../utils/ApiError.js"; // Custom error handler for API errors
import { User } from "../models/user.model.js"; // User model for interacting with the database
import { uploadOnCloudinary } from "../utils/cloudinary.js"; // Utility function to upload images to Cloudinary
import bcrypt from "bcrypt"; // Library for hashing passwords securely
import { ApiResponse } from "../utils/ApiResponse.js"; // Standardized API response structure
import jwt from "jsonwebtoken"; // Library for creating and verifying JSON Web Tokens

// Function to generate access and refresh tokens for a user
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    // Fetch the user from the database by their ID
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found"); // If user doesn't exist, throw error
    }

    // Generate the access and refresh tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Store the refresh token in the user's record
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken }; // Return both tokens
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access tokens"
    );
  }
};

// Register user and return JSON response
const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, password } = req.body;

  // Check if all required fields are provided
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // Check if user with same email or username already exists
  const existedUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existedUser) {
    throw new ApiError(409, "User with username or email already exists");
  }

  // Handle file uploads for avatar and cover image
  const avatarLocalPath = req.files?.avatar ? req.files.avatar[0]?.path : null;
  let coverImageLocalPath;
  if (req.files?.coverImage?.length > 0) {
    coverImageLocalPath = req.files.coverImage[0]?.path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  // Upload avatar and cover image to Cloudinary
  let avatar, coverImage;
  try {
    avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar?.url) {
      throw new ApiError(400, "Avatar upload failed");
    }

    if (coverImageLocalPath) {
      coverImage = await uploadOnCloudinary(coverImageLocalPath);
      coverImage = coverImage?.url || null;
    }
  } catch (error) {
    throw new ApiError(500, `File upload error: ${error.message}`);
  }

  // Hash the password using bcrypt
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create a new user and save to the database
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage,
    email,
    password: hashedPassword,
    username: username.toLowerCase(),
  });

  // Exclude password and refreshToken from the returned data
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "User registration failed");
  }

  // Return the created user in the response
  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User created successfully"));
});

// Login user and return JSON response
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  // Find the user by email
  let user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Compare the provided password with the stored hashed password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  // Generate access and refresh tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  // Structure the logged-in user object to return
  const { fullName, avatar, coverImage, username } = user;
  const loggedInUser = { fullName, avatar, coverImage, username };

  const cookieOptions = { httpOnly: true, secure: true };
  // Set the tokens in cookies and send the response
  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(new ApiResponse(200, loggedInUser, "Login successful"));
});

// Logout user and return JSON response
const logoutUser = asyncHandler(async (req, res) => {
  // Remove the refresh token from the user's record
  await User.findByIdAndUpdate(req.user._id, {
    $set: { refreshToken: undefined },
  });

  const cookieOptions = { httpOnly: true, secure: true };
  // Clear the cookies and send the response
  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, null, "Logged out successfully"));
});

// Fetch the current logged-in user and return JSON response
const getCurrentUser = asyncHandler(async (req, res) => {
  const user = req.user;
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Current user fetched successfully"));
});

// Update account details and return JSON response
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email, bio } = req.body;
  if (!fullName || !email || !bio) {
    throw new ApiError(400, "Full Name, Email, and Bio are required");
  }

  // Update the user's account details and return the updated data
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { fullName, email, bio } },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Account updated successfully"));
});

// Update user avatar and return JSON response
const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  // Upload new avatar to Cloudinary and update user avatar
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar?.url) {
    throw new ApiError(400, "Error while uploading avatar");
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { avatar: avatar.url },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Avatar updated successfully"));
});

// Update user cover image and return JSON response
const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image file is missing");
  }

  // Upload new cover image to Cloudinary and update user cover image
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImage?.url) {
    throw new ApiError(400, "Error while uploading cover image");
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { coverImage: coverImage.url },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedUser, "Cover image updated successfully")
    );
});

// Change the current password and return JSON response
const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id);

  // Validate if the old password is correct
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Old password is incorrect");
  }

  // Change the password and save it
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Password changed successfully"));
});

// Refresh access token and return the new token in the response
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized Request");
  }

  try {
    // Verify the refresh token
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id);

    if (!user || incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Invalid or expired Refresh Token");
    }

    // Generate new access and refresh tokens
    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(new ApiResponse(200, null, "Token refreshed successfully"));
  } catch (error) {
    throw new ApiError(401, "Invalid or expired Refresh Token");
  }
});

// Export all functions for use in routes
export {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  changeCurrentPassword,
  refreshAccessToken,
};
