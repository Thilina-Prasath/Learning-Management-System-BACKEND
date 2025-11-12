import express from "express";
import Review from "../model/Review.js";
import Student from "../model/student.js";

const router = express.Router();

// Require authentication - this checks if req.user exists (set by authMiddleware)
const requireAuth = (req, res, next) => {
  console.log("requireAuth - checking req.user:", req.user);
  if (!req.user || !req.user.id) {  // CHANGED: Check req.user.id instead of req.user._id
    return res.status(401).json({ message: "Authentication required." });
  }
  next();
};

// Require admin role
const requireAdmin = (req, res, next) => {
  console.log("requireAdmin - checking role:", req.user?.role);
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required." });
  }
  next();
};

router.get("/", requireAuth, async (req, res) => {  
  try {
    const reviews = await Review.find()
      .sort({ createdAt: -1 })
      .populate({
        path: "userId",
        model: Student,
        select: "firstName lastName email",
        options: { lean: true },
      });

    const safeReviews = reviews.map((r) => {
      if (!r.userId) {
        return {
          ...r.toObject(),
          userId: { firstName: "Deleted", lastName: "User", email: "" },
        };
      }
      return r;
    });

    res.json(safeReviews);
  } catch (err) {
    console.error("Error fetching reviews:", err);
    res.status(500).json({ message: "Failed to fetch reviews", error: err.message });
  }
});


router.post("/", requireAuth, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (rating == null || !comment) {
      return res.status(400).json({ message: "Rating and comment are required." });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5." });
    }

    // Fetch the user details from database since JWT only has id and role
    const user = await Student.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const review = new Review({
      userId: req.user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      course: user.course || "N/A",
      rating: Number(rating),
      comment: comment.trim(),
    });

    const savedReview = await review.save();
    res.status(201).json({ message: "Review submitted successfully", review: savedReview });
  } catch (err) {
    console.error("Review submission error:", err);
    res.status(500).json({ message: "Failed to submit review", error: err.message });
  }
});

// GET - Fetch reviews for the logged-in user
router.get("/my-reviews", requireAuth, async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    console.error("Error fetching user reviews:", err);
    res.status(500).json({ message: "Failed to fetch reviews", error: err.message });
  }
});

// DELETE
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }
    // CHANGED: Use req.user.id
    if (req.user.role !== "admin" && review.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "You do not have permission to delete this review" });
    }   
    await Review.findByIdAndDelete(req.params.id);
    res.json({ message: "Review deleted successfully" });
  } catch (err) {
    console.error("Error deleting review:", err);
    res.status(500).json({ message: "Failed to delete review", error: err.message });
  }
});

// PUT
router.put("/:id", requireAuth, async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const review = await Review.findById(req.params.id);
        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }
        // CHANGED: Use req.user.id
        if (req.user.role !== "admin" && review.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: "You do not have permission to update this review" });
        }
        if (rating != null) review.rating = Number(rating);
        if (comment) review.comment = comment.trim();
        const updatedReview = await review.save();
        res.json({ message: "Review updated successfully", review: updatedReview });
    } catch (err) {
        console.error("Error updating review:", err);
        res.status(500).json({ message: "Failed to update review", error: err.message });
    }
});

export default router;