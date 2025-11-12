import express from "express";
import {
  deleteCourse,
  getCourses, // We will reuse this controller
  getCourseById,
  createCourse,
  updateCourse,
} from "../controller/courseContoller.js";
import { adminMiddleware, authMiddleware } from "../middleware/authMiddleware.js";

const courserouter = express.Router();


courserouter.get("/", getCourses);
courserouter.get("/:id", getCourseById);


courserouter.get(
  "/admin/all",
  authMiddleware,
  adminMiddleware,
  getCourses
);

// Add course - ADMIN ONLY
courserouter.post(
  "/save",
  authMiddleware,
  adminMiddleware,
  createCourse
);

// Update course - ADMIN ONLY
courserouter.put(
  "/update/:id",
  authMiddleware,
  adminMiddleware,
  updateCourse
);

// Delete course - ADMIN ONLY
courserouter.delete(
  "/delete/:id",
  authMiddleware,
  adminMiddleware,
  deleteCourse
);

export default courserouter;