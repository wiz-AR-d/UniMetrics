import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import * as jwt from 'jsonwebtoken';
import { db } from '../patterns/SingletonDatabase';

const JWT_SECRET = process.env.JWT_SECRET || 'unimetrics_secret_key';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const oAuth2Client = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

export class GoogleAuthController {

  // Step 1 – Redirect user to Google's OAuth consent screen
  static redirect = (_req: Request, res: Response) => {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      res.status(500).send(`
        <html><body style="font-family:sans-serif;background:#0f172a;color:#fff;padding:2rem;">
          <h2>⚠️ Google OAuth not configured</h2>
          <p>Add <code>GOOGLE_CLIENT_ID</code> and <code>GOOGLE_CLIENT_SECRET</code> to <code>backend/.env</code></p>
          <a href="${FRONTEND_URL}/login" style="color:#4F46E5;">← Back to Login</a>
        </body></html>
      `);
      return;
    }

    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['profile', 'email'],
      prompt: 'select_account',
    });

    res.redirect(authUrl);
  };

  // Step 2 – Google redirects back here with ?code=...
  static callback = async (req: Request, res: Response) => {
    const { code, error } = req.query;

    if (error) {
      return res.redirect(`${FRONTEND_URL}/login?error=google_denied`);
    }

    if (!code || typeof code !== 'string') {
      return res.redirect(`${FRONTEND_URL}/login?error=missing_code`);
    }

    try {
      // Exchange authorization code for tokens
      const { tokens } = await oAuth2Client.getToken(code);
      oAuth2Client.setCredentials(tokens);

      // Get user profile from Google
      const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      });
      const googleUser = await userInfoRes.json() as {
        id: string;
        email: string;
        name: string;
        picture: string;
      };

      if (!googleUser.email) {
        return res.redirect(`${FRONTEND_URL}/login?error=no_email`);
      }

      // Block if this email already exists as a STUDENT (data-only record)
      const studentCheck = await db.user.findUnique({ where: { email: googleUser.email } });
      if (studentCheck && studentCheck.role === 'STUDENT') {
        return res.redirect(`${FRONTEND_URL}/login?error=student_account`);
      }

      // Find or create faculty user
      const user = await db.user.upsert({
        where: { email: googleUser.email },
        update: { name: googleUser.name }, // Keep name in sync with Google
        create: {
          name: googleUser.name,
          email: googleUser.email,
          password: '',          // OAuth users have no password
          role: 'FACULTY',
          universityId: 1,
        },
      });

      const token = jwt.sign(
        { id: user.id, role: user.role },
        JWT_SECRET,
        { expiresIn: '1d' }
      );

      const userPayload = encodeURIComponent(JSON.stringify({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }));

      // Redirect to frontend with token in URL – frontend will pick it up
      res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}&user=${userPayload}`);
    } catch (err: any) {
      console.error('Google OAuth error:', err.message);
      res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
    }
  };
}
