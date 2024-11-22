import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import bcrypt from "bcrypt";
import { ApiResponse } from "../utils/ApiResponse.js";

// The registerUser function is used to handle the user registration process
const registerUser = asyncHandler(async (req, res) => {
  // Step 1: Extract the user details from the request body
  const { fullName, email, username, password } = req.body;
  console.log("User Details: ", fullName, email, username, password);

  // Step 2: Validate the user details to ensure all fields are filled
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // Step 3: Check if the user already exists by checking for duplicates in username or email
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  // If the user exists, throw a conflict error (409)
  if (existedUser) {
    throw new ApiError(409, "User with username or email already exists");
  }

  // Step 4: Handle file uploads (avatar and cover image)
  // Check if files are present in the request
  const avatarLocalPath = req.files?.avatar ? req.files.avatar[0]?.path : null;
  // const coverImageLocalPath = req.files?.coverImage
  //   ? req.files.coverImage[0]?.path
  //   : null;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0];
  }

  if (!avatarLocalPath) {
    // If avatar is missing, throw a bad request error (400)
    throw new ApiError(400, "Avatar is required");
  }

  let avatar, coverImage;
  try {
    // Step 5: Upload the avatar to Cloudinary
    avatar = await uploadOnCloudinary(avatarLocalPath); // Upload avatar to Cloudinary
    if (!avatar || !avatar.url) {
      throw new ApiError(400, "Avatar file upload failed");
    }

    // Step 6: If cover image is provided, upload it to Cloudinary
    if (coverImageLocalPath) {
      coverImage = await uploadOnCloudinary(coverImageLocalPath); // Optional cover image upload
      if (!coverImage || !coverImage.url) {
        coverImage = null; // Set cover image to null if upload failed
      }
    }
  } catch (error) {
    // If any error occurs during file upload, handle it here
    throw new ApiError(500, `File upload error: ${error.message}`);
  }

  // Step 7: Hash the user's password before saving it to the database
  const salt = await bcrypt.genSalt(10); // Generate a salt for password hashing
  const hashedPassword = await bcrypt.hash(password, salt); // Hash the password

  // Step 8: Create the user record in the database
  const user = await User.create({
    fullName,
    avatar: avatar.url, // Save the avatar URL from Cloudinary
    coverImage: coverImage?.url || "", // Optional cover image URL
    email,
    password: hashedPassword, // Save the hashed password
    username: username.toLowerCase(), // Save the username in lowercase
  });

  // Step 9: Check if the user was successfully created
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // If user creation failed, throw an internal server error (500)
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  // Step 10: Respond with the created user details, excluding sensitive information like password and refreshToken
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Created Successfully"));
});

export { registerUser };
