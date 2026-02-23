import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function GoogleCallback() {
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userStr = params.get('user');
    const error = params.get('error');

    if (error) {
      const messages: Record<string, string> = {
        google_denied: 'Google sign-in was cancelled.',
        missing_code: 'Authentication failed. Please try again.',
        student_account: 'This email is registered as a student account and cannot be used to access the faculty portal.',
        oauth_failed: 'Google authentication failed. Please try again.',
      };
      navigate(`/login?oauthError=${encodeURIComponent(messages[error] || 'Sign-in failed.')}`);
      return;
    }

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        login(token, user);
        // login() calls navigate('/') via AuthContext
      } catch {
        navigate('/login?oauthError=Invalid+response+from+server');
      }
    } else {
      navigate('/login?oauthError=Authentication+failed');
    }
  }, []);

  return (
    <div className="loading-screen">
      <div style={{ textAlign: 'center' }}>
        <div className="loader" />
        <p style={{ marginTop: '1.5rem', color: 'var(--text-secondary)' }}>Signing you in with Google...</p>
      </div>
    </div>
  );
}
