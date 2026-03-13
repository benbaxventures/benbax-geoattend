import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { login } from '../services/api';
import { FiMapPin, FiUser, FiLock } from 'react-icons/fi';

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
    padding: '14px 14px 14px 44px',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    fontSize: '15px',
    transition: 'border-color 0.2s',
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
  },
  footer: { textAlign: 'center', marginTop: '24px', fontSize: '12px', color: '#95a5a6' },
};

export default function Login({ onLogin }) {
  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');
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
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
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
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button style={{ ...styles.button, opacity: loading ? 0.7 : 1 }} disabled={loading} type="submit">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={styles.footer}>Geofenced Attendance Management System</p>
      </div>
    </div>
  );
}
