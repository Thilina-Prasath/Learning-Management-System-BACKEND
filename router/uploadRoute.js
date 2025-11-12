import express from "express";
import multer from "multer";
import supabase from "../config/supabaseClient.js";
import { authMiddleware, adminMiddleware } from "../middleware/authMiddleware.js";

const uploadRouter = express.Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// === ROUTE FOR IMAGES ===
uploadRouter.post(
  "/course-images",
  authMiddleware,
  adminMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      console.log("📸 Image upload request received");
      
      const file = req.file;
      if (!file) {
        console.log("❌ No image file in request");
        return res.status(400).json({ error: "No image uploaded" });
      }

      console.log("📝 Image details:", {
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype
      });

      const fileName = `courses/${Date.now()}-${file.originalname}`;
      
      console.log("☁️ Uploading to Supabase bucket: course-images");
      const { data, error } = await supabase.storage
        .from("course-images")
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          cacheControl: "3600"
        });

      if (error) {
        console.error("❌ Supabase upload error:", error);
        return res.status(500).json({ 
          error: "Image upload failed", 
          details: error.message 
        });
      }

      console.log("✅ Upload successful:", data);

      const { data: publicUrl } = supabase.storage
        .from("course-images")
        .getPublicUrl(fileName);

      console.log("🔗 Public URL:", publicUrl.publicUrl);

      res.json({ imageUrl: publicUrl.publicUrl });
    } catch (err) {
      console.error("💥 Image Upload Error:", err);
      res.status(500).json({ 
        error: "Image upload failed", 
        details: err.message 
      });
    }
  }
);

// === ROUTE FOR PDFs ===
uploadRouter.post(
  "/course-pdfs",
  authMiddleware,
  adminMiddleware,
  upload.single("pdf"),
  async (req, res) => {
    try {
      console.log("📄 PDF upload request received");
      
      const file = req.file;
      if (!file) {
        console.log("❌ No PDF file in request");
        return res.status(400).json({ error: "No PDF uploaded" });
      }

      console.log("📝 PDF details:", {
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype
      });

      // Validate file type
      if (file.mimetype !== 'application/pdf') {
        console.log("❌ Invalid file type:", file.mimetype);
        return res.status(400).json({ error: "Only PDF files are allowed" });
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        console.log("❌ File too large:", file.size);
        return res.status(400).json({ error: "PDF must be less than 10MB" });
      }

      const fileName = `pdfs/${Date.now()}-${file.originalname}`;
      
      console.log("☁️ Uploading to Supabase bucket: course-pdfs");
      const { data, error } = await supabase.storage
        .from("course-pdfs")
        .upload(fileName, file.buffer, {
          contentType: "application/pdf",
          cacheControl: "3600",
          upsert: false
        });

      if (error) {
        console.error("❌ Supabase upload error:", error);
        return res.status(500).json({ 
          error: "PDF upload failed", 
          details: error.message,
          hint: "Check if 'course-pdfs' bucket exists and has proper permissions"
        });
      }

      console.log("✅ Upload successful:", data);

      const { data: publicUrl } = supabase.storage
        .from("course-pdfs")
        .getPublicUrl(fileName);

      console.log("🔗 Public URL:", publicUrl.publicUrl);

      res.json({ 
        pdfUrl: publicUrl.publicUrl,
        fileName: file.originalname,
        size: file.size
      });
    } catch (err) {
      console.error("💥 PDF Upload Error:", err);
      res.status(500).json({ 
        error: "PDF upload failed", 
        details: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    }
  }
);

export default uploadRouter;