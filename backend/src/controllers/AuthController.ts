import { Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { db } from '../patterns/SingletonDatabase';

const JWT_SECRET = process.env.JWT_SECRET || 'unimetrics_secret_key';

export class AuthController {

  static signup = async (req: Request, res: Response) => {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        res.status(400).json({ success: false, error: 'Name, email and password are required' });
        return;
      }

      const existingUser = await db.user.findUnique({ where: { email } });
      if (existingUser) {
        res.status(400).json({ success: false, error: 'Email already in use' });
        return;
      }

      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(password, salt);

      // All new sign-ups are Faculty — students are managed as data records only
      const user = await db.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'FACULTY',
          universityId: 1
        }
      });

      const token = jwt.sign(
        { id: user.id, role: user.role },
        JWT_SECRET,
        { expiresIn: '1d' }
      );

      res.status(201).json({
        success: true,
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  static login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ success: false, error: 'Email and password are required' });
        return;
      }

      const user = await db.user.findUnique({ where: { email } });
      if (!user || user.role === 'STUDENT') {
        // Students are data records only — they cannot log in
        res.status(401).json({ success: false, error: 'Invalid email or password' });
        return;
      }

      const isMatch = bcrypt.compareSync(password, user.password);
      if (!isMatch) {
        res.status(401).json({ success: false, error: 'Invalid email or password' });
        return;
      }

      const token = jwt.sign(
        { id: user.id, role: user.role },
        JWT_SECRET,
        { expiresIn: '1d' }
      );

      res.status(200).json({
        success: true,
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };
}
