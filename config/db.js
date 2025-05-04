const mongoose = require("mongoose");
require("dotenv").config();

const connection = mongoose.connect(
  process.env.MONGODB_URL || "mongodb://localhost:27017/bus-scheduler",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

module.exports = { connection };
