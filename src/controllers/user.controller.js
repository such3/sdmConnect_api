import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js  ";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // steps to register a user
  // 1. get user details from frontend
  // 2. validate user details - notEmpty, valid email, password length
  // 3. check if user already exists : username, email
  // 4. Check for images [ avatar ]
  // 5. save user to cloudinary , avatar url
  // 6. create user object - create entry in database
  // 7. remove password and refresh token from user object
  // 8. check for user creation
  // return success response

  const { fullName, email, username, password } = req.body;
  console.log("User Details: ", fullName, email, username, password);

  // validate user details
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with username or email already exists");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar File is Required  ");
  }
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdError) {
    throw new ApiError(500, "Something Went Wrong while registering User");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Created Successfully"));

  //Noob way of validating user details
  // if (fullName === "") {
  //   throw new ApiError(400, "Full Name is required");
  // }
});

export { registerUser };
