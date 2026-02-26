import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader } from 'lucide-react';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    
    const token = searchParams.get('token');
    const userStr = searchParams.get('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        login(token, user);
        processed.current = true;
      } catch (err) {
        console.error('Failed to parse user data from OAuth callback', err);
        navigate('/login?error=invalid_data');
      }
    } else {
      navigate('/login?error=missing_auth_data');
    }
  }, [searchParams, navigate, login]);

  return (
    <div className="auth-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div className="auth-card glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
        <Loader className="spin" size={48} style={{ margin: '0 auto', color: '#4F46E5', animation: 'spin 1s linear infinite' }} />
        <h2 style={{ marginTop: '1.5rem' }}>Authenticating...</h2>
        <p>Please wait while we complete your sign in.</p>
        <style>{`
          @keyframes spin {
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
