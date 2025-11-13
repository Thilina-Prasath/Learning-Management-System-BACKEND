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

// Parse JSON
app.use(express.json());

// ===================  CORS CONFIGURATION  ===================
const allowedOrigins = [
  "http://localhost:5173", // local dev
  "http://127.0.0.1:5173", // local dev alias
  "https://learning-management-system-frontend-mocha.vercel.app" // your Vercel frontend
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.error(`❌ CORS ERROR: Origin not allowed: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
// =============================================================

// 🧠 Root test route (useful for checking deployment)
app.get("/", (req, res) => {
  res.send("✅ Learning Management System API is running successfully");
});

// --- Mongoose Connection ---
mongoose
  .connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
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
