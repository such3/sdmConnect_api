import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dbErrorHandler from "../utils/dbErrorHandler.js"; // Importing the error handler utility

/**
 * User Schema for storing user data in the MongoDB database.
 * This schema defines the structure and validation rules for the user document.
 *
 * @schema User
 * @field {String} username - The unique username of the user. It must be between 3 to 30 characters long and only contain alphanumeric characters, hyphens, and underscores.
 * @field {String} email - The unique email address of the user. It must be a valid email format.
 * @field {String} fullName - The full name of the user. It must be between 3 to 255 characters long and only contain alphabetic characters and spaces.
 * @field {String} avatar - URL of the user's avatar image.
 * @field {String} coverImage - URL of the user's cover image.
 * @field {String} bio - A short biography of the user, can be up to 500 characters long.
 * @field {String} role - Role of the user, can either be "user" or "admin" (default: "user").
 * @field {Array} resources - An array of resource IDs that the user has uploaded.
 * @field {String} password - The password for the user. It must be at least 8 characters long and meet strong password requirements (uppercase, lowercase, numbers, special characters).
 * @field {Boolean} isBlocked - A boolean flag indicating whether the user is blocked (default: false).
 * @field {String} refreshToken - Refresh token used for re-authenticating the user.
 */
const userSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"], // Username is a required field
      lowercase: true, // Converts the username to lowercase
      min: [3, "Username must be at least 3 characters long"], // Minimum length validation
      trim: true, // Trims whitespace around the username
      unique: [true, "Username is already in use"], // Ensures uniqueness of the username
      index: true, // Indexes the username for better search performance
      match: [
        /^[a-zA-Z0-9_-]+$/,
        "Username can only contain letters, numbers, hyphens, and underscores.",
      ], // Regex validation for username format
    },
    email: {
      type: String,
      required: [true, "Email is required"], // Email is a required field
      lowercase: true, // Converts the email to lowercase
      trim: true, // Trims whitespace around the email
      unique: [true, "Email is already in use"], // Ensures uniqueness of the email
      match: [
        /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/,
        "Please provide a valid email address",
      ], // Regex validation for email format
    },
    fullName: {
      type: String,
      min: [3, "Fullname must be at least 3 characters long"], // Minimum length validation
      required: [true, "Fullname is required"], // Full name is a required field
      trim: true, // Trims whitespace around the full name
      match: [
        /^[a-zA-Z\s]+$/,
        "Full name can only contain letters and spaces.",
      ], // Regex validation for full name format
    },
    avatar: {
      type: String,
      required: true, // Avatar URL is required
    },
    coverImage: {
      type: String,
    },
    bio: {
      type: String,
      min: [10, "Bio must be at least 10 characters long"], // Minimum length validation
      max: [500, "Bio must be at most 500 characters long"], // Maximum length validation
      default: "Hello, I'm new here!", // Default value for bio
      trim: true, // Trims whitespace around the bio
    },
    role: {
      type: String,
      enum: ["user", "admin"], // Valid values for role
      default: "user", // Default role is "user"
    },
    resources: [
      {
        type: Schema.Types.ObjectId, // Array of ObjectId references to resources
        ref: "Resource", // References the "Resource" model
      },
    ],
    password: {
      type: String,
      required: [true, "Password is required"], // Password is a required field
      min: [8, "Password must be at least 8 characters long"], // Minimum password length
      validate: {
        validator: function (v) {
          // Strong password validation: must include lowercase, uppercase, number, and special character
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}:"<>?;,'./\\[\\]]).{8,}$/.test(
            v
          );
        },
        message:
          "Password must be at least 8 characters long and include at least one lowercase letter, one uppercase letter, one number, and one special character.",
      },
    },
    isBlocked: {
      type: Boolean,
      default: false, // Default value for isBlocked is false
    },
    refreshToken: {
      type: String, // Refresh token to store user's token for session maintenance
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

/**
 * Pre-save Hook to hash the password before saving the user document.
 * This function ensures the password is hashed using bcrypt before storing it in the database.
 */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || this.password.startsWith("$2b$")) {
    return next(); // If password is not modified or already hashed, skip hashing
  }

  try {
    this.password = await bcrypt.hash(this.password, 10); // Hash the password using bcrypt with 10 rounds of salt
    next();
  } catch (error) {
    next(error); // Pass the error to the next middleware if hashing fails
  }
});

/**
 * Method to compare the provided password with the stored hashed password.
 * This function is used for authentication to check if the user entered the correct password.
 *
 * @param {String} password - The password entered by the user.
 * @returns {Boolean} - Returns true if the password matches, otherwise false.
 */
userSchema.methods.isPasswordCorrect = async function (password) {
  const match = await bcrypt.compare(password, this.password); // Compare the entered password with the stored hashed password
  return match; // Return the result of the comparison
};

/**
 * Method to generate an access token for the user.
 * This token is used for authenticating the user in the system.
 *
 * @returns {String} - The generated access token.
 */
userSchema.methods.generateAccessToken = function () {
  try {
    const accessToken = jwt.sign(
      {
        _id: this._id,
        username: this.username,
        email: this.email,
        fullName: this.fullName,
      },
      process.env.ACCESS_TOKEN_SECRET, // Secret key for signing the token
      {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY, // Token expiration time (from environment variable)
      }
    );
    return accessToken; // Return the generated access token
  } catch (error) {
    throw new Error("Token generation failed"); // Handle any errors during token generation
  }
};

/**
 * Method to generate a refresh token for the user.
 * This token is used to obtain a new access token when the original one expires.
 * The refresh token is also saved to the user's record for future use.
 *
 * @returns {String} - The generated refresh token.
 */
userSchema.methods.generateRefreshToken = function () {
  const refreshToken = jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET, // Secret key for signing the refresh token
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY, // Refresh token expiration time (from environment variable)
    }
  );

  this.refreshToken = refreshToken; // Save the refresh token to the user's record
  return refreshToken; // Return the generated refresh token
};

/**
 * Error handling middleware for MongoDB errors.
 * This middleware is triggered after saving a user document to the database.
 * It uses the `dbErrorHandler` utility to catch and format any database-related errors.
 */
userSchema.post("save", function (error, doc, next) {
  const err = dbErrorHandler(error); // Use the error handler utility to format the error
  next(err); // Pass the formatted error to the next middleware
});

// Export the User model based on the user schema
export const User = mongoose.model("User", userSchema);
