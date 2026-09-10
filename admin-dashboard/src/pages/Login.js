import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { login, register } from '../services/api';
import { FiMapPin, FiUser, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)',
    padding: '16px',
    overflowY: 'auto',
  },
  card: {
    background: '#fff',
    borderRadius: '18px',
    padding: '28px 30px 22px',
    width: '100%',
    maxWidth: '440px',
    maxHeight: 'calc(100vh - 32px)',
    overflowY: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '4px',
    color: '#1a5276',
  },
  title: { fontSize: '24px', fontWeight: '700' },
  subtitle: { textAlign: 'center', color: '#7f8c8d', marginBottom: '20px', fontSize: '13px' },
  helper: {
    marginBottom: '16px',
    padding: '10px 12px',
    background: '#f2f8fb',
    border: '1px solid #dcecf4',
    borderRadius: '10px',
    color: '#46606f',
    fontSize: '12px',
    lineHeight: 1.4,
  },
  inputGroup: { position: 'relative', marginBottom: '14px' },
  inputIcon: {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#95a5a6',
  },
  input: {
    width: '100%',
    padding: '12px 44px',
    border: '1.5px solid #dfe7ec',
    borderRadius: '9px',
    fontSize: '14px',
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
    padding: '12px',
    background: '#1a5276',
    color: '#fff',
    border: 'none',
    borderRadius: '9px',
    fontSize: '15px',
    fontWeight: '600',
    marginTop: '2px',
    cursor: 'pointer',
  },
  accessNotice: {
    marginTop: '14px',
    padding: '9px 11px',
    background: '#fff8e6',
    border: '1px solid #f4df9b',
    borderRadius: '9px',
    color: '#6b5b2a',
    fontSize: '12px',
    lineHeight: 1.4,
  },
  footer: { textAlign: 'center', marginTop: '16px', fontSize: '11px', color: '#95a5a6' },
};

export default function Login({ onLogin }) {
  const [institutionCode, setInstitutionCode] = useState(localStorage.getItem('institutionCode') || '');
  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const normalizedStaffId = staffId.trim();
    if (!normalizedStaffId || !password) {
      toast.error('Please enter Staff ID and password');
      return;
    }

    setLoading(true);
    try {
      const codeTrim = institutionCode.trim();
      // Super admin (ADMIN001) can login without institution code
      const { data } = await login(normalizedStaffId.toUpperCase(), password, codeTrim || undefined);
      localStorage.setItem('token', data.token);
      const resolvedCode = data.institution?.code || codeTrim;
      if (resolvedCode) localStorage.setItem('institutionCode', String(resolvedCode).toUpperCase());

      if (data.user.role !== 'admin' && data.user.role !== 'super_admin') {
        toast.error('Admin access required');
        localStorage.removeItem('token');
        setLoading(false);
        return;
      }

      onLogin(data.user);
      toast.success('Login successful');
    } catch (err) {
      console.error('Login error:', err);
      const msg = err.response?.data?.error || err.message || 'Network error - check console';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell" style={styles.container}>
      <div className="auth-card" style={styles.card}>
        <div style={styles.logo}>
          <FiMapPin size={28} />
          <span style={styles.title}>Geofence</span>
        </div>
        <p style={styles.subtitle}>Admin Dashboard - Sign in to continue</p>

        <form onSubmit={handleSubmit} aria-label="Admin sign-in">
          <div role="note" style={styles.helper}>
            <strong>Sign-in tip:</strong> Super admins leave Institution Code blank. Institution admins use the code provided by their super admin.
          </div>
          <div style={styles.inputGroup}>
            <FiMapPin style={styles.inputIcon} size={18} />
            <input
              className="auth-input"
              style={styles.input}
              type="text"
              name="institutionCode"
              placeholder="Institution Code (optional for ADMIN001)"
              value={institutionCode}
              onChange={(e) => setInstitutionCode(e.target.value.toUpperCase())}
              autoComplete="organization"
              aria-label="Institution Code"
            />
          </div>
          <div style={styles.inputGroup}>
            <FiUser style={styles.inputIcon} size={18} />
            <input
              className="auth-input"
              style={styles.input}
              type="text"
              name="staffId"
              placeholder="Admin ID"
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              autoComplete="username"
              aria-label="Admin ID"
              required
            />
          </div>
          <div style={styles.inputGroup}>
            <FiLock style={styles.inputIcon} size={18} />
            <input
              className="auth-input"
              style={styles.input}
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              aria-label="Password"
              required
            />
            <button
              type="button"
              className="auth-toggle"
              style={styles.eyeButton}
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
            >
              {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>
          <button className="auth-button" style={{ ...styles.button, opacity: loading ? 0.7 : 1 }} disabled={loading} type="submit" aria-busy={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div role="note" style={styles.accessNotice}>
          <strong>Admin access only.</strong> Need an account? Contact your super administrator.
        </div>

        <p style={styles.footer}>Geofenced Student Attendance Management System</p>
      </div>
    </div>
  );
}
