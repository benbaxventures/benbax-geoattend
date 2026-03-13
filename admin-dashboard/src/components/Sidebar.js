import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiHome, FiUsers, FiClock, FiBarChart2, FiSettings, FiLogOut, FiMapPin } from 'react-icons/fi';

const navItems = [
  { path: '/', label: 'Dashboard', icon: FiHome },
  { path: '/staff', label: 'Staff', icon: FiUsers },
  { path: '/attendance', label: 'Attendance', icon: FiClock },
  { path: '/reports', label: 'Reports', icon: FiBarChart2 },
  { path: '/settings', label: 'Settings', icon: FiSettings },
];

const styles = {
  sidebar: {
    width: '250px',
    background: 'linear-gradient(180deg, #1a5276 0%, #154360 100%)',
    color: '#fff',
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    zIndex: 1000,
  },
  logo: {
    padding: '24px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logoIcon: { fontSize: '24px' },
  logoText: { fontSize: '18px', fontWeight: '700', letterSpacing: '-0.5px' },
  nav: { flex: 1, padding: '16px 0' },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 24px',
    color: 'rgba(255,255,255,0.7)',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
    borderLeft: '3px solid transparent',
  },
  activeLink: {
    color: '#fff',
    background: 'rgba(255,255,255,0.1)',
    borderLeftColor: '#3498db',
  },
  userSection: {
    padding: '16px 20px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  userName: { fontSize: '14px', fontWeight: '600', marginBottom: '2px' },
  userRole: { fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '12px',
    padding: '8px 0',
    background: 'none',
    color: 'rgba(255,255,255,0.6)',
    fontSize: '13px',
    width: '100%',
    textAlign: 'left',
  },
};

export default function Sidebar({ user, onLogout }) {
  return (
    <aside style={styles.sidebar}>
      <div style={styles.logo}>
        <FiMapPin style={styles.logoIcon} />
        <span style={styles.logoText}>GeoAttend</span>
      </div>

      <nav style={styles.nav}>
        {navItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            style={({ isActive }) => ({
              ...styles.link,
              ...(isActive ? styles.activeLink : {}),
            })}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div style={styles.userSection}>
        <div style={styles.userName}>{user.firstName} {user.lastName}</div>
        <div style={styles.userRole}>{user.role}</div>
        <button style={styles.logoutBtn} onClick={onLogout}>
          <FiLogOut size={14} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
