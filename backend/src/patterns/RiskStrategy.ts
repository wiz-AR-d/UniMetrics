import { db } from './SingletonDatabase';

// Strategy Interface
export interface RiskCalculationStrategy {
  calculateRisk(userId: number): Promise<{ score: number; level: string }>;
}

// Concrete Strategy 1: Low Grades Risk
export class LowGradeRiskStrategy implements RiskCalculationStrategy {
  async calculateRisk(userId: number): Promise<{ score: number; level: string }> {
    const grades = await db.grade.findMany({ where: { userId } });
    if (grades.length === 0) return { score: 0, level: 'LOW' };

    const average = grades.reduce((acc, curr) => acc + curr.marks, 0) / grades.length;
    
    let score = 0;
    if (average < 40) score = 80;
    else if (average < 60) score = 50;
    else score = 10;

    let level = 'LOW';
    if (score >= 80) level = 'HIGH';
    else if (score >= 50) level = 'MEDIUM';

    return { score, level };
  }
}

// Strategy Context Engine
export class RiskEngine {
  private strategy: RiskCalculationStrategy;

  constructor(strategy: RiskCalculationStrategy) {
    this.strategy = strategy;
  }

  setStrategy(strategy: RiskCalculationStrategy) {
    this.strategy = strategy;
  }

  async evaluateRisk(userId: number) {
    return await this.strategy.calculateRisk(userId);
  }
}
