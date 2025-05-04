const express = require('express');
const router = express.Router();
const StopModel = require('../models/StopModel');
const { auth } = require('../middlewares/auth');

// Get all stops
router.get('/', auth, async (req, res) => {
  try {
    const stops = await StopModel.find();
    res.json(stops);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single stop
router.get('/:id', auth, async (req, res) => {
  try {
    const stop = await StopModel.findById(req.params.id);
    if (!stop) {
      return res.status(404).json({ message: 'Stop not found' });
    }
    res.json(stop);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new stop
router.post('/', auth, async (req, res) => {
  try {
    const stop = new StopModel(req.body);
    await stop.save();
    res.status(201).json(stop);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a stop
router.put('/:id', auth, async (req, res) => {
  try {
    const stop = await StopModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!stop) {
      return res.status(404).json({ message: 'Stop not found' });
    }
    res.json(stop);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a stop
router.delete('/:id', auth, async (req, res) => {
  try {
    const stop = await StopModel.findByIdAndDelete(req.params.id);
    if (!stop) {
      return res.status(404).json({ message: 'Stop not found' });
    }
    res.json({ message: 'Stop deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 