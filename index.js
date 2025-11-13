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

// ===================  UPDATED CORS SECTION ===================
// These are the only URLs allowed to make requests to your API
const allowedOrigins = [
  'http://localhost:5173',      // Your local frontend
  'http://127.0.0.1:5173',     // Added this common alias for localhost
  'https://learning-management-system-frontend-mocha.vercel.app' // Your deployed Vercel frontend
];

app.use(cors({
  origin: function (origin, callback) {
    // 'origin' is the URL of the frontend making the request
    
    // Check if the incoming request origin is in our allowed list
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      // Allow request if it has no origin (like Postman/Insomnia)
      // or if the origin is in our allowed list
      callback(null, true);
    } else {
      // THIS IS NEW: Log the exact origin that was blocked
      console.error(`CORS ERROR: This origin is not allowed: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
// ==========================================================


// Your commented-out middleware (no changes needed)
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

// --- Mongoose Connection ---
mongoose.connect(process.env.MONGODB_URL).then(() => {
    console.log("MongoDB connected");
}).catch((err) => {
    console.log("Error in connecting to MongoDB", err);
});

// --- ROUTES ---
app.use("/api/student", studentrouter);
app.use("/api/course", courserouter);
app.use("/api/reviews", authMiddleware, reviewrouter); 
app.use("/api", uploadRouter); 

// --- Server Listen ---
app.listen(5000, () => {
    console.log("Server is running on port 5000");
});