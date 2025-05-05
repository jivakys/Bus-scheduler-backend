const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { createServer } = require("http");
const { Server } = require("socket.io");
const { connection } = require("./config/db");
const path = require("path");

const app = express();
const httpServer = createServer(app);

// CORS configuration for localhost
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Basic security
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
connection
  .then(() => console.log("Connected to Database"))
  .catch((err) => console.error("Database connection error:", err));

// Socket.io connection
io.on("connection", (socket) => {
  console.log("Client connected");
  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// API Routes
app.use("/api/auth", require("./routes/authRoute"));
app.use("/api/buses", require("./routes/busRoute"));
app.use("/api/routes", require("./routes/route"));
app.use("/api/stops", require("./routes/stopRoute"));
app.use("/api/schedules", require("./routes/scheduleRoute"));
app.use("/api/admin", require("./routes/adminRoute"));
app.use("/api/users", require("./routes/userRoute"));

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// Serve frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../Frontend/index.html"));
});

// Start server
const PORT = 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
