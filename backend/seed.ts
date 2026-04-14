import { db } from './src/patterns/SingletonDatabase';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Seeding UniMetrics database...');
  const hashedPassword = await bcrypt.hash('password', 10);

  // University
  let university = await db.university.findFirst();
  if (!university) {
    university = await db.university.create({
      data: { name: 'Global Tech University', address: '101 Tech Lane' }
    });
  }

  // Department
  let dept = await db.department.findFirst();
  if (!dept) {
    dept = await db.department.create({
      data: { name: 'Computer Science', universityId: university.id }
    });
  }

  // Courses (subjects)
  const upsertCourse = async (name: string, totalAssignments: number) => {
    let c = await db.course.findFirst({ where: { name } });
    if (!c) {
      c = await db.course.create({ data: { name, totalAssignments, departmentId: dept!.id } });
    }
    return c;
  };
  const sesd = await upsertCourse('SESD', 10);
  const aiml = await upsertCourse('AI/ML', 8);
  const math = await upsertCourse('Math', 12);
  const dva = await upsertCourse('DVA', 6);

  // Exam
  let exam = await db.exam.findFirst();
  if (!exam) {
    exam = await db.exam.create({ data: { semester: 1, universityId: university.id } });
  }

  // Users
  const upsertUser = async (name: string, email: string, role: string) => {
    return await db.user.upsert({
      where: { email },
      update: {},
      create: { name, email, password: hashedPassword, role, universityId: university!.id }
    });
  };
  const admin   = await upsertUser('Admin One', 'admin@gtu.edu', 'UNIVERSITY_ADMIN');
  const faculty = await upsertUser('Prof. Smith', 'smith@gtu.edu', 'FACULTY');
  const alice   = await upsertUser('Alice Walker', 'alice@gtu.edu', 'STUDENT');
  const bob     = await upsertUser('Bob Johnson', 'bob@gtu.edu', 'STUDENT');
  const carol   = await upsertUser('Carol Davis', 'carol@gtu.edu', 'STUDENT');
  const dan     = await upsertUser('Dan Martinez', 'dan@gtu.edu', 'STUDENT');

  // Grades (only insert if grades don't exist yet for that user)
  const insertGrades = async (student: any, dataMap: any[]) => {
    const existing = await db.grade.findFirst({ where: { userId: student.id } });
    if (!existing) {
      for (const [course, data] of dataMap) {
        await db.grade.create({ data: { userId: student.id, courseId: course.id, examId: exam!.id, ...data } });
      }
    }
  };

  await insertGrades(alice, [
    [sesd, { marks: 28, quizScore: 30, labScore: 35, assignmentsCompleted: 2, attendancePercent: 45 }],
    [aiml, { marks: 35, quizScore: 40, labScore: 30, assignmentsCompleted: 1, attendancePercent: 50 }],
    [math, { marks: 22, quizScore: 25, labScore: 20, assignmentsCompleted: 3, attendancePercent: 40 }],
    [dva,  { marks: 45, quizScore: 38, labScore: 42, assignmentsCompleted: 2, attendancePercent: 55 }],
  ]);

  await insertGrades(bob, [
    [sesd, { marks: 58, quizScore: 60, labScore: 55, assignmentsCompleted: 6, attendancePercent: 70 }],
    [aiml, { marks: 62, quizScore: 55, labScore: 60, assignmentsCompleted: 4, attendancePercent: 65 }],
    [math, { marks: 50, quizScore: 52, labScore: 48, assignmentsCompleted: 7, attendancePercent: 72 }],
    [dva,  { marks: 65, quizScore: 58, labScore: 63, assignmentsCompleted: 4, attendancePercent: 68 }],
  ]);

  await insertGrades(carol, [
    [sesd, { marks: 82, quizScore: 78, labScore: 85, assignmentsCompleted: 9, attendancePercent: 92 }],
    [aiml, { marks: 88, quizScore: 90, labScore: 86, assignmentsCompleted: 7, attendancePercent: 95 }],
    [math, { marks: 75, quizScore: 80, labScore: 78, assignmentsCompleted: 11, attendancePercent: 88 }],
    [dva,  { marks: 91, quizScore: 85, labScore: 88, assignmentsCompleted: 6, attendancePercent: 90 }],
  ]);

  await insertGrades(dan, [
    [sesd, { marks: 55, quizScore: 50, labScore: 48, assignmentsCompleted: 5, attendancePercent: 60 }],
    [aiml, { marks: 48, quizScore: 55, labScore: 52, assignmentsCompleted: 3, attendancePercent: 58 }],
    [math, { marks: 70, quizScore: 65, labScore: 68, assignmentsCompleted: 8, attendancePercent: 75 }],
    [dva,  { marks: 60, quizScore: 62, labScore: 58, assignmentsCompleted: 4, attendancePercent: 63 }],
  ]);

  // Risk Profiles (only if they don't exist)
  for (const student of [alice, bob, carol, dan]) {
    const existing = await db.riskProfile.findFirst({ where: { userId: student.id } });
    if (!existing) {
      const grades = await db.grade.findMany({ where: { userId: student.id }, include: { course: true }});
      if (grades.length > 0) {
        let total = 0;
        for (const g of grades) {
          const assignRate = g.course.totalAssignments > 0 ? (g.assignmentsCompleted / g.course.totalAssignments) * 100 : 0;
          const composite = g.marks * 0.35 + g.quizScore * 0.15 + g.labScore * 0.15 + assignRate * 0.20 + g.attendancePercent * 0.15;
          total += composite;
        }
        const avg = total / grades.length;
        const level = avg >= 70 ? 'LOW' : avg >= 50 ? 'MEDIUM' : 'HIGH';
        
        await db.riskProfile.create({ data: { userId: student.id, riskScore: Math.round(avg), riskLevel: level } });

        if (level === 'HIGH') {
          await db.alert.create({ data: { userId: student.id, message: `${student.name} has a HIGH risk score of ${Math.round(avg)}. Immediate attention required.`, severity: 'HIGH', isRead: false } });
        } else if (level === 'MEDIUM') {
          await db.alert.create({ data: { userId: student.id, message: `${student.name} is at MEDIUM risk (score: ${Math.round(avg)}). Consider monitoring.`, severity: 'MEDIUM', isRead: false } });
        }
      }
    }
  }

  console.log('✅ Seeding complete!');
}

main().catch((e) => {
  console.error("SEEDING CRASHED:", e);
  process.exit(1);
}).finally(() => db.$disconnect());
