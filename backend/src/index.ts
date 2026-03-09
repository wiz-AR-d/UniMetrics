import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PerformanceController } from './controllers/PerformanceController';
import { AuthController } from './controllers/AuthController';
import { GoogleAuthController } from './controllers/GoogleAuthController';
import { authMiddleware } from './middleware/authMiddleware';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ─── Public Routes ────────────────────────────────────
app.post('/api/auth/signup', AuthController.signup);
app.post('/api/auth/login',  AuthController.login);

// Google OAuth
app.get('/api/auth/google',          GoogleAuthController.redirect);
app.get('/api/auth/google/callback', GoogleAuthController.callback);

// ─── Protected Routes ────────────────────────────────
const auth = authMiddleware as any;

// Dashboard stats
app.get('/api/stats',    auth, PerformanceController.getStats);

// Scores (create/update triggers risk engine)
app.post('/api/scores',  auth, PerformanceController.uploadScores);

// Students
app.get('/api/students',          auth, PerformanceController.getStudents);
app.post('/api/students',         auth, PerformanceController.createStudent);
app.get('/api/students/:id',      auth, PerformanceController.getStudent);
app.delete('/api/students/:id',   auth, PerformanceController.deleteStudent);

// Alerts / Notifications
app.get('/api/alerts',              auth, PerformanceController.getAlerts);
app.patch('/api/alerts/read-all',   auth, PerformanceController.markAllRead);
app.patch('/api/alerts/:id/read',   auth, PerformanceController.markAlertRead);

// Courses / Subjects
app.get('/api/courses',                           auth, PerformanceController.getCourses);
app.patch('/api/courses/:id/assignments',         auth, PerformanceController.updateCourseTotalAssignments);

// Risk Assessment breakdown
app.get('/api/risk-breakdown', auth, PerformanceController.getRiskBreakdown);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ UniMetrics Backend running on http://localhost:${PORT}`);
});
