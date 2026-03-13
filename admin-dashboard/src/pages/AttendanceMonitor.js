import React, { useState, useEffect } from 'react';
import { FiRefreshCw, FiClock, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { getRealTimeAttendance } from '../services/api';

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  title: { fontSize: '24px', fontWeight: '700' },
  refreshBtn: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 20px', background: '#fff', border: '1px solid #e0e0e0',
    borderRadius: '8px', fontSize: '14px', color: '#2c3e50',
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '12px' },
  card: {
    background: '#fff', borderRadius: '12px', padding: '16px 20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '16px',
  },
  avatar: {
    width: '48px', height: '48px', borderRadius: '50%', background: '#e8eaf6',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '18px', fontWeight: '600', color: '#1a5276',
  },
  name: { fontSize: '15px', fontWeight: '600' },
  info: { fontSize: '12px', color: '#95a5a6', marginTop: '2px' },
  statusBadge: (status) => ({
    marginLeft: 'auto', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '600',
    background: status === 'late' ? '#fff3e0' : status === 'out' ? '#e8f5e9' : '#e3f2fd',
    color: status === 'late' ? '#f39c12' : status === 'out' ? '#27ae60' : '#3498db',
    display: 'flex', alignItems: 'center', gap: '4px',
  }),
  empty: { textAlign: 'center', padding: '60px', color: '#95a5a6', fontSize: '15px' },
};

export default function AttendanceMonitor() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetch = () => {
    setLoading(true);
    getRealTimeAttendance()
      .then(r => setRecords(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const getInitials = (first, last) => `${(first || '')[0] || ''}${(last || '')[0] || ''}`.toUpperCase();

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Real-Time Attendance</h1>
          <p style={{ fontSize: '13px', color: '#95a5a6', marginTop: '4px' }}>
            {new Date().toLocaleDateString('en-GH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} &middot; {records.length} records
          </p>
        </div>
        <button style={styles.refreshBtn} onClick={fetch} disabled={loading}>
          <FiRefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {records.length === 0 ? (
        <div style={styles.empty}>No attendance records for today yet</div>
      ) : (
        <div style={styles.grid}>
          {records.map(r => {
            const status = r.is_late ? 'late' : r.check_out_time ? 'out' : 'in';
            const StatusIcon = status === 'late' ? FiAlertCircle : status === 'out' ? FiCheckCircle : FiClock;

            return (
              <div key={r.id} style={styles.card}>
                <div style={styles.avatar}>{getInitials(r.first_name, r.last_name)}</div>
                <div style={{ flex: 1 }}>
                  <div style={styles.name}>{r.first_name} {r.last_name}</div>
                  <div style={styles.info}>
                    {r.staff_id} &middot; {r.department || 'N/A'} &middot; In: {new Date(r.check_in_time).toLocaleTimeString()}
                    {r.check_out_time && ` &middot; Out: ${new Date(r.check_out_time).toLocaleTimeString()}`}
                  </div>
                </div>
                <div style={styles.statusBadge(status)}>
                  <StatusIcon size={12} />
                  {status === 'late' ? 'Late' : status === 'out' ? 'Done' : 'Active'}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
