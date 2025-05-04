const jwt = require('jsonwebtoken');
const UserModel = require('../models/UserModel');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    const verified = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = verified;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token verification failed, authorization denied' });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('No token provided for admin route');
      return res.status(401).json({ message: 'No token provided' });
    }

    console.log('Admin token received:', token.substring(0, 10) + '...');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Admin token decoded:', decoded);

    if (decoded.role !== 'admin') {
      console.log('User is not an admin');
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      console.log('Admin user not found');
      return res.status(401).json({ message: 'User not found' });
    }

    if (user.role !== 'admin') {
      console.log('User role is not admin');
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { auth, adminAuth }; 