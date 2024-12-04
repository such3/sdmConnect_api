// Import necessary utilities, models, and modules
import asyncHandler from "../utils/asyncHandler.js"; // Handles async functions with error handling
import { ApiError } from "../utils/ApiError.js"; // Custom error handling for API responses
import { Resource } from "../models/resource.model.js"; // Resource model to interact with the resource collection
import { ApiResponse } from "../utils/ApiResponse.js"; // Standardized API response structure
import { User } from "../models/user.model.js"; // User model for interacting with the user collection
import mongoose from "mongoose"; // Mongoose for MongoDB object modeling

// Function to create a resource and update the user's resources list
const createResource = asyncHandler(async (req, res) => {
  // Log to confirm the controller is being executed
  console.log("Controller hit");

  // Extracting fields from the request body
  const { title, description, branch, semester, file } = req.body;

  // Validate if all required fields are provided
  if (
    [title, description, branch, semester, file].some(
      (field) => !field || field.trim === ""
    )
  ) {
    console.error("Missing required fields");
    return res
      .status(400)
      .json(new ApiResponse(400, null, "All fields are required"));
  }

  // Log the form data for debugging purposes
  console.log("Form data received:", {
    title,
    description,
    branch,
    semester,
    file, // The file URL uploaded by the user
  });

  try {
    // Create the new resource in the database
    const resource = await Resource.create({
      title,
      description,
      semester,
      branch,
      file, // File URL provided by the user
      owner: req.user._id, // The owner is set to the current logged-in user
    });

    console.log("Resource created:", resource);

    // If the resource wasn't created, respond with an error
    if (!resource) {
      console.error("Failed to create resource");
      return res
        .status(500)
        .json(new ApiResponse(500, null, "Resource not created"));
    }

    // Find the user and add the newly created resource to their resource list
    const user = await User.findById(req.user._id);
    if (!user) {
      console.error("User not found");
      return res.status(404).json(new ApiResponse(404, null, "User not found"));
    }

    // Push the new resource's ID to the user's resources array and save the user document
    user.resources.push(resource._id);
    await user.save();

    // Populate owner information and return the created resource in the response
    const createdResource = await Resource.findById(resource._id).populate(
      "owner",
      "fullName username avatar"
    );

    return res
      .status(201)
      .json(
        new ApiResponse(201, createdResource, "Resource created successfully")
      );
  } catch (error) {
    console.error("Error during resource creation:", error); // Log any errors that occur
    return res
      .status(500)
      .json(new ApiResponse(500, null, "Internal Server Error"));
  }
});

// Combined function to search and filter resources based on query parameters
const getAllResources = asyncHandler(async (req, res) => {
  // Step 1: Extract query parameters for filtering and pagination
  const { searchQuery, semester, branch, page = 1, limit = 10 } = req.query;

  // Step 2: Initialize the base filter object (only non-blocked resources)
  let filter = { isBlocked: false };

  // Step 3: Apply filters for semester (must be between 1 and 8)
  if (semester) {
    const semesterNum = parseInt(semester);
    if (semesterNum < 1 || semesterNum > 8) {
      throw new ApiError(400, "Semester must be a number between 1 and 8");
    }
    filter.semester = semesterNum; // Filter by semester
  }

  // Apply filter for branch (validate input)
  if (branch) {
    const validBranches = [
      "ISE",
      "CSE",
      "ECE",
      "MECH",
      "CIVIL",
      "EEE",
      "AIML",
      "CHEMICAL",
    ];
    if (!validBranches.includes(branch)) {
      throw new ApiError(400, "Invalid branch provided");
    }
    filter.branch = branch; // Filter by branch
  }

  // Step 4: Create a search query for title if searchQuery is provided
  if (searchQuery) {
    filter.title = {
      $regex: `\\b${searchQuery}\\b`, // Case-insensitive search with word boundaries
      $options: "i", // Case-insensitive matching
    };
  }

  // Step 5: Aggregate query to filter, sort, and populate owner information
  const aggregateQuery = Resource.aggregate([
    { $match: filter }, // Apply the filter (search, semester, branch)
    { $sort: { createdAt: -1 } }, // Sort by most recent resources
    {
      $lookup: {
        from: "users", // Lookup user details for the resource's owner
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    {
      $unwind: {
        path: "$owner", // Unwind the owner array (since it's an object)
        preserveNullAndEmptyArrays: true, // Keep resources without owners
      },
    },
    {
      $project: {
        title: 1,
        description: 1,
        semester: 1,
        branch: 1,
        url: 1,
        fileSize: 1,
        isBlocked: 1,
        owner: { fullName: 1, username: 1, avatar: 1 },
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ]);

  // Step 6: Apply pagination
  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
  };

  // Execute the aggregate query with pagination
  const resources = await Resource.aggregatePaginate(aggregateQuery, options);

  // Step 7: Handle case where no resources match the criteria
  if (!resources || resources.length === 0) {
    throw new ApiError(
      404,
      "No resources found with the given filters or search criteria"
    );
  }

  // Step 8: Return the resources with pagination information
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        resources,
        totalResources: resources.totalDocs,
        totalPages: resources.totalPages,
        currentPage: parseInt(page),
      },
      "Resources fetched successfully"
    )
  );
});

