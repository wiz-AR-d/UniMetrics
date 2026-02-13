import { db } from './src/patterns/SingletonDatabase';
import bcrypt from 'bcryptjs';

async function main() {
  const hash = await bcrypt.hash('password', 10);
  await db.user.updateMany({
    data: { password: hash }
  });
  console.log("Passwords updated");
}
main().finally(() => db.$disconnect());
