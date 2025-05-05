const express = require("express");
const router = express.Router();
const { adminAuth } = require("../middlewares/auth");
const BusModel = require("../models/BusModel");
const RouteModel = require("../models/RouteModel");
const UserModel = require("../models/UserModel");
const ScheduleModel = require("../models/ScheduleModel");

// Get admin dashboard data
router.get("/dashboard", adminAuth, async (req, res) => {
  try {
    console.log("Admin dashboard request received");
    console.log("User:", req.user);
    console.log("Token:", req.token);

    if (!req.user || req.user.role !== "admin") {
      console.log("User is not an admin");
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    // Get total counts
    const [totalRoutes, totalBuses, totalUsers, activeBookings] =
      await Promise.all([
        RouteModel.countDocuments(),
        BusModel.countDocuments(),
        UserModel.countDocuments(),
        ScheduleModel.countDocuments({
          status: { $in: ["scheduled", "in-progress"] },
        }),
      ]);

    console.log("Counts retrieved:", {
      totalRoutes,
      totalBuses,
      totalUsers,
      activeBookings,
    });

    // Get recent routes with proper field selection
    const recentRoutes = await RouteModel.find()
      .select('routeNumber startPoint endPoint createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get recent bookings with proper population
    const recentBookings = await ScheduleModel.find()
      .populate({
        path: 'bus',
        select: 'busNumber'
      })
      .populate({
        path: 'route',
        select: 'routeNumber startPoint endPoint'
      })
      .sort({ createdAt: -1 })
      .limit(5);

    const responseData = {
      totalRoutes,
      totalBuses,
      totalUsers,
      activeBookings,
      recentRoutes: recentRoutes.map((route) => ({
        id: route._id,
        routeNumber: route.routeNumber,
        startPoint: route.startPoint,
        endPoint: route.endPoint,
        createdAt: route.createdAt,
      })),
      recentBookings: recentBookings.map((booking) => ({
        id: booking._id,
        busNumber: booking.bus?.busNumber || 'N/A',
        routeNumber: booking.route?.routeNumber || 'N/A',
        startPoint: booking.route?.startPoint || 'N/A',
        endPoint: booking.route?.endPoint || 'N/A',
        departureTime: booking.departureTime,
        arrivalTime: booking.arrivalTime,
        status: booking.status,
      })),
    };

    console.log("Sending response:", JSON.stringify(responseData, null, 2));

    res.setHeader("Content-Type", "application/json");
    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({
      message: "Error fetching dashboard data",
      error: error.message,
    });
  }
});

module.exports = router;
