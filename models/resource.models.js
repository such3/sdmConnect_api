import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      min: [5, "Title should be atleast 5 characters long "],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      min: [10, "Description should be atleast 10 characters long "],
    },
    author: {
      type: String,
      required: [true, "Author is required"],
    },
    semester: {
      type: Number,
      required: [true, "Semester is required"],
      min: [1, "Semester must be at least 1"],
      max: [8, "Semester must be at most 8"],
    },
    branch: {
      type: String,
      required: [true, "Branch is required"],
      enum: ["CSE", "ISE", "ECE", "EEE", "MECH", "CIVIL", "CHEM", "AIML"],
    },
    link: {
      type: String,
      required: [true, "Link is required"],
    },
    rating: {
      type: Number,
      default: 0,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
  },

  { timestamps: true }
);

export const Resource = mongoose.model("Resource", resourceSchema);
