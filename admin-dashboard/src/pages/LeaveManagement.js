import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiCheck, FiX, FiFilter, FiCalendar } from 'react-icons/fi';
import { getAllLeaves, getLeaveStats, reviewLeave } from '../services/api';

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  title: { fontSize: '24px', fontWeight: '700' },
  statsRow: { display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' },
  statCard: (color) => ({
    flex: 1, minWidth: '140px', padding: '16px 20px', background: '#fff',
    borderRadius: '12px', borderLeft: `4px solid ${color}`,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  }),
  statValue: { fontSize: '28px', fontWeight: '700' },
  statLabel: { fontSize: '12px', color: '#7f8c8d', marginTop: '2px' },
  filters: { display: 'flex', gap: '12px', marginBottom: '16px' },
  select: { padding: '8px 14px', border: '1px solid #e0e0e0', borderRadius: '8px', background: '#fff', fontSize: '14px' },
  table: { width: '100%', background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  th: { padding: '12px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#7f8c8d', textTransform: 'uppercase', borderBottom: '2px solid #f0f0f0' },
  td: { padding: '12px 14px', fontSize: '13px', borderBottom: '1px solid #f5f5f5' },
  badge: (status) => {
    const colors = { pending: '#f39c12', approved: '#27ae60', rejected: '#e74c3c', cancelled: '#95a5a6' };
    return {
      padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600',
      background: `${colors[status]}15`, color: colors[status],
    };
  },
  typeBadge: { padding: '3px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: '500', background: '#e8f4fd', color: '#2980b9' },
  actionBtn: (color) => ({
    padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '500',
    background: color, color: '#fff', marginRight: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px',
  }),
  modalOverlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  modal: { background: '#fff', borderRadius: '12px', padding: '24px', width: '400px', maxWidth: '90vw' },
};

export default function LeaveManagement() {
  const [leaves, setLeaves] = useState([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, on_leave_today: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewNote, setReviewNote] = useState('');

  const fetchData = () => {
    getAllLeaves({ status: statusFilter || undefined })
      .then(r => setLeaves(r.data.leaves))
      .catch(() => toast.error('Failed to load leave requests'));
    getLeaveStats().then(r => setStats(r.data)).catch(() => {});
  };

  useEffect(() => { fetchData(); }, [statusFilter]);

  const handleReview = async (status) => {
    try {
      await reviewLeave(reviewModal.id, { status, reviewNote: reviewNote || undefined });
      toast.success(`Leave request ${status}`);
      setReviewModal(null);
      setReviewNote('');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to review request');
    }
  };

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>Leave Management</h1>
      </div>

      <div style={styles.statsRow}>
        <div style={styles.statCard('#f39c12')}>
          <div style={{ ...styles.statValue, color: '#f39c12' }}>{stats.pending}</div>
          <div style={styles.statLabel}>Pending</div>
        </div>
        <div style={styles.statCard('#27ae60')}>
          <div style={{ ...styles.statValue, color: '#27ae60' }}>{stats.approved}</div>
          <div style={styles.statLabel}>Approved</div>
        </div>
        <div style={styles.statCard('#e74c3c')}>
          <div style={{ ...styles.statValue, color: '#e74c3c' }}>{stats.rejected}</div>
          <div style={styles.statLabel}>Rejected</div>
        </div>
        <div style={styles.statCard('#3498db')}>
          <div style={{ ...styles.statValue, color: '#3498db' }}>{stats.on_leave_today}</div>
          <div style={styles.statLabel}>On Leave Today</div>
        </div>
      </div>

      <div style={styles.filters}>
        <FiFilter size={16} color="#95a5a6" style={{ alignSelf: 'center' }} />
        <select style={styles.select} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Member</th>
            <th style={styles.th}>Type</th>
            <th style={styles.th}>Dates</th>
            <th style={styles.th}>Reason</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Reviewed By</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {leaves.map(l => (
            <tr key={l.id}>
              <td style={styles.td}>
                <strong>{l.staff_id}</strong>
                <div style={{ fontSize: '12px', color: '#7f8c8d' }}>{l.first_name} {l.last_name}</div>
              </td>
              <td style={styles.td}><span style={styles.typeBadge}>{l.leave_type}</span></td>
              <td style={styles.td}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <FiCalendar size={12} color="#7f8c8d" />
                  {new Date(l.start_date).toLocaleDateString()} - {new Date(l.end_date).toLocaleDateString()}
                </div>
              </td>
              <td style={styles.td}>{l.reason || '-'}</td>
              <td style={styles.td}><span style={styles.badge(l.status)}>{l.status}</span></td>
              <td style={styles.td}>
                {l.reviewer_first_name ? `${l.reviewer_first_name} ${l.reviewer_last_name}` : '-'}
                {l.reviewed_at && <div style={{ fontSize: '11px', color: '#95a5a6' }}>{new Date(l.reviewed_at).toLocaleDateString()}</div>}
              </td>
              <td style={styles.td}>
                {l.status === 'pending' && (
                  <>
                    <button style={styles.actionBtn('#27ae60')} onClick={() => setReviewModal({ ...l, action: 'approve' })}>
                      <FiCheck size={12} /> Approve
                    </button>
                    <button style={styles.actionBtn('#e74c3c')} onClick={() => setReviewModal({ ...l, action: 'reject' })}>
                      <FiX size={12} /> Reject
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
          {leaves.length === 0 && (
            <tr><td colSpan={7} style={{ ...styles.td, textAlign: 'center', padding: '40px', color: '#95a5a6' }}>No leave requests found</td></tr>
          )}
        </tbody>
      </table>

      {reviewModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px' }}>
              {reviewModal.action === 'approve' ? 'Approve' : 'Reject'} Leave Request
            </h3>
            <p style={{ margin: '0 0 8px', fontSize: '14px', color: '#555' }}>
              <strong>{reviewModal.first_name} {reviewModal.last_name}</strong> ({reviewModal.staff_id})
            </p>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#7f8c8d' }}>
              {reviewModal.leave_type} leave: {new Date(reviewModal.start_date).toLocaleDateString()} - {new Date(reviewModal.end_date).toLocaleDateString()}
            </p>
            <textarea
              placeholder="Add a note (optional)"
              value={reviewNote}
              onChange={e => setReviewNote(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e0e0e0', fontSize: '14px', minHeight: '80px', resize: 'vertical', marginBottom: '16px', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => { setReviewModal(null); setReviewNote(''); }}
                style={{ padding: '8px 20px', borderRadius: '6px', background: '#f0f0f0', color: '#333', border: 'none', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={() => handleReview(reviewModal.action === 'approve' ? 'approved' : 'rejected')}
                style={{ padding: '8px 20px', borderRadius: '6px', background: reviewModal.action === 'approve' ? '#27ae60' : '#e74c3c', color: '#fff', border: 'none', cursor: 'pointer' }}>
                {reviewModal.action === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
