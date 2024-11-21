import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema({}, { timestamps: true });

export const Rating = mongoose.model("Rating", ratingSchema);
