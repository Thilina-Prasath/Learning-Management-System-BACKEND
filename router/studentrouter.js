import express from 'express';
import { loginUser, registerUser } from '../controller/studentController.js';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware.js';
import Student from '../model/student.js';
import bcrypt from 'bcrypt';

const studentrouter = express.Router();

// --- AUTH ROUTES ---
studentrouter.post('/signup', registerUser);
studentrouter.post('/login', loginUser);

studentrouter.get('/admin/check', authMiddleware, adminMiddleware, (req, res) => {
  res.json({ message: "Welcome Admin!", user: req.user });
});

// --- PROFILE ROUTES ---

// Get user profile (Retrieves email, first name, last name)
studentrouter.get('/profile', authMiddleware, async (req, res) => {
  try {
    console.log("Fetching profile for user ID:", req.user.id);
    
    // Fetch user details, excluding the password
    const user = await Student.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user._id,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email,
      // Removed: profileImage field
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user profile
studentrouter.put('/profile', authMiddleware, async (req, res) => {
  try {
    console.log("Updating profile for user ID:", req.user.id);
    console.log("Update data:", req.body);
    
    // Only destructure allowed update fields (firstName, lastName, email)
    const { firstName, lastName, email } = req.body;
    
    const user = await Student.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields if provided
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (email !== undefined) user.email = email;
    
    // Removed: image update logic

    await user.save();

    res.json({
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      // Removed: profileImage field
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Change password
studentrouter.put('/change-password', authMiddleware, async (req, res) => {
  try {
    console.log("Password change request for user ID:", req.user.id);
    
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    const user = await Student.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash and save new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default studentrouter;