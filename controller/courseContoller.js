import Course from "../model/Course.js";
import { isAdmin } from "./studentController.js";
import supabase from "../config/supabaseClient.js";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";

const storage = multer.memoryStorage();
export const upload = multer({ storage });

// 🔹 Get courses (public & admin)
export async function getCourses(req, res) {
    try {
        console.log('getCourses called');

        // Check if user is authenticated and admin
        const userIsAdmin = req.user && isAdmin(req);

        let courses;
        if (userIsAdmin) {
            // Admin sees all courses
            courses = await Course.find();
            console.log(`Admin request: Found ${courses.length} courses (including unavailable)`);
        } else {
            // Public users see only available courses
            // NOTE: Your original logic to show all if none are 'isAvailable' is kept
            const availableCourses = await Course.find({ isAvailable: true });
            const allCourses = await Course.find();

            if (availableCourses.length === 0 && allCourses.length > 0) {
                courses = allCourses;
                console.log(`Public request: No isAvailable filter applied, showing all ${courses.length} courses`);
            } else {
                courses = availableCourses;
                console.log(`Public request: Found ${courses.length} available courses`);
            }
        }

        res.json(courses);
    } catch (err) {
        console.error("GetCourses Error:", err);
        res.status(500).json({ message: "Failed to get courses", error: err.message });
    }
}

// 🔹 Get single course by ID
export async function getCourseById(req, res) {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ message: "Course not found" });

        res.json(course);
    } catch (err) {
        console.error("GetCourseById Error:", err);
        res.status(500).json({ message: "Failed to get course", error: err.message });
    }
}

// 🔹 Create course
// --- THIS FUNCTION IS NOW CORRECT ---
export async function createCourse(req, res) {
    try {
        if (!isAdmin(req)) return res.status(403).json({ message: "Admin only" });

        // Destructure all data from the JSON body (NOT form-data)
        const {
            title,
            description,
            duration,
            level,
            category,
            instructor,
            price,
            imageUrl, // This now comes from the JSON body
            materials,  // This is the new array
            assignment  // This is the new string
        } = req.body;

        if (!title || !description) {
            return res.status(400).json({ message: "Title and description required" });
        }

        // Image upload logic is REMOVED from here
        // It is handled by /api/course-images

        const newCourse = new Course({
            title,
            description,
            duration,
            level,
            category,
            instructor,
            price: parseFloat(price) || 0,
            imageUrl: imageUrl || "", // Use the URL from the body
            materials: materials || [], // Save the materials array
            assignment: assignment || ""  // Save the assignment string
        });

        await newCourse.save();
        res.status(201).json({ message: "Course created", course: newCourse });
    } catch (err) {
        console.error("CreateCourse Error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
}

// 🔹 Update course
export async function updateCourse(req, res) {
    try {
        if (!isAdmin(req)) return res.status(403).json({ message: "Admin only" });

        // This works perfectly now because req.body (JSON)
        // matches your updated Mongoose schema
        const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!course) return res.status(404).json({ message: "Course not found" });

        res.json({ message: "Course updated", course });
    } catch (err) {
        console.error("UpdateCourse Error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
}

// 🔹 Delete course
export async function deleteCourse(req, res) {
    try {
        if (!isAdmin(req)) return res.status(403).json({ message: "Admin only" });

        const deleted = await Course.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: "Course not found" });

        res.json({ message: "Course deleted" });
    } catch (err) {
        console.error("DeleteCourse Error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
}

// 🔹 Upload course image (separate endpoint)
export async function uploadCourseImage(req, res) {
    try {
        if (!isAdmin(req)) return res.status(403).json({ message: "Admin only" });

        if (!req.file) {
            return res.status(400).json({ message: "No image file uploaded" });
        }

        const fileExt = req.file.originalname.split(".").pop();
        const fileName = `${uuidv4()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from("course-images")
            .upload(fileName, req.file.buffer, { contentType: req.file.mimetype });

        if (uploadError) {
            console.error("Image upload error:", uploadError);
            return res.status(400).json({ message: "Image upload failed", error: uploadError.message });
        }

        const { data } = supabase.storage.from("course-images").getPublicUrl(fileName);

        res.json({
            message: "Image uploaded successfully",
            imageUrl: data.publicUrl
        });
    } catch (err) {
        console.error("UploadCourseImage Error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
}

// 🔹 Upload course PDF (separate endpoint)
export async function uploadCoursePdf(req, res) {
    try {
        if (!isAdmin(req)) return res.status(403).json({ message: "Admin only" });

        if (!req.file) {
            return res.status(400).json({ message: "No PDF file uploaded" });
        }

        // Validate file type
        if (req.file.mimetype !== "application/pdf") {
            return res.status(400).json({ message: "Only PDF files are allowed" });
        }

        // Generate unique filename
        const fileName = `${uuidv4()}.pdf`;

        // Upload to Supabase storage
        const { error: uploadError } = await supabase.storage
            .from("course-pdfs")
            .upload(fileName, req.file.buffer, {
                contentType: "application/pdf",
                cacheControl: "3600"
            });

        if (uploadError) {
            console.error("PDF upload error:", uploadError);
            return res.status(400).json({
                message: "PDF upload failed",
                error: uploadError.message
            });
        }

        // Get public URL
        const { data } = supabase.storage.from("course-pdfs").getPublicUrl(fileName);

        res.json({
            message: "PDF uploaded successfully",
            pdfUrl: data.publicUrl,
            filename: fileName
        });
    } catch (err) {
        console.error("UploadCoursePdf Error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
}