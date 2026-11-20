const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  role: { type: String, enum: ["student", "faculty"], default: "student" }
});

module.exports = mongoose.model("User", userSchema);