// Function to fetch a single resource by its ID
const getSingleResource = asyncHandler(async (req, res) => {
  const { resourceId } = req.params; // Extract resourceId from URL params

  // Step 1: Validate the resource ID format
  if (!mongoose.Types.ObjectId.isValid(resourceId)) {
    throw new ApiError(400, "Invalid resource ID format");
  }

  // Step 2: Find the resource by its ID and populate owner details
  const resource = await Resource.findById(resourceId)
    .populate("owner", "fullName username avatar")
    .exec();

  // Step 3: If the resource does not exist or is blocked, throw an error
  if (!resource || resource.isBlocked) {
    throw new ApiError(404, "Resource not found");
  }

  // Step 4: Return the resource in the response
  return res.status(200).json({
    status: 200,
    message: "Resource fetched successfully",
    data: resource, // The resource includes owner details after population
  });
});

// Function to update an existing resource's details
const updateResource = asyncHandler(async (req, res) => {
  const { resourceId } = req.params; // Extract resourceId from URL params
  const { title, description } = req.body; // Extract updated title and description from body

  // Validate if title and description are provided and not empty
  if (!title?.trim() || !description?.trim()) {
    throw new ApiError(400, "Title and description are required");
  }

  // Find the resource by ID
  const resource = await Resource.findById(resourceId);

  if (!resource || resource.isBlocked) {
    throw new ApiError(404, "Resource not found");
  }

  // Check if the logged-in user is the owner or an admin
  const isOwner = resource.owner.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";

  // Throw error if the user is neither the owner nor an admin
  if (!isOwner && !isAdmin) {
    throw new ApiError(403, "You are not authorized to update this resource");
  }

  // Update resource fields
  resource.title = title;
  resource.description = description;

  // Save the updated resource
  const updatedResource = await resource.save();

  // Return the updated resource
  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedResource, "Resource updated successfully")
    );
});

// Function to delete a resource
const deleteResource = asyncHandler(async (req, res) => {
  const { resourceId } = req.params; // Get the resource ID from URL params

  // Step 1: Find the resource
  const resource = await Resource.findById(resourceId);

  if (!resource || resource.isBlocked) {
    throw new ApiError(404, "Resource not found");
  }

  // Step 2: Check if the logged-in user is the owner or an admin
  const isOwner = String(resource.owner) === String(req.user._id);
  const isAdmin = req.user.role === "admin";

  // If neither, throw error
  if (!isOwner && !isAdmin) {
    throw new ApiError(403, "You are not authorized to delete this resource");
  }

  // Step 3: Remove the resource reference from the user's resources list
  await User.updateOne(
    { _id: resource.owner },
    { $pull: { resources: resourceId } }
  );

  // Step 4: Delete the resource
  await Resource.findByIdAndDelete(resourceId);

  // Step 5: Return success message
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Resource deleted successfully"));
});

export {
  createResource,
  getAllResources,
  updateResource,
  deleteResource,
  getSingleResource,
};
