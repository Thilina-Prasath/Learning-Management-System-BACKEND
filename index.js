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

app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

// REMOVE OR COMMENT OUT THIS DUPLICATE MIDDLEWARE - It's causing conflicts
/*
app.use((req, res, next) => {
    const tokenString = req.headers.authorization;
    if (tokenString != null) {
        const token = tokenString.replace("Bearer ", "").trim();
        jwt.verify(token, process.env.JWT_KEY, (err, decoded) => {
            if (decoded) {
                req.student = decoded;
                next();
            } else {
                console.log("token invalid");
                return res.status(401).json({ message: "Unauthorized Access" });
            }
        });
    } else {
        next();
    }
});
*/

// In index.js

// ... (all imports and setup)

mongoose.connect(process.env.MONGODB_URL).then(() => {
    console.log("MongoDB connected");
}).catch((err) => {
    console.log("Error in connecting to MongoDB", err);
});

// === ROUTES ===

// Public routes
app.use("/api/student", studentrouter);

// Specific API routes
app.use("/api/course", courserouter);
app.use("/api/reviews", authMiddleware, reviewrouter); 

// ✅ FIX: The general /api router (uploadRouter) MUST come LAST.
app.use("/api", uploadRouter); 

app.listen(5000, () => {
    console.log("Server is running on port 5000");
});