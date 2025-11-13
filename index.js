import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import studentrouter from "./router/studentrouter.js";
import courserouter from "./router/courserouter.js";
import uploadRouter from "./router/uploadRoute.js";
import reviewrouter from "./router/reviewRouter.js";
import { authMiddleware } from "./middleware/authMiddleware.js";

dotenv.config();

const app = express();
app.use(express.json());

// ===================  THE FINAL CORS LIST  ===================
// This list now includes ALL your Vercel deployment URLs.
const allowedOrigins = [
  // --- Local Testing ---
  "http://localhost:5173",
  "http://127.0.0.1:5173",

  // --- Deployed Vercel Sites (All of them) ---
  "https://learning-management-system-frontend-mocha.vercel.app",
  "https://learning-management-system-frontend-dun.vercel.app",
  "https://learning-management-syste-git-cf9b8c-prasaths-projects-16ccf692.vercel.app",
  "https://learning-management-system-frontend-nine-beta.vercel.app",
  "https://learning-management-system-frontend-teal.vercel.app",
  "https://learning-management-system-frontend-md5zg12by.vercel.app"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Remove trailing slash (if any) for a clean match
      const originWithoutSlash = origin ? origin.replace(/\/$/, "") : origin;
      if (!originWithoutSlash || allowedOrigins.indexOf(originWithoutSlash) !== -1) {
        callback(null, true); // Allow
      } else {
        console.error(`❌ CORS ERROR: Origin not allowed: ${origin}`);
        callback(new Error("Not allowed by CORS")); // Block
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
// =============================================================

// Root test route
app.get("/", (req, res) => {
  res.send("✅ Learning Management System API is running successfully");
});

// --- Mongoose Connection ---
// I have removed the deprecated (useNewUrlParser, useUnifiedTopology) options
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => {
    console.log("✅ MongoDB connected");
  })
  .catch((err) => {
    console.log("❌ Error connecting to MongoDB:", err);
  });

// --- ROUTES ---
app.use("/api/student", studentrouter);
app.use("/api/course", courserouter);
app.use("/api/reviews", authMiddleware, reviewrouter);
app.use("/api", uploadRouter);

// --- Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});