import { Request, Response } from 'express';
import { PerformanceService } from '../services/PerformanceService';
import { RiskEngine, MultiFactorRiskStrategy } from '../patterns/RiskStrategy';
import { db } from '../patterns/SingletonDatabase';

export class PerformanceController {

  static async uploadScores(req: Request, res: Response) {
    try {
      const { userId, courseId, examId, marks, quizScore, labScore, assignmentsCompleted, attendancePercent } = req.body;
      const result = await PerformanceService.processScores(
        Number(userId), Number(courseId), Number(examId),
        {
          marks: Number(marks) || 0,
          quizScore: Number(quizScore) || 0,
          labScore: Number(labScore) || 0,
          assignmentsCompleted: Number(assignmentsCompleted) || 0,
          attendancePercent: Number(attendancePercent) || 0,
        }
      );
      res.status(200).json({ success: true, riskAssessment: result, message: 'Scores processed successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getAlerts(req: Request, res: Response) {
    try {
      const alerts = await db.alert.findMany({
        include: { user: true },
        orderBy: { createdAt: 'desc' }
      });
      res.status(200).json({ success: true, alerts });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async markAlertRead(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await db.alert.update({ where: { id: Number(id) }, data: { isRead: true } });
      res.status(200).json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async markAllRead(req: Request, res: Response) {
    try {
      await db.alert.updateMany({ data: { isRead: true } });
      res.status(200).json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getStudents(req: Request, res: Response) {
    try {
      const students = await db.user.findMany({
        where: { role: 'STUDENT' },
        include: {
          riskProfile: true,
          grades: { include: { course: true } }
        },
        orderBy: { name: 'asc' }
      });
      res.status(200).json({ success: true, students });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getStudent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const student = await db.user.findUnique({
        where: { id: Number(id) },
        include: {
          riskProfile: true,
          grades: { include: { course: true } }
        }
      });
      if (!student) {
        res.status(404).json({ success: false, error: 'Student not found' });
        return;
      }
      // Include risk breakdown
      const engine = new RiskEngine(new MultiFactorRiskStrategy());
      const riskAssessment = await engine.evaluateRisk(Number(id));
      res.status(200).json({ success: true, student, riskAssessment });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async createStudent(req: Request, res: Response) {
    try {
      const bcrypt = await import('bcryptjs');
      const { name, email, password, universityId } = req.body;
      const existing = await db.user.findUnique({ where: { email } });
      if (existing) {
        res.status(400).json({ success: false, error: 'Email already in use' });
        return;
      }
      const hashed = await bcrypt.default.hash(password || 'password', 10);
      const student = await db.user.create({
        data: { name, email, password: hashed, role: 'STUDENT', universityId: Number(universityId) || 1 }
      });
      res.status(201).json({ success: true, student });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async deleteStudent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await db.user.delete({ where: { id: Number(id) } });
      res.status(200).json({ success: true, message: 'Student deleted' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getCourses(req: Request, res: Response) {
    try {
      const courses = await db.course.findMany({ orderBy: { name: 'asc' } });
      res.status(200).json({ success: true, courses });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async updateCourseTotalAssignments(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { totalAssignments } = req.body;
      const course = await db.course.update({
        where: { id: Number(id) },
        data: { totalAssignments: Number(totalAssignments) }
      });
      res.status(200).json({ success: true, course, message: `Total assignments for ${course.name} updated to ${course.totalAssignments} for all students` });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getStats(req: Request, res: Response) {
    try {
      const [totalStudents, unreadAlerts, highRisk, allProfiles] = await Promise.all([
        db.user.count({ where: { role: 'STUDENT' } }),
        db.alert.count({ where: { isRead: false } }),
        db.riskProfile.count({ where: { riskLevel: 'HIGH' } }),
        db.riskProfile.findMany()
      ]);
      const avgScore = allProfiles.length > 0
        ? allProfiles.reduce((s, p) => s + p.riskScore, 0) / allProfiles.length
        : 0;
      res.status(200).json({ success: true, stats: { totalStudents, unreadAlerts, highRisk, avgScore: Math.round(avgScore) } });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getRiskBreakdown(req: Request, res: Response) {
    try {
      const students = await db.user.findMany({
        where: { role: 'STUDENT' },
        include: { riskProfile: true, grades: { include: { course: true } } }
      });
      const engine = new RiskEngine(new MultiFactorRiskStrategy());
      const breakdown = await Promise.all(students.map(async (s) => {
        const risk = await engine.evaluateRisk(s.id);
        return { id: s.id, name: s.name, email: s.email, ...risk };
      }));
      breakdown.sort((a, b) => a.score - b.score);
      res.status(200).json({ success: true, breakdown });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}
