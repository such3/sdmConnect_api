import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      min: [3, "Title must be at least 3 characters long"],
      max: [255, "Title must be at most 255 characters long"],
      index: true,
    },
    description: {
      min: [10, "Description must be at least 10 characters long"],
      max: [500, "Description must be at most 500 characters long"],
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    semester: {
      type: Number,
      required: [true, "Semester is required"],
      max: [8, "Semster can be Maximum 8"],
      min: [1, "Semster can be Minimum 1"],
    },
    branch: {
      type: String,
      required: [true, "Branch is required"],
      enum: ["ISE", "CSE", "ECE", "MECH", "CIVIL", "EEE", "AIML", "CHEMICAL"],
    },
    url: {
      type: String,
      required: [true, "File URL is required"],
      trim: true,
    },
    fileSize: {
      type: Number,
      required: [true, "File size is required"],
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

resourceSchema.plugin(mongooseAggregatePaginate);
export const Resource = mongoose.model("Resource", resourceSchema);
