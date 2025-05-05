const express = require('express');
const router = express.Router();
const ScheduleModel = require('../models/ScheduleModel');
const BusModel = require('../models/BusModel');
const RouteModel = require('../models/RouteModel');
const { auth, adminAuth } = require('../middlewares/auth');

// Get all schedules with optional filters
router.get('/', auth, async (req, res) => {
  try {
    const { date, status, bus, route } = req.query;
    const filter = {};
    
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      filter.departureTime = { $gte: startDate, $lte: endDate };
    }
    if (status) filter.status = status;
    if (bus) filter.bus = bus;
    if (route) filter.route = route;
    
    const schedules = await ScheduleModel.find(filter)
      .populate('bus', 'busNumber capacity type')
      .populate('route', 'routeNumber startPoint endPoint')
      .sort({ departureTime: 1 });
    
    res.json(schedules);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ message: 'Error fetching schedules', error: error.message });
  }
});

// Get a single schedule with populated data
router.get('/:id', auth, async (req, res) => {
  try {
    const schedule = await ScheduleModel.findById(req.params.id)
      .populate('bus', 'busNumber capacity type')
      .populate('route', 'routeNumber startPoint endPoint stops');
    
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    res.json(schedule);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ message: 'Error fetching schedule', error: error.message });
  }
});

// Create a new schedule (admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    const { bus, route, departureTime, arrivalTime } = req.body;
    
    // Validate required fields
    if (!bus || !route || !departureTime || !arrivalTime) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Check if bus exists and is available
    const busExists = await BusModel.findById(bus);
    if (!busExists) {
      return res.status(404).json({ message: 'Bus not found' });
    }
    if (busExists.status !== 'active') {
      return res.status(400).json({ message: 'Bus is not active' });
    }
    
    // Check if route exists
    const routeExists = await RouteModel.findById(route);
    if (!routeExists) {
      return res.status(404).json({ message: 'Route not found' });
    }
    
    // Check for schedule conflicts
    const hasConflict = await ScheduleModel.exists({
      bus,
      $or: [
        {
          departureTime: { $lte: arrivalTime },
          arrivalTime: { $gte: departureTime }
        }
      ],
      status: { $in: ['scheduled', 'in-progress'] }
    });
    
    if (hasConflict) {
      return res.status(400).json({ message: 'Schedule conflict detected' });
    }
    
    const schedule = new ScheduleModel({
      ...req.body,
      seatsAvailable: busExists.capacity
    });
    
    await schedule.save();
    
    // Populate the created schedule
    const populatedSchedule = await ScheduleModel.findById(schedule._id)
      .populate('bus', 'busNumber capacity type')
      .populate('route', 'routeNumber startPoint endPoint');
    
    res.status(201).json(populatedSchedule);
  } catch (error) {
    console.error('Error creating schedule:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', error: error.message });
    }
    res.status(500).json({ message: 'Error creating schedule', error: error.message });
  }
});

// Update a schedule (admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const schedule = await ScheduleModel.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    
    // Prevent updates to completed or cancelled schedules
    if (schedule.status === 'completed' || schedule.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot update completed or cancelled schedule' });
    }
    
    // Check for schedule conflicts if time is being updated
    if (req.body.departureTime || req.body.arrivalTime) {
      const hasConflict = await ScheduleModel.exists({
        bus: schedule.bus,
        _id: { $ne: schedule._id },
        $or: [
          {
            departureTime: { $lte: req.body.arrivalTime || schedule.arrivalTime },
            arrivalTime: { $gte: req.body.departureTime || schedule.departureTime }
          }
        ],
        status: { $in: ['scheduled', 'in-progress'] }
      });
      
      if (hasConflict) {
        return res.status(400).json({ message: 'Schedule conflict detected' });
      }
    }
    
    const updatedSchedule = await ScheduleModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('bus', 'busNumber capacity type')
    .populate('route', 'routeNumber startPoint endPoint');
    
    res.json(updatedSchedule);
  } catch (error) {
    console.error('Error updating schedule:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', error: error.message });
    }
    res.status(500).json({ message: 'Error updating schedule', error: error.message });
  }
});

// Delete a schedule (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const schedule = await ScheduleModel.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    
    // Prevent deletion of in-progress or completed schedules
    if (schedule.status === 'in-progress' || schedule.status === 'completed') {
      return res.status(400).json({ message: 'Cannot delete in-progress or completed schedule' });
    }
    
    await ScheduleModel.findByIdAndDelete(req.params.id);
    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ message: 'Error deleting schedule', error: error.message });
  }
});

// Get schedules for a specific date range
router.get('/date-range', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }
    
    const schedules = await ScheduleModel.find({
      departureTime: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    })
    .populate('bus', 'busNumber capacity type')
    .populate('route', 'routeNumber startPoint endPoint')
    .sort({ departureTime: 1 });
    
    res.json(schedules);
  } catch (error) {
    console.error('Error fetching schedules by date range:', error);
    res.status(500).json({ message: 'Error fetching schedules', error: error.message });
  }
});

module.exports = router; 