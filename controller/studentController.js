import Student from "../model/student.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

// Ensure the JWT secret key is loaded
const JWT_SECRET = process.env.JWT_KEY;

// --- REGISTER USER ---
export async function registerUser(req, res) {
  try {
    // Removed 'course' from destructuring to match your final student.js schema
    const { firstName, lastName, email, password, role } = req.body;

    // 1. Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: "All required fields must be provided." });
    }

    // 2. Security Check: Admin registration logic
    if (role === "admin") {
        // This initial admin check is better handled by a separate Admin setup route 
        // or a manual process, as relying on req.user during a non-authenticated
        // registration request is complex and usually unsecured.
        // For basic registration, ensure you have a check if *any* admin exists.
        
        // If you require *only* a logged-in admin to create other admins,
        // you MUST place the authMiddleware and adminMiddleware BEFORE this route in studentRouter.js,
        // but this breaks the general public signup flow. 
        
        // For simplicity and security, we'll assume only the first registration can be 'admin'
        // OR that 'admin' role is set by a separate protected admin route.
        
        // **If you still want a basic check:**
        // If a role is provided as 'admin', enforce it must be done by an existing admin.
        if (req.user && req.user.role !== "admin") {
            return res.status(403).json({ message: "Admin roles can only be created by an existing Admin." });
        }
        // If the admin already exists, and this request is not coming from a logged-in admin, reject it.
        const adminExists = await Student.findOne({ role: "admin" });
        if (adminExists && (!req.user || req.user.role !== "admin")) {
             return res.status(403).json({ message: "The first Admin is already registered. Only existing Admins can create more." });
        }
    }


    // 3. Check for existing email
    const existing = await Student.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // 4. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Create and save new user
    const newStudent = new Student({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      // Removed: course field to match student.js schema
      role: role && role.toLowerCase() === "admin" ? "admin" : "student", // Ensure role is set correctly
    });

    await newStudent.save();

    // 6. Respond
    return res.status(201).json({ 
        message: "Student registered successfully", 
        user: {
            id: newStudent._id,
            firstName: newStudent.firstName,
            lastName: newStudent.lastName,
            email: newStudent.email,
            role: newStudent.role
        }
    });
  } catch (err) {
    console.error("Error registering Student:", err.message);
    return res.status(500).json({ message: "Error registering Student", error: err.message });
  }
}

// ----------------------------------------------------------------

// --- LOGIN USER ---
export async function loginUser(req, res) {
  try {
    const { email, password } = req.body;
    
    // 1. Find user by email
    const student = await Student.findOne({ email });

    if (!student) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2. Check if user is blocked
    if (student.isBlocked) {
        return res.status(403).json({ message: "Your account is blocked. Please contact the administrator." });
    }

    // 3. Compare password
    const isPasswordCorrect = await bcrypt.compare(password, student.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 4. Create and sign JWT token
    if (!JWT_SECRET) {
        throw new Error("JWT_KEY environment variable is not set.");
    }
    
    const token = jwt.sign(
      {
        id: student._id,
        role: student.role,
        firstName: student.firstName, 
        lastName: student.lastName,    
        email: student.email,          
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // 5. Respond
    return res.status(200).json({
      message: "Login successful",
      token,
      role: student.role,
      user: { // Returning user details for immediate client use
          id: student._id,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          role: student.role
      }
    });
  } catch (err) {
    console.error("Error logging in:", err.message);
    return res.status(500).json({ message: "Error logging in", error: err.message });
  }
}


// In your studentController.js
export async function getProfile(req, res) {
    try {
        // req.user should be set by your auth middleware
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const student = await Student.findById(req.user.id).select('-password');
        
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        res.json(student);
    } catch (error) {
        console.error("GetProfile Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

// ----------------------------------------------------------------

// --- ADMIN CHECK (Utility Function) ---
export function isAdmin(req) {
  return req.user && req.user.role === "admin";
}