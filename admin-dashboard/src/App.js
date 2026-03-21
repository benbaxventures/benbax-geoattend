import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StaffManagement from './pages/StaffManagement';
import StaffForm from './pages/StaffForm';
import AttendanceMonitor from './pages/AttendanceMonitor';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import GoogleCallback from './pages/GoogleCallback';
import Sidebar from './components/Sidebar';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  if (loading) return null;

  if (!user) {
    return (
      <>
        <Router>
          <Routes>
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/auth/google/callback" element={<GoogleCallback onLogin={handleLogin} />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </Router>
        <ToastContainer position="top-right" autoClose={3000} />
      </>
    );
  }

  return (
    <Router>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar user={user} onLogout={handleLogout} />
        <main style={{ flex: 1, padding: '24px', marginLeft: '250px', minHeight: '100vh' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/staff" element={<StaffManagement />} />
            <Route path="/staff/new" element={<StaffForm />} />
            <Route path="/staff/:id/edit" element={<StaffForm />} />
            <Route path="/attendance" element={<AttendanceMonitor />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </Router>
  );
}

export default App;
