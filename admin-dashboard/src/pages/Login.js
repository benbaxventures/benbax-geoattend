import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { login } from '../services/api';
import { FiMapPin, FiUser, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)',
    padding: '20px',
  },
  card: {
    background: '#fff',
    borderRadius: '16px',
    padding: '48px 40px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    marginBottom: '8px',
    color: '#1a5276',
  },
  title: { fontSize: '28px', fontWeight: '700' },
  subtitle: { textAlign: 'center', color: '#7f8c8d', marginBottom: '32px', fontSize: '14px' },
  inputGroup: { position: 'relative', marginBottom: '20px' },
  inputIcon: {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#95a5a6',
  },
  input: {
    width: '100%',
    padding: '14px 44px 14px 44px',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    fontSize: '15px',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  },
  eyeButton: {
    position: 'absolute',
    right: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#95a5a6',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
  },
  button: {
    width: '100%',
    padding: '14px',
    background: '#1a5276',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '600',
    marginTop: '8px',
    cursor: 'pointer',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '20px 0',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    background: '#e0e0e0',
  },
  dividerText: {
    margin: '0 12px',
    color: '#bdc3c7',
    fontSize: '13px',
    fontWeight: '600',
  },
  googleButton: {
    width: '100%',
    padding: '14px',
    background: '#fff',
    color: '#333',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    transition: 'background 0.2s',
  },
  googleIcon: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#4285F4',
  },
  footer: { textAlign: 'center', marginTop: '24px', fontSize: '12px', color: '#95a5a6' },
};

export default function Login({ onLogin }) {
  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!staffId || !password) {
      toast.error('Please enter staff ID and password');
      return;
    }

    setLoading(true);
    try {
      const { data } = await login(staffId, password);
      localStorage.setItem('token', data.token);

      if (data.user.role !== 'admin' && data.user.role !== 'super_admin') {
        toast.error('Admin access required');
        localStorage.removeItem('token');
        setLoading(false);
        return;
      }

      onLogin(data.user);
      toast.success('Login successful');
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Login failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const clientId = '725872424154-gv0c4blr061adus9iuaf8htc09pjk5l8.apps.googleusercontent.com';
    const redirectUri = encodeURIComponent(window.location.origin + '/auth/google/callback');
    const scope = encodeURIComponent('profile email');
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=${scope}`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <FiMapPin size={32} />
          <span style={styles.title}>GeoAttend</span>
        </div>
        <p style={styles.subtitle}>Admin Dashboard - Sign in to continue</p>

        <form onSubmit={handleSubmit}>
          <div style={styles.inputGroup}>
            <FiUser style={styles.inputIcon} size={18} />
            <input
              style={styles.input}
              type="text"
              placeholder="Staff ID"
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
            />
          </div>
          <div style={styles.inputGroup}>
            <FiLock style={styles.inputIcon} size={18} />
            <input
              style={styles.input}
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              style={styles.eyeButton}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>
          <button style={{ ...styles.button, opacity: loading ? 0.7 : 1 }} disabled={loading} type="submit">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={styles.divider}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>OR</span>
          <div style={styles.dividerLine} />
        </div>

        <button style={styles.googleButton} onClick={handleGoogleLogin} type="button">
          <span style={styles.googleIcon}>G</span>
          Sign in with Google
        </button>

        <p style={styles.footer}>Geofenced Attendance Management System</p>
      </div>
    </div>
  );
}
