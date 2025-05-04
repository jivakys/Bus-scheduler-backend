const express = require('express');
const router = express.Router();
const BusModel = require('../models/BusModel');
const { auth, adminAuth } = require('../middlewares/auth');
const ScheduleModel = require('../models/ScheduleModel');

// Get all buses with optional filters
router.get('/', auth, async (req, res) => {
  try {
    const { status, type } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (type) filter.type = type;
    
    const buses = await BusModel.find(filter)
      .sort({ createdAt: -1 });
    res.json(buses);
  } catch (error) {
    console.error('Error fetching buses:', error);
    res.status(500).json({ message: 'Error fetching buses', error: error.message });
  }
});

// Get a single bus by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const bus = await BusModel.findById(req.params.id);
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }
    res.json(bus);
  } catch (error) {
    console.error('Error fetching bus:', error);
    res.status(500).json({ message: 'Error fetching bus', error: error.message });
  }
});

// Create a new bus (admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    const { busNumber, capacity, type } = req.body;
    
    // Validate required fields
    if (!busNumber || !capacity || !type) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Check if bus number already exists
    const existingBus = await BusModel.findOne({ busNumber });
    if (existingBus) {
      return res.status(400).json({ message: 'Bus number already exists' });
    }
    
    const bus = new BusModel(req.body);
    await bus.save();
    res.status(201).json(bus);
  } catch (error) {
    console.error('Error creating bus:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', error: error.message });
    }
    res.status(500).json({ message: 'Error creating bus', error: error.message });
  }
});

// Update a bus (admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { busNumber } = req.body;
    
    // Check if new bus number already exists
    if (busNumber) {
      const existingBus = await BusModel.findOne({ busNumber, _id: { $ne: req.params.id } });
      if (existingBus) {
        return res.status(400).json({ message: 'Bus number already exists' });
      }
    }
    
    const bus = await BusModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }
    res.json(bus);
  } catch (error) {
    console.error('Error updating bus:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', error: error.message });
    }
    res.status(500).json({ message: 'Error updating bus', error: error.message });
  }
});

// Delete a bus (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    // Check if bus has any active schedules
    const bus = await BusModel.findById(req.params.id);
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }
    
    const hasActiveSchedules = await ScheduleModel.exists({
      bus: req.params.id,
      status: { $in: ['scheduled', 'in-progress'] }
    });
    
    if (hasActiveSchedules) {
      return res.status(400).json({ 
        message: 'Cannot delete bus with active schedules. Please cancel or complete the schedules first.' 
      });
    }
    
    await BusModel.findByIdAndDelete(req.params.id);
    res.json({ message: 'Bus deleted successfully' });
  } catch (error) {
    console.error('Error deleting bus:', error);
    res.status(500).json({ message: 'Error deleting bus', error: error.message });
  }
});

// Get bus availability for a specific date
router.get('/:id/availability', auth, async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: 'Date parameter is required' });
    }
    
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    const schedules = await ScheduleModel.find({
      bus: req.params.id,
      departureTime: { $gte: startDate, $lte: endDate }
    }).select('departureTime arrivalTime status');
    
    res.json({ schedules });
  } catch (error) {
    console.error('Error checking bus availability:', error);
    res.status(500).json({ message: 'Error checking bus availability', error: error.message });
  }
});

module.exports = router; 