# UniMetrics – Multi-Tenant Academic Performance Intelligence System

## 📌 Problem Statement

Universities struggle to:
- Identify students at academic risk **early** and across multiple subjects
- Track granular per-subject performance (exams, quizzes, labs, assignments, attendance)
- Manage assignment workload consistently across entire cohorts
- Generate automated, intelligent alerts when students decline
- Provide admin/faculty with a unified analytical dashboard

Existing systems only store marks — they do not generate intelligence.

---

## 🎯 Solution Overview

UniMetrics is a full-stack Academic Performance Intelligence Platform built with Node.js, Express, TypeScript, PostgreSQL, Prisma ORM, and React.

It enables Universities to independently manage:
- Students, Faculty, and Admins (role-based access)
- Departments, Courses/Subjects, Exams
- Per-subject grade entry (Exam, Quiz, Lab, Assignments, Attendance)
- Real-time multi-factor risk scoring and automated alerts

---

## 👥 User Roles

| Role | Permissions |
|---|---|
| **Super Admin** | Platform-level control |
| **University Admin** | Full control including Subject Settings |
| **Faculty** | Student management, score entry, risk/alerts view |
| **Student** | View-only (login enabled) |

---

## 🚀 Core Features

### 1️⃣ Authentication
- JWT-based stateless authentication
- bcryptjs password hashing
- Protected route middleware

### 2️⃣ Student Management
- Add / delete students (cascade deletes all related data)
- Edit academic records per subject via tabbed modal

### 3️⃣ Multi-Factor Risk Engine
Composite score = weighted average across all subjects:
- **Exam / Mid-term** → 35%
- **Quiz Score** → 15%
- **Lab / Practical** → 15%
- **Assignment Completion** (completed / total × 100) → 20%
- **Attendance %** → 15%

Risk Levels: ≥70 → LOW | 50–69 → MEDIUM | <50 → HIGH

### 4️⃣ Subject Settings (Global Assignment Control)
- Admin sets `totalAssignments` per subject (SESD, AI/ML, Math, DVA)
- Change takes effect for **all students** globally
- Risk engine reads new total automatically on next score save

### 5️⃣ Risk Assessment Dashboard
- Risk distribution: HIGH / MEDIUM / LOW counts
- Per-student expandable drilldown showing every subject's composite score
- Weakest factor detection per student

### 6️⃣ Notifications Inbox
- Auto-generated alerts when risk worsens
- Mark individual or all alerts as read
- Color-coded by severity (HIGH / MEDIUM / LOW)

---

## 🧠 Design Patterns (SESD)

| Pattern | Class | Purpose |
|---|---|---|
| **Singleton** | `SingletonDatabase` | Single shared Prisma client |
| **Strategy** | `MultiFactorRiskStrategy` + `RiskEngine` | Pluggable risk calculation algorithm |
| **Observer** | `RiskSubject` + `AlertObserver` | Trigger alerts when risk level changes |
| **Factory** | `UserFactory` | Role-aware user creation with defaults |

---

## 🏗 Architecture

```
React (Vite + TypeScript)
  └── AuthContext + React Router v6
  └── Pages: Dashboard, Students, RiskAssessment, Notifications, SubjectSettings
  └── Components: Sidebar

Express (TypeScript)
  └── AuthController   → /api/auth/*
  └── PerformanceController → /api/students, /api/scores, /api/alerts, /api/courses, /api/risk-breakdown
  └── authMiddleware (JWT guard)
  └── PerformanceService → RiskEngine → MultiFactorRiskStrategy
  └── RiskSubject → AlertObserver

PostgreSQL (via Prisma ORM)
  └── Models: University, User, Department, Course, Exam, Grade, RiskProfile, Alert
```

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, TypeScript, React Router v6, Lucide React |
| Backend | Node.js, Express 5, TypeScript, tsx |
| ORM | Prisma v5 |
| Database | PostgreSQL |
| Auth | JSON Web Tokens (JWT) + bcryptjs |

---

## 📚 Tracked Subjects

| Subject | Default Total Assignments |
|---|---|
| SESD | 10 |
| AI/ML | 8 |
| Math | 12 |
| DVA | 6 |
