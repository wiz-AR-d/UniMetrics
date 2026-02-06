import { Request, Response } from 'express';
import { PerformanceService } from '../services/PerformanceService';
import { db } from '../patterns/SingletonDatabase';

export class PerformanceController {
  
  static async uploadScores(req: Request, res: Response) {
    try {
      const { userId, courseId, examId, marks } = req.body;
      const result = await PerformanceService.processScores(Number(userId), Number(courseId), Number(examId), Number(marks));
      res.status(200).json({ success: true, riskAssessment: result, message: "Scores processed successfully" });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getAlerts(req: Request, res: Response) {
    try {
      const alerts = await db.alert.findMany({ include: { user: true }, orderBy: { createdAt: 'desc' } });
      res.status(200).json({ success: true, alerts });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getStudents(req: Request, res: Response) {
    try {
      const students = await db.user.findMany({ 
        where: { role: 'STUDENT' },
        include: { riskProfile: true, grades: true }
      });
      res.status(200).json({ success: true, students });
    } catch(err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}
