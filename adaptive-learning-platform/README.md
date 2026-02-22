# Adaptive Learning Platform 🎓

An intelligent, AI-driven educational platform designed to personalize the learning experience for students and provide deep analytics for instructors.

## 🚀 Overview

The Adaptive Learning Platform leverages advanced Machine Learning models (GNN, Causal inference, PEARL Meta-learning, and CQL Policy) combined with generative AI (AWS Bedrock / Claude 3.5 Sonnet) to create a highly responsive learning environment.

### Key Features Implemented:
*   **Priority 1: Core Learning Loop:** Interactive `ContentViewer`, `AdaptiveQuiz` that scales difficulty in real-time based on student performance, and a `TutorChat` widget providing Socratic-style hints when a student struggles.
*   **Priority 2: Engagement & Motivation:** Interactive **3D Knowledge Graph** tracking concept mastery, a visual **Learning Journey Sequence**, Gamified **Achievements**, and collaborative **Study Groups**.
*   **Priority 3: Instructor Dashboard:** Comprehensive `TeacherDashboard` highlighting at-risk students and knowledge bottlenecks, and a `ContentManager` CMS for instructors to deploy new materials.
*   **Priority 4 & 5: Advanced AI & Real-Time Analytics:** Real-time WebSocket **Early Warning System** to alert teachers of engagement drop-offs, and **Multimodal Content Generation** (A/B testing, text-to-speech, and auto-generated visual aids).

## 🏗 Architecture

The platform is built with a modern, cloud-native backend and a responsive React frontend:

*   **Frontend:** React 18, React Router v6, Material-UI (MUI), Redux Toolkit, Recharts, React-Force-Graph.
*   **Backend:** Python 3.10, FastAPI (Local / Mock API), AWS API Gateway & Lambda (Production).
*   **AI / ML:** AWS SageMaker (Graph Neural Networks, Offline RL), AWS Bedrock (Claude 3.5 Sonnet).
*   **Databases:** DynamoDB (State, Logs, Content), AWS Neptune (Knowledge Graph), Amazon S3.

## 🛠 Getting Started

To run the full stack locally:

### 1. Start the Backend API (FastAPI)
```bash
# Enter the project repository
cd adaptive-learning-platform
source venv/bin/activate
python main.py
# The API will be available at http://localhost:8000
```

### 2. Start the Frontend Application (React)
```bash
# In a new terminal tab
cd adaptive-learning-platform/frontend
npm install
npm start
# The app will open at http://localhost:3000 (or 3006 if 3000 is busy)
```

## 🗺 Application Routes

### Student Views
*   \`/dashboard/:studentId\` - The primary Student HUD (Progress, Recommendations, Achievements).
*   \`/learn/:contentId\` - The active learning environment (Content Viewer & Adaptive Quiz).
*   \`/knowledge-graph\` - 3D visual representation of a student's concept mastery.
*   \`/progress\` - Temporal charts showing mastery growth over time.

### Instructor & Admin Views
*   \`/teacher\` - Analytics dashboard for instructors tracking cohort performance.
*   \`/content-manager\` - CMS allowing teachers to publish content and configure AI variations.

## 🤖 E2E Automated Verification

The core learning loop was thoroughly verified via an automated E2E test using the Browser Subagent:
1.  **Dashboard Load**: Verified student mastery metrics and recommendation rendering.
2.  **Content Launch**: Verified the transition to \`/learn/\` and background engagement tracking.
3.  **Adaptive Quiz & Tutor Interaction**: Verified adaptive difficulty scaling and the successful trigger of the Generative AI Tutor overlay upon submitting incorrect answers.
4.  **Knowledge Graph Update**: Verified interactions successfully recalculated the mastery levels and updated the Knowledge Graph visualization in real-time.

---
*Built with React, Python, and AWS capabilities.*
