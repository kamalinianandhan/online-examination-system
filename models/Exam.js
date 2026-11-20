const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctOption: { type: Number, required: true, min: 0, max: 3 }
});

const resultSchema = new mongoose.Schema({
  studentName: { type: String, required: true },
  score: { type: Number, required: true },
  total: { type: Number, required: true },
  submittedAt: { type: Date, default: Date.now }
});

const examSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  durationMinutes: { type: Number, required: true, min: 1, default: 5 },
  questions: {
    type: [questionSchema],
    validate: [(v) => v.length > 0, "At least one question is required"]
  },
  results: [resultSchema]
});

module.exports = mongoose.model("Exam", examSchema);