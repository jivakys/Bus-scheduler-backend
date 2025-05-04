const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { createServer } = require("http");
const { Server } = require("socket.io");
const { connection } = require("./config/db");
const path = require("path");
require("dotenv").config();

const app = express();
const httpServer = createServer(app);

// CORS configuration
app.use(
  cors({
    origin: [
      "http://localhost:5000",
      "http://127.0.0.1:5000",
      "http://127.0.0.1:5500",
      "http://localhost:5500",
      "http://127.0.0.1:3000",
      "http://localhost:3000",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  })
);

const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5000", "http://127.0.0.1:5000"],

    methods: ["GET", "POST"],
  },
});

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  express.static(path.join(__dirname, "../Frontend"), {
    setHeaders: (res, path) => {
      if (path.endsWith(".js")) {
        res.setHeader("Content-Type", "application/javascript");
      }
    },
  })
);

// Database connection
connection
  .then(() => console.log("Connected to Database"))
  .catch((err) => console.error("Database connection error:", err));

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("A client connected");

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// Routes
app.use("/api/auth", require("./routes/authRoute"));
app.use("/api/buses", require("./routes/busRoute"));
app.use("/api/routes", require("./routes/routeRoute"));
app.use("/api/stops", require("./routes/stopRoute"));
app.use("/api/schedules", require("./routes/scheduleRoute"));
app.use("/api/admin", require("./routes/adminRoute"));
app.use("/api/users", require("./routes/userRoute"));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// Serve the main HTML file for all routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../Frontend/index.html"));
});

const PORT = 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
