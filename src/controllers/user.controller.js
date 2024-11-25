import asyncHandler from "../utils/asyncHandler.js"; // Utility to handle async functions with error handling
import { ApiError } from "../utils/ApiError.js"; // Custom error handler
import { User } from "../models/user.model.js"; // User model for interacting with the database
import { uploadOnCloudinary } from "../utils/cloudinary.js"; // Utility to upload images to Cloudinary
import bcrypt from "bcrypt"; // Library for hashing passwords
import { ApiResponse } from "../utils/ApiResponse.js"; // Standardized API response structure
import jwt from "jsonwebtoken";

// Function to generate access and refresh tokens for the user
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId); // Find user by ID
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const accessToken = user.generateAccessToken(); // Generate access token
    const refreshToken = user.generateRefreshToken(); // Generate refresh token

    // Store the refresh token in the user's record for future use
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

// The registerUser function is used to handle the user registration process
const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, password } = req.body;

  // Validate user details to ensure no empty fields
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // Check if user already exists by username or email
  const existedUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existedUser) {
    throw new ApiError(409, "User with username or email already exists");
  }

  // Handle file uploads (avatar and cover image)
  const avatarLocalPath = req.files?.avatar ? req.files.avatar[0]?.path : null;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0];
  }

  // If avatar is missing, throw an error
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  let avatar, coverImage;
  try {
    // Upload avatar to Cloudinary
    avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar || !avatar.url) {
      throw new ApiError(400, "Avatar file upload failed");
    }

    // If cover image is provided, upload it to Cloudinary
    if (coverImageLocalPath) {
      coverImage = await uploadOnCloudinary(coverImageLocalPath);
      if (!coverImage || !coverImage.url) {
        coverImage = null; // Set cover image to null if upload fails
      }
    }
  } catch (error) {
    throw new ApiError(500, `File upload error: ${error.message}`);
  }

  // Hash the user's password before saving
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user record in the database
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password: hashedPassword,
    username: username.toLowerCase(),
  });

  // Retrieve the newly created user without sensitive data (password, refreshToken)
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Created Successfully"));
});

// The loginUser function handles the user login process
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate that either email or username is provided, and password is required
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  // Check if the user exists by email
  let user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  // Check if the password is correct using bcrypt.compare()
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid User Credentials");
  }

  // Generate access and refresh tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  // Retrieve user details without password and refreshToken
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // Set cookies with tokens for secure access
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User Logged In Successfully"
      )
    );
});

// The logoutUser function handles logging out the user
const logoutUser = asyncHandler(async (req, res) => {
  // Clear the refresh token from the user's record in the database
  await User.findByIdAndUpdate(
    req.user._id,
    { $set: { refreshToken: undefined } },
    { new: true }
  );

  // Clear the cookies storing the access and refresh tokens
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, null, "User Logged Out Successfully"));
});

// Function to refresh the access token
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized Request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id);

    if (!user || incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Invalid or expired Refresh Token");
    }

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
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access Token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Refresh token");
  }
});

// The changeCurrentPassword function handles password change
const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Old password is incorrect");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed Successfully"));
});

// The getCurrentUser function fetches the current user's data
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User Fetched Successfully"));
});

// The updateAccountDetails function updates user account details
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email, bio } = req.body;
  if (!fullName || !email || !bio) {
    throw new ApiError(400, "Full Name, Email, and Bio are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { fullName, email, bio } },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account Updated Successfully"));
});

// The updateUserAvatar function updates the user's avatar
const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar File is Missing");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar.url) {
    throw new ApiError(400, "Error While Uploading Avatar");
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { avatar: avatar.url },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Avatar Updated"));
});

// The updateUserCoverImage function updates the user's cover image
const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover Image File is Missing");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImage.url) {
    throw new ApiError(400, "Error While Uploading Cover Image");
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { coverImage: coverImage.url },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Cover Image Updated"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
};
