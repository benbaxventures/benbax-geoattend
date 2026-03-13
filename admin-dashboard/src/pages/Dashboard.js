import React, { useState, useEffect } from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { FiUsers, FiUserCheck, FiClock, FiUserX } from 'react-icons/fi';
import { getDashboardStats, getWeeklySummary } from '../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler);

const cardColors = ['#3498db', '#27ae60', '#f39c12', '#e74c3c'];
const cardIcons = [FiUsers, FiUserCheck, FiClock, FiUserX];
const cardLabels = ['Total Staff', 'Present Today', 'Late Today', 'Absent Today'];

const styles = {
  header: { marginBottom: '24px' },
  title: { fontSize: '24px', fontWeight: '700', color: '#2c3e50' },
  date: { fontSize: '13px', color: '#95a5a6', marginTop: '4px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' },
  statCard: {
    background: '#fff',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  iconBox: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
  },
  statValue: { fontSize: '28px', fontWeight: '700', lineHeight: 1 },
  statLabel: { fontSize: '13px', color: '#95a5a6', marginTop: '4px' },
  chartsGrid: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' },
  chartCard: {
    background: '#fff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  chartTitle: { fontSize: '16px', fontWeight: '600', marginBottom: '16px' },
};

export default function Dashboard() {
  const [stats, setStats] = useState({ totalStaff: 0, presentToday: 0, lateToday: 0, absentToday: 0 });
  const [weekly, setWeekly] = useState([]);

  useEffect(() => {
    getDashboardStats().then(r => setStats(r.data)).catch(() => {});
    getWeeklySummary().then(r => setWeekly(r.data)).catch(() => {});
  }, []);

  const statValues = [stats.totalStaff, stats.presentToday, stats.lateToday, stats.absentToday];

  const lineData = {
    labels: weekly.map(w => new Date(w.date).toLocaleDateString('en-GH', { weekday: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Present',
        data: weekly.map(w => parseInt(w.present, 10)),
        borderColor: '#27ae60',
        backgroundColor: 'rgba(39, 174, 96, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Late',
        data: weekly.map(w => parseInt(w.late, 10)),
        borderColor: '#f39c12',
        backgroundColor: 'rgba(243, 156, 18, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const doughnutData = {
    labels: ['Present', 'Late', 'Absent'],
    datasets: [{
      data: [stats.presentToday - stats.lateToday, stats.lateToday, stats.absentToday],
      backgroundColor: ['#27ae60', '#f39c12', '#e74c3c'],
      borderWidth: 0,
    }],
  };

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>Dashboard</h1>
        <p style={styles.date}>{new Date().toLocaleDateString('en-GH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div style={styles.statsGrid}>
        {statValues.map((val, i) => {
          const Icon = cardIcons[i];
          return (
            <div key={i} style={styles.statCard}>
              <div style={{ ...styles.iconBox, background: cardColors[i] }}>
                <Icon size={22} />
              </div>
              <div>
                <div style={styles.statValue}>{val}</div>
                <div style={styles.statLabel}>{cardLabels[i]}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={styles.chartsGrid}>
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Weekly Attendance Trend</h3>
          <Line data={lineData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true } } }} />
        </div>
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Today's Overview</h3>
          <Doughnut data={doughnutData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
        </div>
      </div>
    </div>
  );
}
