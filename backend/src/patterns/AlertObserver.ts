import { db } from './SingletonDatabase';

interface Observer {
  update(userId: number, riskLevel: string): Promise<void>;
}

export class AlertObserver implements Observer {
  async update(userId: number, riskLevel: string): Promise<void> {
    if (riskLevel === 'HIGH' || riskLevel === 'MEDIUM') {
      await db.alert.create({
        data: {
          userId,
          message: `URGENT: Student risk level is now ${riskLevel}. Immediate attention required.`,
        }
      });
      console.log(`Alert triggered for User ID: ${userId} for risk level: ${riskLevel}`);
    }
  }
}

export class RiskSubject {
  private observers: Observer[] = [];

  addObserver(observer: Observer) {
    this.observers.push(observer);
  }

  async notifyObservers(userId: number, riskLevel: string) {
    for (const observer of this.observers) {
      await observer.update(userId, riskLevel);
    }
  }
}
