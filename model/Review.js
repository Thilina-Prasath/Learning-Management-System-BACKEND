import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    course: { type: String },  // Made optional since it's not in the form
    rating: { type: Number, required: true, min: 1, max: 5 },       
    comment: { type: String },
  },
  { timestamps: true }
);

// Create and export the model, not just the schema
const Review = mongoose.model("Review", reviewSchema);

export default Review;  // ✅ CORRECT - exporting model