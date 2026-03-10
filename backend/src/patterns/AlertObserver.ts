import { db } from './SingletonDatabase';

interface Observer {
  update(userId: number, riskLevel: string, riskScore: number): Promise<void>;
}

export class AlertObserver implements Observer {
  async update(userId: number, riskLevel: string, riskScore: number): Promise<void> {
    if (riskLevel === 'HIGH' || riskLevel === 'MEDIUM') {
      const user = await db.user.findUnique({ where: { id: userId } });
      await db.alert.create({
        data: {
          userId,
          message: `${user?.name ?? 'Student'} risk level has changed to ${riskLevel} (score: ${riskScore.toFixed(1)}). Please review their academic profile.`,
          severity: riskLevel,
          isRead: false,
        }
      });
    }
  }
}

export class RiskSubject {
  private observers: Observer[] = [];

  addObserver(observer: Observer) {
    this.observers.push(observer);
  }

  async notifyObservers(userId: number, riskLevel: string, riskScore: number) {
    for (const observer of this.observers) {
      await observer.update(userId, riskLevel, riskScore);
    }
  }
}
