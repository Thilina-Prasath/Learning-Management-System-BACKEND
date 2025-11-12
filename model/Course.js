import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, required: true, trim: true },
        instructor: { type: String, required: true, trim: true },
        category: { type: String, required: true, trim: true },
        duration: { type: String, trim: true },
        level: { type: String, default: "Beginner" },
        price: { type: Number, default: 0 },
        imageUrl: { type: String, default: "" }, // Not required, sent in body

        // --- SCHEMA UPDATED ---
        // Matches your frontend 'materials' array
        materials: [
            {
                topic: { type: String },
                pdfUrl: { type: String },
            },
        ],
        // Matches your frontend 'assignment' string
        assignment: { type: String, trim: true, default: "" },
        // --- END UPDATES ---
    },
    { timestamps: true }
);

const Course = mongoose.model('Course', courseSchema);
export default Course;