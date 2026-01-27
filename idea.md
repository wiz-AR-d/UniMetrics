# UniMetrics – Multi-Tenant Academic Performance Intelligence System

## 📌 Problem Statement

Universities and colleges struggle to:

- Identify students at academic risk early
- Detect performance gaps across departments
- Monitor semester-wise trends
- Track attendance impact on grades
- Evaluate faculty performance objectively
- Generate actionable institutional insights

Existing systems only store marks — they do not generate intelligence.

---

## 🎯 Solution Overview

UniMetrics is a multi-tenant SaaS-based Academic Performance Intelligence System designed for universities and colleges.

It enables multiple universities to register on the platform and independently manage:

- Departments
- Courses
- Students
- Faculty
- Exams
- Attendance
- Grades
- Risk profiles

The system analyzes academic data to:

- Compute CGPA
- Detect backlog risks
- Identify low attendance risks
- Predict academic probation
- Generate alerts
- Provide institutional analytics dashboards

---

## 🏛 Multi-Tenant Architecture

UniMetrics supports multiple universities within a single system.

Each university's data is isolated using `university_id` across all major entities.

All database queries are scoped to:

WHERE university_id = currentUser.universityId

This ensures strict tenant isolation.

---

## 👥 User Roles

1. Super Admin (Platform Level)
2. University Admin
3. Faculty
4. Student

---

## 🚀 Core Features

### 1️⃣ Academic Performance Engine
- Credit-based CGPA calculation
- Semester performance comparison
- Backlog detection

### 2️⃣ Risk Detection Engine
- Low CGPA risk detection
- Low attendance risk detection
- Repeated backlog risk
- Academic probation alerts

### 3️⃣ Institutional Analytics
- Department-wise performance comparison
- Pass percentage trends
- Faculty effectiveness metrics

### 4️⃣ Alert & Notification System
- Automatic alerts for at-risk students
- Faculty notifications
- Admin alerts

---

## 🧠 Design Patterns Used

- Strategy Pattern → Risk calculation strategies
- Factory Pattern → Assessment creation
- Observer Pattern → Risk alert notifications
- Singleton Pattern → Analytics engine instance

---

## 🏗 Backend Architecture (Node + Express + TypeScript)

Layered Architecture:

Controller → Service → Repository → Database

Principles Applied:
- Encapsulation
- Abstraction via interfaces
- Polymorphism via strategies
- Inheritance via base User model

---

## 🛠 Tech Stack

Backend:
- Node.js
- Express.js
- TypeScript
- PostgreSQL
- Prisma ORM

Frontend:
- React
