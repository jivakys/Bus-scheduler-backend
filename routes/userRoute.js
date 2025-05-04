const express = require('express');
const router = express.Router();
const UserModel = require('../models/UserModel');
const { adminAuth } = require('../middlewares/auth');

// Get all users (admin only)
router.get('/', adminAuth, async (req, res) => {
    try {
        console.log('Fetching all users...');
        const users = await UserModel.find().select('-password');
        console.log('Users found:', users.length);
        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ 
            message: 'Error fetching users', 
            error: error.message 
        });
    }
});

// Get a single user (admin only)
router.get('/:id', adminAuth, async (req, res) => {
    try {
        console.log('Fetching user:', req.params.id);
        const user = await UserModel.findById(req.params.id).select('-password');
        if (!user) {
            console.log('User not found:', req.params.id);
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ 
            message: 'Error fetching user', 
            error: error.message 
        });
    }
});

// Update a user (admin only)
router.put('/:id', adminAuth, async (req, res) => {
    try {
        console.log('Updating user:', req.params.id);
        const { username, email, role, status } = req.body;
        
        const user = await UserModel.findById(req.params.id);
        if (!user) {
            console.log('User not found for update:', req.params.id);
            return res.status(404).json({ message: 'User not found' });
        }

        // Update user fields
        if (username) user.username = username;
        if (email) user.email = email;
        if (role) user.role = role;
        if (status) user.status = status;

        await user.save();
        const updatedUser = await UserModel.findById(user._id).select('-password');
        res.status(200).json(updatedUser);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ 
            message: 'Error updating user', 
            error: error.message 
        });
    }
});

// Delete a user (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
    try {
        console.log('Deleting user:', req.params.id);
        const user = await UserModel.findById(req.params.id);
        if (!user) {
            console.log('User not found for deletion:', req.params.id);
            return res.status(404).json({ message: 'User not found' });
        }

        await user.deleteOne();
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ 
            message: 'Error deleting user', 
            error: error.message 
        });
    }
});

module.exports = router; 