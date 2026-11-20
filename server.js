require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const examRoutes = require("./routes/examRoutes");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/api", examRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (MONGO_URI && MONGO_URI.startsWith("mongodb")) {
  mongoose
    .connect(MONGO_URI)
    .then(() => {
      console.log("Connected to MongoDB");
      app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
    })
    .catch((err) => {
      console.error("MongoDB connection error:", err.message);
      process.exit(1);
    });
} else {
  console.log("No MONGO_URI found — running in temporary in-memory mode");
  app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
}