const express = require('express');
const router = express.Router();
const Route = require('../models/Route');
const { auth } = require('../middlewares/auth');

// Get all routes
router.get('/', auth, async (req, res) => {
  try {
    const routes = await Route.find();
    res.json(routes);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single route
router.get('/:id', auth, async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }
    res.json(route);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new route
router.post('/', auth, async (req, res) => {
  try {
    const route = new Route(req.body);
    await route.save();
    res.status(201).json(route);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a route
router.put('/:id', auth, async (req, res) => {
  try {
    const route = await Route.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }
    res.json(route);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a route
router.delete('/:id', auth, async (req, res) => {
  try {
    const route = await Route.findByIdAndDelete(req.params.id);
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }
    res.json({ message: 'Route deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Search routes by stop name
router.post('/search', auth, async (req, res) => {
    try {
        const { searchTerm, date, time } = req.body;
        
        if (!searchTerm) {
            return res.status(400).json({ message: 'Search term is required' });
        }

        // Build search query
        let query = {
            $or: [
                { from: { $regex: searchTerm, $options: 'i' } },
                { to: { $regex: searchTerm, $options: 'i' } }
            ],
            status: 'active'
        };

        // Add date filter if provided
        if (date) {
            const startDate = new Date(date);
            const endDate = new Date(date);
            endDate.setDate(endDate.getDate() + 1);
            
            query.departureTime = {
                $gte: startDate,
                $lt: endDate
            };
        }

        // Add time filter if provided
        if (time) {
            const [hours, minutes] = time.split(':');
            const timeFilter = new Date();
            timeFilter.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            
            if (!query.departureTime) {
                query.departureTime = {};
            }
            query.departureTime.$gte = timeFilter;
        }

        // Execute search
        const routes = await Route.find(query)
            .populate('bus', 'busNumber busName capacity type')
            .sort({ departureTime: 1 });

        if (!routes || routes.length === 0) {
            return res.status(404).json({ message: 'No routes found matching your search' });
        }

        res.json(routes);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ message: 'Error searching routes', error: error.message });
    }
});

module.exports = router; 