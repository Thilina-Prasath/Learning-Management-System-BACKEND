import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({ 
  email: {
    type: String,
    required: true,
    unique: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["student", "admin"], 
    default: "student",
    required: true,
  },
  isBlocked: {
    type: Boolean,
    default: false,
    required: true,
  },
  img: {
    type: String,
    default: "https://avatar.iran.liara.run/public/6",
  },
}, {
  timestamps: true 
});

const Student = mongoose.model("Student", studentSchema); 
export default Student;