import { db } from './SingletonDatabase';
import bcrypt from 'bcryptjs';

type UserRole = 'SUPER_ADMIN' | 'UNIVERSITY_ADMIN' | 'FACULTY' | 'STUDENT';

interface UserCreationData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  universityId: number;
}

// Abstract Product
interface IUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

// Creator (Factory)
export class UserFactory {
  private static readonly VALID_ROLES: UserRole[] = [
    'SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'FACULTY', 'STUDENT'
  ];

  /**
   * Factory Method – creates a user of the correct role type with
   * role-specific defaults and hashed password.
   */
  public static async createUser(data: UserCreationData): Promise<IUser> {
    if (!UserFactory.VALID_ROLES.includes(data.role)) {
      throw new Error(`Invalid role: ${data.role}. Must be one of: ${UserFactory.VALID_ROLES.join(', ')}`);
    }

    // Hash password before creation
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await db.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role,
        universityId: data.universityId
      }
    });

    // If student, create default risk profile
    if (data.role === 'STUDENT') {
      await db.riskProfile.create({
        data: { userId: user.id, riskScore: 0, riskLevel: 'LOW' }
      });
    }

    return user;
  }

  /** Convenience factory methods for specific roles */
  public static createStudent(name: string, email: string, password: string, universityId: number) {
    return UserFactory.createUser({ name, email, password, role: 'STUDENT', universityId });
  }

  public static createFaculty(name: string, email: string, password: string, universityId: number) {
    return UserFactory.createUser({ name, email, password, role: 'FACULTY', universityId });
  }

  public static createAdmin(name: string, email: string, password: string, universityId: number) {
    return UserFactory.createUser({ name, email, password, role: 'UNIVERSITY_ADMIN', universityId });
  }
}
