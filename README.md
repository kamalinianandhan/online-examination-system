# Online Examination System Using Scrum Method

A minimal web-based Online Examination System developed using the Scrum process to let students take timed exams digitally and allow faculty to create exams, view results, and check basic analytics.

## Problem Statement & Objectives
Traditional or manual exam handling can be slow to evaluate and hard to track. The objective of this project is to build an incremental Online Examination System across Scrum sprints covering user roles, exam/question creation, timed test submission, automatic scoring, and basic reporting[cite: 1].

## Features / Modules Implemented
- **User Login & Role Selection:** Simple student and faculty login flow[cite: 1].
- **Exam & Question Creation:** Faculty can create an exam with a title, duration, multiple-choice questions, options, and correct answers[cite: 1].
- **Timed Online Test & Auto-Evaluation:** Students can take an exam with a countdown timer and receive automatic score calculation upon submission[cite: 1].
- **Results & Analytics:** View exam attempts, student scores, and average scores[cite: 1].

## Technology Stack & Tools Used
- **Frontend:** HTML, CSS, JavaScript[cite: 1]
- **Backend:** Node.js, Express.js[cite: 1]
- **Database:** MongoDB (with optional in-memory fallback when no database URI is configured)[cite: 1]
- **Version Control & IDE:** Git, GitHub, Visual Studio Code[cite: 1]

## Prerequisites & Installation Steps
1. Install **Node.js** (and optionally **MongoDB** / MongoDB Atlas).
2. Clone the repository and open the project folder:
   ```bash
   git clone <YOUR_GITHUB_REPO_URL>
   cd online-exam-system
