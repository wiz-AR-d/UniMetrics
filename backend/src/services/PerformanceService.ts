import { db } from '../patterns/SingletonDatabase';
import { RiskEngine, LowGradeRiskStrategy } from '../patterns/RiskStrategy';
import { RiskSubject, AlertObserver } from '../patterns/AlertObserver';

const riskSubject = new RiskSubject();
riskSubject.addObserver(new AlertObserver());

export class PerformanceService {
  public static async processScores(userId: number, courseId: number, examId: number, marks: number) {
    // 1. Save grade
    await db.grade.create({
      data: {
        userId,
        courseId,
        examId,
        marks
      }
    });

    // 2. Evaluate Risk using Strategy pattern
    const engine = new RiskEngine(new LowGradeRiskStrategy());
    const riskAssessment = await engine.evaluateRisk(userId);

    // 3. Update or create Risk Profile
    await db.riskProfile.upsert({
      where: { userId },
      update: {
        riskScore: riskAssessment.score,
        riskLevel: riskAssessment.level
      },
      create: {
        userId,
        riskScore: riskAssessment.score,
        riskLevel: riskAssessment.level
      }
    });

    // 4. Trigger alert using Observer pattern
    await riskSubject.notifyObservers(userId, riskAssessment.level);

    return riskAssessment;
  }
}
