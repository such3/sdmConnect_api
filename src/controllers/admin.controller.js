// Import necessary models, utility functions, and classes
import { User } from "../models/user.model.js"; // User model for interacting with User data
import { Resource } from "../models/resource.model.js"; // Resource model for interacting with Resource data
import asyncHandler from "../utils/asyncHandler.js"; // Utility for handling async operations with error handling
import { ApiResponse } from "../utils/ApiResponse.js"; // Class to format API responses
import { ApiError } from "../utils/ApiError.js"; // Class to handle custom API errors

// Admin Dashboard Function
const adminDashboard = asyncHandler(async (req, res) => {
  try {
    // 1. Fetch the total number of resources published
    const totalResources = await Resource.countDocuments();

    // 2. Fetch the number of distinct users contributing resources
    const totalUsersContributing =
      await Resource.distinct("owner").countDocuments();

    // 3. Group resources by branch and count how many resources are in each branch
    const resourcesPerBranch = await Resource.aggregate([
      {
        $group: {
          _id: "$branch", // Group by branch field in Resource
          total: { $sum: 1 }, // Count the number of resources in each branch
        },
      },
      { $sort: { total: -1 } }, // Sort branches by total resources (descending)
    ]);

    // 4. Group resources by semester and count how many resources are in each semester
    const resourcesPerSemester = await Resource.aggregate([
      {
        $group: {
          _id: "$semester", // Group by semester field in Resource
          total: { $sum: 1 }, // Count the number of resources in each semester
        },
      },
      { $sort: { _id: 1 } }, // Sort semesters by ascending semester number
    ]);

    // 5. Find the top 3 contributors (users with the most resources)
    const topContributors = await Resource.aggregate([
      {
        $group: {
          _id: "$owner", // Group by owner (user) of the resource
          totalResources: { $sum: 1 }, // Count the total number of resources each user has contributed
        },
      },
      { $sort: { totalResources: -1 } }, // Sort by the total number of resources (descending)
      { $limit: 3 }, // Limit to the top 3 contributors
      {
        $lookup: {
          from: "users", // Lookup user details from the User collection
          localField: "_id", // Match owner field in Resource with _id in User collection
          foreignField: "_id", // Reference _id in User collection
          as: "userDetails", // Alias for the user details
        },
      },
      { $unwind: "$userDetails" }, // Unwind the userDetails array to access individual user data
      {
        $project: {
          _id: 1,
          totalResources: 1,
          fullName: "$userDetails.fullName", // Select the full name of the user
          username: "$userDetails.username", // Select the username of the user
          avatar: "$userDetails.avatar", // Select the avatar of the user
        },
      },
    ]);

    // Return the formatted admin dashboard data as a JSON response
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          totalResources, // Total number of resources
          totalUsersContributing, // Total number of contributing users
          resourcesPerBranch, // Resources grouped by branch
          resourcesPerSemester, // Resources grouped by semester
          topContributors, // Top 3 contributors
        },
        "Admin Dashboard Data"
      )
    );
  } catch (error) {
    return next(error); // Pass any error to the global error handler
  }
});

// Delete a User by Admin
const deleteUser = asyncHandler(async (req, res) => {
  const { userId } = req.params; // Extract userId from the request parameters

  // Step 1: Find the user by their ID
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found"); // If user is not found, throw error
  }

  // Step 2: Delete all resources owned by this user
  await Resource.deleteMany({ owner: userId });

  // Step 3: Remove the reference to the user from any remaining resources (if not already done)
  await Resource.updateMany({ owner: userId }, { $pull: { owner: userId } });

  // Step 4: Delete the user from the database
  await user.deleteOne({ _id: userId });

  // Step 5: Return a success response after deletion
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        null,
        "User and associated resources deleted successfully"
      )
    );
});

// Block a Resource by Admin
const blockResource = asyncHandler(async (req, res) => {
  const { resourceId } = req.params; // Extract resourceId from the request parameters

  // Step 1: Find the resource by its ID
  const resource = await Resource.findById(resourceId);

  if (!resource) {
    throw new ApiError(404, "Resource not found"); // If resource is not found, throw error
  }

  // Step 2: Block the resource by setting isBlocked to true
  resource.isBlocked = true;

  // Step 3: Save the updated resource with the new block status
  await resource.save();

  // Step 4: Return success response after blocking the resource
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Resource blocked successfully"));
});

// Unblock a Resource by Admin
const unblockResource = asyncHandler(async (req, res) => {
  const { resourceId } = req.params; // Extract resourceId from the request parameters

  // Step 1: Find the resource by its ID
  const resource = await Resource.findById(resourceId);

  if (!resource) {
    throw new ApiError(404, "Resource not found"); // If resource is not found, throw error
  }

  // Step 2: Unblock the resource by setting isBlocked to false
  resource.isBlocked = false;

  // Step 3: Save the updated resource with the new unblock status
  await resource.save();

  // Step 4: Return success response after unblocking the resource
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Resource unblocked successfully"));
});

// Export all the functions to be used in routes
export { adminDashboard, deleteUser, blockResource, unblockResource };
