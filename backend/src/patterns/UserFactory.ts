import { db } from './SingletonDatabase';

export class UserFactory {
  /**
   * Factory method to create different user roles
   */
  public static async createUser(data: { name: string, email: string, password: string, role: string, universityId: number }) {
    // We could have specific classes for each user type, but for Prisma integration we just ensure
    // accurate validation and creation according to the role.
    
    if (!['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'FACULTY', 'STUDENT'].includes(data.role)) {
      throw new Error(`Invalid role type: ${data.role}`);
    }

    const user = await db.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: data.password, // In prod, we'd hash here
        role: data.role,
        universityId: data.universityId
      }
    });

    return user;
  }
}
