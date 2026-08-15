import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { FiList, FiMapPin, FiShield, FiTrendingUp } from 'react-icons/fi';

const navItems = [
  { path: '/institutions', label: 'Institutions', icon: FiList, end: true },
  { path: '/institutions/new', label: 'Create Institution', icon: FiMapPin },
  { path: '/audit', label: 'Audit Log', icon: FiShield },
  { path: '/analytics', label: 'Analytics', icon: FiTrendingUp },
];

const styles = {
  container: { maxWidth: 900, margin: '0 auto', padding: 32 },
  nav: { display: 'flex', gap: 24, marginBottom: 32 },
  link: { color: '#1a5276', fontWeight: 600, fontSize: 16, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 },
  active: { borderBottom: '2px solid #1a5276' },
};

export default function SuperAdminDashboard({ onLogout }) {
  const navigate = useNavigate();
  const handleSignOut = () => {
    try { localStorage.removeItem('token'); localStorage.removeItem('user'); } catch (e) {}
    if (typeof onLogout === 'function') onLogout();
    navigate('/login');
  };
  return (
    <div style={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Super Admin</h2>
        <button onClick={handleSignOut} style={{ background: '#e74c3c', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' }}>Sign Out</button>
      </div>
      <nav style={styles.nav}>
        {navItems.map(({ path, label, icon: Icon, end }) => (
          <NavLink key={path} to={path} end={end} style={({ isActive }) => ({ ...styles.link, ...(isActive ? styles.active : {}) })}>
            <Icon size={18} /> {label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
