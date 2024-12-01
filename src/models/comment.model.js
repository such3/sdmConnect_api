import mongoose from "mongoose";

// Define the schema for a Comment
const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to the User model
      required: true,
    },
    resource: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resource", // Reference to the Resource model
      required: true,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      min: [3, "Comment must be at least 3 characters long"],
      max: [1000, "Comment must be at most 1000 characters long"],
    },
  },
  {
    timestamps: true, // To track when the comment was created and updated
  }
);

const Comment = mongoose.model("Comment", commentSchema);

export { Comment };
