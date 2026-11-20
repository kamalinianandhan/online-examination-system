const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const User = require("../models/User");
const Exam = require("../models/Exam");

// Temporary in-memory arrays when MongoDB is not connected
const memoryUsers = [];
const memoryExams = [];

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

router.post("/login", async (req, res) => {
  try {
    const { name, role } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Name is required." });
    }
    const validRole = role === "faculty" ? "faculty" : "student";
    const cleanName = name.trim();

    if (!isDbConnected()) {
      let user = memoryUsers.find((u) => u.name === cleanName && u.role === validRole);
      if (!user) {
        user = { _id: String(Date.now()), name: cleanName, role: validRole };
        memoryUsers.push(user);
      }
      return res.json(user);
    }

    let user = await User.findOne({ name: cleanName, role: validRole });
    if (!user) {
      user = await User.create({ name: cleanName, role: validRole });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Login failed." });
  }
});

router.post("/exams", async (req, res) => {
  try {
    const { title, durationMinutes, questions } = req.body;
    if (!title || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: "Exam title and at least one question are required." });
    }

    if (!isDbConnected()) {
      const exam = {
        _id: String(Date.now()),
        title: title.trim(),
        durationMinutes: Number(durationMinutes) || 5,
        questions,
        results: []
      };
      memoryExams.push(exam);
      return res.status(201).json(exam);
    }

    const exam = await Exam.create({
      title: title.trim(),
      durationMinutes: Number(durationMinutes) || 5,
      questions
    });
    res.status(201).json(exam);
  } catch (err) {
    res.status(400).json({ error: err.message || "Could not create exam." });
  }
});

router.get("/exams", async (req, res) => {
  try {
    if (!isDbConnected()) {
      const safeExams = memoryExams.map(({ _id, title, durationMinutes, questions, results }) => ({
        _id,
        title,
        durationMinutes,
        questions: questions.map(({ questionText, options }) => ({ questionText, options })),
        results
      }));
      return res.json(safeExams);
    }

    const exams = await Exam.find().select("-questions.correctOption");
    res.json(exams);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch exams." });
  }
});

router.get("/exams/:id", async (req, res) => {
  try {
    if (!isDbConnected()) {
      const found = memoryExams.find((e) => e._id === req.params.id);
      if (!found) return res.status(404).json({ error: "Exam not found." });
      return res.json({
        _id: found._id,
        title: found.title,
        durationMinutes: found.durationMinutes,
        questions: found.questions.map(({ questionText, options }) => ({ questionText, options }))
      });
    }

    const exam = await Exam.findById(req.params.id).select("-questions.correctOption");
    if (!exam) return res.status(404).json({ error: "Exam not found." });
    res.json(exam);
  } catch (err) {
    res.status(400).json({ error: "Invalid exam ID." });
  }
});

router.post("/exams/:id/submit", async (req, res) => {
  try {
    const { studentName, answers } = req.body;
    if (!studentName || !Array.isArray(answers)) {
      return res.status(400).json({ error: "Student name and answers are required." });
    }

    if (!isDbConnected()) {
      const exam = memoryExams.find((e) => e._id === req.params.id);
      if (!exam) return res.status(404).json({ error: "Exam not found." });

      let score = 0;
      exam.questions.forEach((q, idx) => {
        if (Number(answers[idx]) === Number(q.correctOption)) score += 1;
      });

      const resultEntry = {
        studentName: studentName.trim(),
        score,
        total: exam.questions.length,
        submittedAt: new Date()
      };
      exam.results.push(resultEntry);
      return res.json(resultEntry);
    }

    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ error: "Exam not found." });

    let score = 0;
    exam.questions.forEach((q, idx) => {
      if (Number(answers[idx]) === q.correctOption) score += 1;
    });

    const resultEntry = { studentName: studentName.trim(), score, total: exam.questions.length };
    exam.results.push(resultEntry);
    await exam.save();

    res.json(resultEntry);
  } catch (err) {
    res.status(500).json({ error: "Error evaluating exam." });
  }
});

router.get("/results", async (req, res) => {
  try {
    const exams = !isDbConnected() ? memoryExams : await Exam.find({}, "title results");
    const report = exams.map((exam) => {
      const count = exam.results.length;
      const avgScore =
        count > 0
          ? (exam.results.reduce((sum, r) => sum + r.score, 0) / count).toFixed(2)
          : 0;
      return {
        examId: exam._id,
        title: exam.title,
        attempts: count,
        averageScore: avgScore,
        results: exam.results
      };
    });
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: "Failed to load analytics." });
  }
});

module.exports = router;