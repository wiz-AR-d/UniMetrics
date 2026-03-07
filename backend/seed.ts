import { db } from './src/patterns/SingletonDatabase';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Seeding UniMetrics database...');
  const hashedPassword = await bcrypt.hash('password', 10);

  // University
  const university = await db.university.create({
    data: { name: 'Global Tech University', address: '101 Tech Lane' }
  });

  // Department
  const dept = await db.department.create({
    data: { name: 'Computer Science', universityId: university.id }
  });

  // Courses (subjects)
  const sesd = await db.course.create({ data: { name: 'SESD', totalAssignments: 10, departmentId: dept.id } });
  const aiml = await db.course.create({ data: { name: 'AI/ML', totalAssignments: 8, departmentId: dept.id } });
  const math = await db.course.create({ data: { name: 'Math', totalAssignments: 12, departmentId: dept.id } });
  const dva  = await db.course.create({ data: { name: 'DVA', totalAssignments: 6, departmentId: dept.id } });

  // Exam
  const exam = await db.exam.create({ data: { semester: 1, universityId: university.id } });

  // Users
  const admin   = await db.user.create({ data: { name: 'Admin One', email: 'admin@gtu.edu', password: hashedPassword, role: 'UNIVERSITY_ADMIN', universityId: university.id } });
  const faculty = await db.user.create({ data: { name: 'Prof. Smith', email: 'smith@gtu.edu', password: hashedPassword, role: 'FACULTY', universityId: university.id } });
  const alice   = await db.user.create({ data: { name: 'Alice Walker', email: 'alice@gtu.edu', password: hashedPassword, role: 'STUDENT', universityId: university.id } });
  const bob     = await db.user.create({ data: { name: 'Bob Johnson', email: 'bob@gtu.edu', password: hashedPassword, role: 'STUDENT', universityId: university.id } });
  const carol   = await db.user.create({ data: { name: 'Carol Davis', email: 'carol@gtu.edu', password: hashedPassword, role: 'STUDENT', universityId: university.id } });
  const dan     = await db.user.create({ data: { name: 'Dan Martinez', email: 'dan@gtu.edu', password: hashedPassword, role: 'STUDENT', universityId: university.id } });

  // Seed grades for Alice (struggling – HIGH risk)
  for (const [course, data] of [
    [sesd, { marks: 28, quizScore: 30, labScore: 35, assignmentsCompleted: 2, attendancePercent: 45 }],
    [aiml, { marks: 35, quizScore: 40, labScore: 30, assignmentsCompleted: 1, attendancePercent: 50 }],
    [math, { marks: 22, quizScore: 25, labScore: 20, assignmentsCompleted: 3, attendancePercent: 40 }],
    [dva,  { marks: 45, quizScore: 38, labScore: 42, assignmentsCompleted: 2, attendancePercent: 55 }],
  ] as any[]) {
    await db.grade.create({ data: { userId: alice.id, courseId: course.id, examId: exam.id, ...data } });
  }

  // Seed grades for Bob (mediocre – MEDIUM risk)
  for (const [course, data] of [
    [sesd, { marks: 58, quizScore: 60, labScore: 55, assignmentsCompleted: 6, attendancePercent: 70 }],
    [aiml, { marks: 62, quizScore: 55, labScore: 60, assignmentsCompleted: 4, attendancePercent: 65 }],
    [math, { marks: 50, quizScore: 52, labScore: 48, assignmentsCompleted: 7, attendancePercent: 72 }],
    [dva,  { marks: 65, quizScore: 58, labScore: 63, assignmentsCompleted: 4, attendancePercent: 68 }],
  ] as any[]) {
    await db.grade.create({ data: { userId: bob.id, courseId: course.id, examId: exam.id, ...data } });
  }

  // Seed grades for Carol (good – LOW risk)
  for (const [course, data] of [
    [sesd, { marks: 82, quizScore: 78, labScore: 85, assignmentsCompleted: 9, attendancePercent: 92 }],
    [aiml, { marks: 88, quizScore: 90, labScore: 86, assignmentsCompleted: 7, attendancePercent: 95 }],
    [math, { marks: 75, quizScore: 80, labScore: 78, assignmentsCompleted: 11, attendancePercent: 88 }],
    [dva,  { marks: 91, quizScore: 85, labScore: 88, assignmentsCompleted: 6, attendancePercent: 90 }],
  ] as any[]) {
    await db.grade.create({ data: { userId: carol.id, courseId: course.id, examId: exam.id, ...data } });
  }

  // Seed grades for Dan (borderline – MEDIUM risk)
  for (const [course, data] of [
    [sesd, { marks: 55, quizScore: 50, labScore: 48, assignmentsCompleted: 5, attendancePercent: 60 }],
    [aiml, { marks: 48, quizScore: 55, labScore: 52, assignmentsCompleted: 3, attendancePercent: 58 }],
    [math, { marks: 70, quizScore: 65, labScore: 68, assignmentsCompleted: 8, attendancePercent: 75 }],
    [dva,  { marks: 60, quizScore: 62, labScore: 58, assignmentsCompleted: 4, attendancePercent: 63 }],
  ] as any[]) {
    await db.grade.create({ data: { userId: dan.id, courseId: course.id, examId: exam.id, ...data } });
  }

  // Create risk profiles by computing composite score
  const students = [alice, bob, carol, dan];
  const gradeData: Record<number, typeof alice & { grades: any[] }> = {} as any;

  for (const student of students) {
    const grades = await db.grade.findMany({
      where: { userId: student.id },
      include: { course: true }
    });

    let total = 0;
    for (const g of grades) {
      const assignRate = g.course.totalAssignments > 0 ? (g.assignmentsCompleted / g.course.totalAssignments) * 100 : 0;
      const composite = g.marks * 0.35 + g.quizScore * 0.15 + g.labScore * 0.15 + assignRate * 0.20 + g.attendancePercent * 0.15;
      total += composite;
    }
    const avg = grades.length > 0 ? total / grades.length : 0;
    const level = avg >= 70 ? 'LOW' : avg >= 50 ? 'MEDIUM' : 'HIGH';

    await db.riskProfile.create({ data: { userId: student.id, riskScore: Math.round(avg), riskLevel: level } });

    if (level === 'HIGH') {
      await db.alert.create({ data: { userId: student.id, message: `${student.name} has a HIGH risk score of ${Math.round(avg)}. Immediate attention required.`, severity: 'HIGH', isRead: false } });
    } else if (level === 'MEDIUM') {
      await db.alert.create({ data: { userId: student.id, message: `${student.name} is at MEDIUM risk (score: ${Math.round(avg)}). Consider monitoring.`, severity: 'MEDIUM', isRead: false } });
    }
  }

  console.log('✅ Seeding complete!');
}

main().catch(console.error).finally(() => db.$disconnect());
