let currentUser = null;
let draftQuestions = [];
let activeExam = null;
let timerInterval = null;
let secondsLeft = 0;

async function loginUser() {
  const name = document.getElementById("username").value.trim();
  const role = document.getElementById("role").value;
  const msg = document.getElementById("loginMsg");

  if (!name) {
    msg.textContent = "Please enter your name.";
    return;
  }

  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, role })
  });
  const data = await res.json();

  if (!res.ok) {
    msg.textContent = data.error || "Login failed.";
    return;
  }

  currentUser = data;
  msg.textContent = "";
  document.getElementById("loginSection").classList.add("hidden");
  document.getElementById("appSection").classList.remove("hidden");
  document.getElementById("welcomeText").textContent =
    `Logged in as ${currentUser.name} (${currentUser.role.toUpperCase()}) `;

  const isFaculty = currentUser.role === "faculty";
  document.getElementById("facultySection").classList.toggle("hidden", !isFaculty);
  document.getElementById("analyticsButton").classList.toggle("hidden", !isFaculty);
  document.getElementById("analyticsSection").classList.add("hidden");

  loadExams();
  if (isFaculty) loadAnalytics();
}

function logoutUser() {
  clearInterval(timerInterval);
  currentUser = null;
  activeExam = null;
  document.getElementById("takeExamSection").classList.add("hidden");
  document.getElementById("analyticsSection").classList.add("hidden");
  document.getElementById("appSection").classList.add("hidden");
  document.getElementById("loginSection").classList.remove("hidden");
}

function addQuestionToDraft() {
  const questionText = document.getElementById("qText").value.trim();
  const options = [
    document.getElementById("opt0").value.trim(),
    document.getElementById("opt1").value.trim(),
    document.getElementById("opt2").value.trim(),
    document.getElementById("opt3").value.trim()
  ];
  const correctOption = Number(document.getElementById("correctOpt").value);

  if (!questionText || options.some((o) => !o)) {
    document.getElementById("facultyMsg").textContent = "Fill question and all 4 options.";
    return;
  }

  draftQuestions.push({ questionText, options, correctOption });
  document.getElementById("draftInfo").textContent =
    `Questions added in draft: ${draftQuestions.length}`;
  document.getElementById("facultyMsg").textContent = "";
  ["qText", "opt0", "opt1", "opt2", "opt3"].forEach((id) => (document.getElementById(id).value = ""));
}

async function saveExam() {
  const title = document.getElementById("examTitle").value.trim();
  const durationMinutes = Number(document.getElementById("examDuration").value);
  const msg = document.getElementById("facultyMsg");

  if (!title || draftQuestions.length === 0) {
    msg.textContent = "Enter an exam title and add at least one question.";
    return;
  }

  const res = await fetch("/api/exams", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, durationMinutes, questions: draftQuestions })
  });
  const data = await res.json();

  if (!res.ok) {
    msg.textContent = data.error || "Failed to save exam.";
    return;
  }

  draftQuestions = [];
  document.getElementById("examTitle").value = "";
  document.getElementById("draftInfo").textContent = "";
  msg.textContent = `Exam "${data.title}" created successfully.`;
  loadExams();
}

async function loadExams() {
  const res = await fetch("/api/exams");
  const exams = await res.json();
  const list = document.getElementById("examList");
  list.innerHTML = exams.length ? "" : "<p>No exams available yet.</p>";

  exams.forEach((exam) => {
    const div = document.createElement("div");
    div.innerHTML = `
      <strong>${exam.title}</strong> (${exam.durationMinutes} min, ${exam.questions.length} Qs)
      ${currentUser && currentUser.role === "student"
        ? `<button onclick="startExam('${exam._id}')">Start Exam</button>`
        : ""}
    `;
    list.appendChild(div);
  });
}

async function startExam(examId) {
  if (!currentUser || currentUser.role !== "student") return;

  const res = await fetch(`/api/exams/${examId}`);
  const exam = await res.json();
  if (!res.ok) return alert(exam.error);

  activeExam = exam;
  document.getElementById("takeExamSection").classList.remove("hidden");
  document.getElementById("activeExamTitle").textContent = exam.title;
  document.getElementById("resultMsg").textContent = "";

  const container = document.getElementById("questionsContainer");
  container.innerHTML = "";
  exam.questions.forEach((q, qIdx) => {
    const qDiv = document.createElement("div");
    qDiv.style.marginBottom = "12px";
    qDiv.innerHTML = `<p><strong>Q${qIdx + 1}. ${q.questionText}</strong></p>`;
    q.options.forEach((opt, oIdx) => {
      qDiv.innerHTML += `
        <label>
          <input type="radio" name="q_${qIdx}" value="${oIdx}" /> ${opt}
        </label><br/>
      `;
    });
    container.appendChild(qDiv);
  });

  clearInterval(timerInterval);
  secondsLeft = exam.durationMinutes * 60;
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    secondsLeft -= 1;
    updateTimerDisplay();
    if (secondsLeft <= 0) {
      clearInterval(timerInterval);
      submitExam();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const secs = String(secondsLeft % 60).padStart(2, "0");
  document.getElementById("timerDisplay").textContent = `${mins}:${secs}`;
}

async function submitExam() {
  if (!currentUser || currentUser.role !== "student" || !activeExam) return;
  clearInterval(timerInterval);

  const answers = activeExam.questions.map((_, qIdx) => {
    const checked = document.querySelector(`input[name="q_${qIdx}"]:checked`);
    return checked ? Number(checked.value) : -1;
  });

  const res = await fetch(`/api/exams/${activeExam._id}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      studentName: currentUser ? currentUser.name : "Anonymous",
      answers
    })
  });
  const data = await res.json();

  if (res.ok) {
    document.getElementById("resultMsg").textContent =
      `Submitted! Score: ${data.score} / ${data.total}`;
  }
}

async function loadAnalytics() {
  if (!currentUser || currentUser.role !== "faculty") {
    document.getElementById("analyticsSection").classList.add("hidden");
    return;
  }

  const res = await fetch("/api/results");
  const report = await res.json();
  const section = document.getElementById("analyticsSection");
  const container = document.getElementById("analyticsContainer");
  section.classList.remove("hidden");

  container.innerHTML = report.length ? "" : "<p>No results yet.</p>";
  report.forEach((item) => {
    const rows = item.results
      .map((r) => `<li>${r.studentName}: ${r.score}/${r.total}</li>`)
      .join("");
    container.innerHTML += `
      <p><strong>${item.title}</strong> — Attempts: ${item.attempts} | Avg Score: ${item.averageScore}</p>
      <ul>${rows || "<li>No attempts</li>"}</ul>
    `;
  });
}