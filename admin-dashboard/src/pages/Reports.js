import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiDownload, FiFileText, FiFilter } from 'react-icons/fi';
import { getAttendanceReport, getDepartments } from '../services/api';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  title: { fontSize: '24px', fontWeight: '700' },
  exportBtns: { display: 'flex', gap: '8px' },
  exportBtn: (color) => ({
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '10px 16px', background: color, color: '#fff',
    borderRadius: '8px', fontSize: '13px', fontWeight: '500',
  }),
  filters: {
    display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap',
    background: '#fff', padding: '16px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  field: { display: 'flex', flexDirection: 'column', gap: '4px' },
  label: { fontSize: '11px', fontWeight: '600', color: '#95a5a6', textTransform: 'uppercase' },
  input: { padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '13px' },
  select: { padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '13px', background: '#fff' },
  filterBtn: {
    alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: '6px',
    padding: '8px 16px', background: '#1a5276', color: '#fff', borderRadius: '6px', fontSize: '13px',
  },
  table: { width: '100%', background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  th: { padding: '12px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#7f8c8d', textTransform: 'uppercase', borderBottom: '2px solid #f0f0f0' },
  td: { padding: '12px 14px', fontSize: '13px', borderBottom: '1px solid #f5f5f5' },
  lateBadge: { color: '#f39c12', fontWeight: '600' },
  absentBadge: { color: '#e74c3c', fontWeight: '600' },
  onTimeBadge: { color: '#27ae60', fontWeight: '600' },
};

export default function Reports() {
  const [records, setRecords] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filters, setFilters] = useState({ startDate: '', endDate: '', department: '', staffId: '' });

  useEffect(() => {
    getDepartments().then(r => setDepartments(r.data)).catch(() => {});
    fetchReport();
  }, []);

  const fetchReport = () => {
    const params = {};
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    getAttendanceReport(params)
      .then(r => setRecords(r.data.records))
      .catch(() => toast.error('Failed to load report'));
  };

  const handleExport = (format) => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });

    const url = `${API_BASE}/reports/export/${format}?${params.toString()}`;
    // Open in new tab with auth header via fetch
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `attendance_report.${format === 'excel' ? 'xlsx' : 'pdf'}`;
        link.click();
      })
      .catch(() => toast.error('Export failed'));
  };

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>Attendance Reports</h1>
        <div style={styles.exportBtns}>
          <button style={styles.exportBtn('#27ae60')} onClick={() => handleExport('excel')}>
            <FiDownload size={14} /> Excel
          </button>
          <button style={styles.exportBtn('#e74c3c')} onClick={() => handleExport('pdf')}>
            <FiFileText size={14} /> PDF
          </button>
        </div>
      </div>

      <div style={styles.filters}>
        <div style={styles.field}>
          <label style={styles.label}>Start Date</label>
          <input style={styles.input} type="date" value={filters.startDate} onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))} />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>End Date</label>
          <input style={styles.input} type="date" value={filters.endDate} onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))} />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Department</label>
          <select style={styles.select} value={filters.department} onChange={e => setFilters(f => ({ ...f, department: e.target.value }))}>
            <option value="">All</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Staff ID</label>
          <input style={styles.input} placeholder="e.g. STF001" value={filters.staffId} onChange={e => setFilters(f => ({ ...f, staffId: e.target.value }))} />
        </div>
        <button style={styles.filterBtn} onClick={fetchReport}>
          <FiFilter size={14} /> Apply
        </button>
      </div>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Date</th>
            <th style={styles.th}>Staff ID</th>
            <th style={styles.th}>Name</th>
            <th style={styles.th}>Department</th>
            <th style={styles.th}>Check In</th>
            <th style={styles.th}>Check Out</th>
            <th style={styles.th}>Method</th>
            <th style={styles.th}>Status</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r, idx) => {
            const isAbsent = !r.check_in_time;
            return (
              <tr key={r.id || `absent-${r.staff_id}-${idx}`}>
                <td style={styles.td}>{r.date ? new Date(r.date).toLocaleDateString() : '-'}</td>
                <td style={styles.td}><strong>{r.staff_id}</strong></td>
                <td style={styles.td}>{r.first_name} {r.last_name}</td>
                <td style={styles.td}>{r.department || '-'}</td>
                <td style={styles.td}>{isAbsent ? '-' : new Date(r.check_in_time).toLocaleTimeString()}</td>
                <td style={styles.td}>{isAbsent ? '-' : (r.check_out_time ? new Date(r.check_out_time).toLocaleTimeString() : '-')}</td>
                <td style={styles.td}>{r.check_in_method || '-'}</td>
                <td style={styles.td}>
                  {isAbsent
                    ? <span style={styles.absentBadge}>Absent</span>
                    : r.is_late
                      ? <span style={styles.lateBadge}>Late</span>
                      : <span style={styles.onTimeBadge}>On Time</span>}
                </td>
              </tr>
            );
          })}
          {records.length === 0 && (
            <tr><td colSpan={8} style={{ ...styles.td, textAlign: 'center', padding: '40px', color: '#95a5a6' }}>No records found</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
