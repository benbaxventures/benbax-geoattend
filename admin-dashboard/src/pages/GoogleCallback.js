import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { googleLogin } from '../services/api';

export default function GoogleCallback({ onLogin }) {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');

      if (!accessToken) {
        toast.error('Google login failed - no access token');
        navigate('/login');
        return;
      }

      try {
        // Fetch Google user info
        const res = await fetch('https://www.googleapis.com/userinfo/v2/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const userInfo = await res.json();

        // Send to backend
        const { data } = await googleLogin({
          googleId: userInfo.id,
          email: userInfo.email,
          firstName: userInfo.given_name,
          lastName: userInfo.family_name,
          profilePhoto: userInfo.picture,
        });

        localStorage.setItem('token', data.token);

        if (data.user.role !== 'admin' && data.user.role !== 'super_admin') {
          toast.error('Admin access required');
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }

        onLogin(data.user);
        toast.success('Login successful');
        navigate('/');
      } catch (err) {
        toast.error(err.response?.data?.error || 'Google login failed');
        navigate('/login');
      }
    };

    handleCallback();
  }, [navigate, onLogin]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)',
      color: '#fff',
      fontSize: '18px',
    }}>
      Signing in with Google...
    </div>
  );
}
