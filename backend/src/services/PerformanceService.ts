import { db } from '../patterns/SingletonDatabase';
import { RiskEngine, MultiFactorRiskStrategy } from '../patterns/RiskStrategy';
import { RiskSubject, AlertObserver } from '../patterns/AlertObserver';

const riskSubject = new RiskSubject();
riskSubject.addObserver(new AlertObserver());

export class PerformanceService {
  public static async processScores(
    userId: number,
    courseId: number,
    examId: number,
    data: {
      marks: number;
      quizScore: number;
      labScore: number;
      assignmentsCompleted: number;
      attendancePercent: number;
    }
  ) {
    // 1. Create or update grade record (upsert by unique constraint)
    await db.grade.upsert({
      where: { userId_courseId_examId: { userId, courseId, examId } },
      update: data,
      create: { userId, courseId, examId, ...data }
    });

    // 2. Evaluate risk across ALL subjects using MultiFactor Strategy
    const engine = new RiskEngine(new MultiFactorRiskStrategy());
    const riskAssessment = await engine.evaluateRisk(userId);

    // 3. Get previous risk level to detect worsening
    const previousProfile = await db.riskProfile.findUnique({ where: { userId } });
    const previousLevel = previousProfile?.riskLevel ?? 'LOW';

    // 4. Update or create Risk Profile
    await db.riskProfile.upsert({
      where: { userId },
      update: { riskScore: riskAssessment.score, riskLevel: riskAssessment.level },
      create: { userId, riskScore: riskAssessment.score, riskLevel: riskAssessment.level }
    });

    // 5. Trigger alert only if risk level has worsened or is HIGH/MEDIUM
    const levelOrder: Record<string, number> = { LOW: 0, MEDIUM: 1, HIGH: 2 };
    const hasWorsened = levelOrder[riskAssessment.level] > levelOrder[previousLevel];
    if (hasWorsened || riskAssessment.level === 'HIGH') {
      await riskSubject.notifyObservers(userId, riskAssessment.level, riskAssessment.score);
    }

    return riskAssessment;
  }
}
