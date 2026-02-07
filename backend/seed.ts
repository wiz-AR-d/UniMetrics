import { db } from './src/patterns/SingletonDatabase';

async function main() {
  console.log('Seeding database...');
  await db.university.create({
    data: {
      id: 1,
      name: 'Global Tech University',
      address: '101 Tech Lane',
      departments: {
        create: [
          {
            id: 1,
            name: 'Computer Science',
            courses: {
              create: [
                { id: 1, name: 'Data Structures' },
                { id: 2, name: 'Algorithms' }
              ]
            }
          }
        ]
      },
      exams: {
        create: [
          { id: 1, semester: 1 }
        ]
      }
    }
  });

  await db.user.createMany({
    data: [
      { id: 1, name: 'Admin One', email: 'admin@gtu.edu', password: 'password', role: 'UNIVERSITY_ADMIN', universityId: 1 },
      { id: 2, name: 'Prof. Smith', email: 'smith@gtu.edu', password: 'password', role: 'FACULTY', universityId: 1 },
      { id: 3, name: 'Alice Walker', email: 'alice@gtu.edu', password: 'password', role: 'STUDENT', universityId: 1 },
      { id: 4, name: 'Bob Johnson', email: 'bob@gtu.edu', password: 'password', role: 'STUDENT', universityId: 1 }
    ]
  });

  console.log('Done!');
}

main().catch(console.error).finally(() => db.$disconnect());
