import { db } from './SingletonDatabase';

// Strategy Interface
interface RiskStrategy {
  evaluate(grades: GradeWithCourse[]): { score: number; level: string };
}

interface GradeWithCourse {
  marks: number;
  quizScore: number;
  labScore: number;
  assignmentsCompleted: number;
  attendancePercent: number;
  course: { totalAssignments: number };
}

// Multi-Factor Strategy (35% exam, 20% assignments, 15% quiz, 15% lab, 15% attendance)
export class MultiFactorRiskStrategy implements RiskStrategy {
  evaluate(grades: GradeWithCourse[]): { score: number; level: string } {
    if (grades.length === 0) return { score: 0, level: 'LOW' };

    let totalComposite = 0;
    for (const g of grades) {
      const assignRate = g.course.totalAssignments > 0
        ? (g.assignmentsCompleted / g.course.totalAssignments) * 100
        : 0;
      const composite =
        g.marks            * 0.35 +
        g.quizScore        * 0.15 +
        g.labScore         * 0.15 +
        assignRate         * 0.20 +
        g.attendancePercent * 0.15;
      totalComposite += composite;
    }
    const avg = totalComposite / grades.length;
    const score = Math.round(avg * 10) / 10;
    const level = avg >= 70 ? 'LOW' : avg >= 50 ? 'MEDIUM' : 'HIGH';
    return { score, level };
  }
}

// Risk Engine (Context)
export class RiskEngine {
  private strategy: RiskStrategy;

  constructor(strategy: RiskStrategy) {
    this.strategy = strategy;
  }

  async evaluateRisk(userId: number): Promise<{ score: number; level: string; breakdown: any[] }> {
    const grades = await db.grade.findMany({
      where: { userId },
      include: { course: true }
    });

    const result = this.strategy.evaluate(grades);

    // Compute per-subject breakdown for drilldown
    const breakdown = grades.map(g => {
      const assignRate = g.course.totalAssignments > 0
        ? Math.round((g.assignmentsCompleted / g.course.totalAssignments) * 100)
        : 0;
      const composite = Math.round(
        g.marks * 0.35 + g.quizScore * 0.15 + g.labScore * 0.15 +
        assignRate * 0.20 + g.attendancePercent * 0.15
      );
      return {
        subject: g.course.name,
        marks: g.marks,
        quizScore: g.quizScore,
        labScore: g.labScore,
        assignmentsCompleted: g.assignmentsCompleted,
        totalAssignments: g.course.totalAssignments,
        attendancePercent: g.attendancePercent,
        composite
      };
    });

    return { ...result, breakdown };
  }
}
