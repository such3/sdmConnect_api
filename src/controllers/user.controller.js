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
    // console.log("Generating tokens for user ID:", userId); // Debugging line
    const user = await User.findById(userId); // Find user by ID
    if (!user) {
      // console.log("Error: User not found while generating tokens");
      throw new ApiError(404, "User not found");
    }

    const accessToken = user.generateAccessToken(); // Generate access token
    const refreshToken = user.generateRefreshToken(); // Generate refresh token

    // console.log("Generated access token and refresh token"); // Debugging line

    // Store the refresh token in the user's record for future use
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken }; // Return both tokens
  } catch (error) {
    // console.log("Error while generating tokens:", error.message);
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access tokens"
    );
  }
};

// The registerUser function is used to handle the user registration process
const registerUser = asyncHandler(async (req, res) => {
  // Step 1: Extract user details from the request body
  const { fullName, email, username, password } = req.body;
  // console.log(
  //   "User Registration Details: ",
  //   fullName,
  //   email,
  //   username,
  //   password
  // );

  // Step 2: Validate user details to ensure no empty fields
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    // console.log("Error: Missing required fields"); // Debugging line
    throw new ApiError(400, "All fields are required");
  }

  // Step 3: Check if user already exists by username or email
  const existedUser = await User.findOne({ $or: [{ username }, { email }] });

  if (existedUser) {
    // console.log("Error: User with this username or email already exists"); // Debugging line
    throw new ApiError(409, "User with username or email already exists");
  }

  // Step 4: Handle file uploads (avatar and cover image)
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
    // console.log("Error: Avatar is required but not provided"); // Debugging line
    throw new ApiError(400, "Avatar is required");
  }

  let avatar, coverImage;
  try {
    // Step 5: Upload avatar to Cloudinary
    // console.log("Uploading avatar to Cloudinary...");
    avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar || !avatar.url) {
      throw new ApiError(400, "Avatar file upload failed");
    }

    // Step 6: If cover image is provided, upload it to Cloudinary
    if (coverImageLocalPath) {
      // console.log("Uploading cover image to Cloudinary...");
      coverImage = await uploadOnCloudinary(coverImageLocalPath);
      if (!coverImage || !coverImage.url) {
        coverImage = null; // Set cover image to null if upload fails
        // console.log("Cover image upload failed, setting to null");
      }
    }
  } catch (error) {
    // console.log("Error during file upload:", error.message);
    throw new ApiError(500, `File upload error: ${error.message}`);
  }

  // Step 7: Hash the user's password before saving
  // console.log("Hashing password..."); // Debugging line
  const salt = await bcrypt.genSalt(10); // Generate a salt for hashing
  const hashedPassword = await bcrypt.hash(password, salt); // Hash the password

  // Step 8: Create user record in the database
  // console.log("Creating new user record in the database...");
  const user = await User.create({
    fullName,
    avatar: avatar.url, // Store avatar URL from Cloudinary
    coverImage: coverImage?.url || "", // Optional cover image URL
    email,
    password: hashedPassword, // Store hashed password
    username: username.toLowerCase(), // Store username in lowercase for consistency
  });

  // Step 9: Retrieve the newly created user without sensitive data (password, refreshToken)
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    // console.log("Error: Failed to create user"); // Debugging line
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  // Step 10: Respond with success message and created user details
  // console.log("User created successfully:", createdUser); // Debugging line
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Created Successfully"));
});

// The loginUser function handles the user login process
const loginUser = asyncHandler(async (req, res) => {
  // Step 1: Extract login credentials (email/username and password)
  const { email, password } = req.body;

  // console.log("Login attempt with:", email, username, password); // Debugging line to check if password is being sent

  // Validate that either email or username is provided, and password is required
  if (!email || !password) {
    // console.log("Error: Missing email or password"); // Debugging line
    throw new ApiError(400, "Email and password are required");
  }

  // Step 2: Check if the user exists by email or username (ensure case-insensitive username handling)
  let user;
  if (email) {
    // Search for the user by email
    user = await User.findOne({ email });
  }

  if (!user) {
    // console.log("Error: User not found:", email || username); // Debugging line
    throw new ApiError(404, "User does not exist");
  }

  // Step 3: Check if the password is correct using bcrypt.compare()
  // console.log(
  //   "Checking if provided password matches the stored hash for user:",
  //   user.username
  // );
  // console.log("Password : ", password, "Password 2 : ", user.password);
  const isPasswordValid = await bcrypt.compare(password, user.password); // Compare provided password with stored hash
  // console.log("Password validation result:", isPasswordValid);

  if (!isPasswordValid) {
    // console.log("Invalid credentials for user:", email || username); // Debugging line
    throw new ApiError(401, "Invalid User Credentials");
  }

  // Step 4: Generate access and refresh tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  // Step 5: Retrieve user details without password and refreshToken
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // more about refresh token and access token

  // Step 6: Set cookies with tokens for secure access
  const options = {
    httpOnly: true, // Prevent client-side access to cookies
    secure: true, // Ensure cookies are only sent over HTTPS
  };

  // console.log("User logged in successfully:", loggedInUser); // Debugging line

  return res
    .status(200)
    .cookie("accessToken", accessToken, options) // Set access token cookie
    .cookie("refreshToken", refreshToken, options) // Set refresh token cookie
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
  // Step 1: Clear the refresh token from the user's record in the database
  await User.findByIdAndUpdate(
    req.user._id,
    { $set: { refreshToken: undefined } },
    { new: true } // Return the updated document
  );

  // Step 2: Clear the cookies storing the access and refresh tokens
  const options = {
    httpOnly: true, // Prevent client-side access to cookies
    secure: true, // Ensure cookies are only sent over HTTPS
  };

  // console.log("User logged out successfully:", req.user._id); // Debugging line

  return res
    .status(200)
    .clearCookie("accessToken", options) // Clear access token cookie
    .clearCookie("refreshToken", options) // Clear refresh token cookie
    .json(new ApiResponse(200, null, "User Logged Out Successfully"));
});

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

    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token is expired or used");
    }
    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);
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
    throw new ApiError(401, error?.message || "Invalid Refresh token ");
  }
});

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

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User Fetched Successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email, bio } = req.body;
  if (!fullName || !email || !bio) {
    throw new ApiError(400, "Full Name and Email and Bio are required");
  }

  const user = User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email: email,
        bio: bio,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account Updated Successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar File is  Missing");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar.url) {
    throw new ApiError(400, "Error While Uploading on Avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar Updated Successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover File is  Missing");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImage.url) {
    throw new ApiError(400, "Error While Uploading on Cover Image");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover Image Updated Successfully"));
});
export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  changeCurrentPassword,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
};
