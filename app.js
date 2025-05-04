const express = require("express");
const cors = require("cors");
const { connection } = require("./config/db");
const authRoute = require("./routes/authRoute");
const busRoute = require("./routes/busRoute");
const routeRoute = require("./routes/routeRoute");
const scheduleRoute = require("./routes/scheduleRoute");
const stopRoute = require("./routes/stopRoute");
const adminRoute = require("./routes/adminRoute");
const userRoute = require("./routes/userRoute");
const path = require('path');
const mongoose = require('mongoose');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Log all requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// API Routes - These should come before static file serving
app.use("/api/auth", authRoute);
app.use("/api/buses", busRoute);
app.use("/api/routes", routeRoute);
app.use("/api/schedules", scheduleRoute);
app.use("/api/stops", stopRoute);
app.use("/api/admin", adminRoute);
app.use("/api/users", userRoute);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        message: "Something went wrong!",
        error: err.message 
    });
});

// 404 handler
app.use((req, res) => {
    console.log('404 - Route not found:', req.url);
    res.status(404).json({ message: "Route not found" });
});

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/bus-scheduler', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 