import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiSave, FiMapPin } from 'react-icons/fi';
import { getInstitution, updateInstitution, getAttendanceRules, updateAttendanceRules } from '../services/api';

const styles = {
  title: { fontSize: '24px', fontWeight: '700', marginBottom: '24px' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', maxWidth: '900px' },
  card: { background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  cardTitle: { fontSize: '16px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' },
  label: { fontSize: '12px', fontWeight: '600', color: '#7f8c8d', textTransform: 'uppercase' },
  input: { padding: '10px 14px', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '14px' },
  hint: { fontSize: '11px', color: '#bdc3c7' },
  saveBtn: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 24px', background: '#1a5276', color: '#fff',
    borderRadius: '8px', fontSize: '14px', fontWeight: '500', marginTop: '8px',
  },
  dayGrid: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  dayBtn: (active) => ({
    padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '500',
    background: active ? '#1a5276' : '#f0f0f0', color: active ? '#fff' : '#7f8c8d',
    border: 'none',
  }),
};

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Settings() {
  const [inst, setInst] = useState({ name: '', address: '', city: '', region: '', latitude: '', longitude: '', geofence_radius: 200 });
  const [rules, setRules] = useState({ work_start_time: '08:00', work_end_time: '17:00', late_threshold_minutes: 15, early_departure_minutes: 30, working_days: [1,2,3,4,5] });

  useEffect(() => {
    getInstitution().then(r => setInst(r.data)).catch(() => {});
    getAttendanceRules().then(r => { if (r.data && r.data.id) setRules(r.data); }).catch(() => {});
  }, []);

  const saveInstitution = async () => {
    try {
      await updateInstitution({
        name: inst.name, address: inst.address, city: inst.city, region: inst.region,
        latitude: parseFloat(inst.latitude), longitude: parseFloat(inst.longitude),
        geofenceRadius: parseInt(inst.geofence_radius, 10),
      });
      toast.success('Institution settings saved');
    } catch { toast.error('Failed to save'); }
  };

  const saveRules = async () => {
    try {
      await updateAttendanceRules({
        workStartTime: rules.work_start_time,
        workEndTime: rules.work_end_time,
        lateThresholdMinutes: parseInt(rules.late_threshold_minutes, 10),
        earlyDepartureMinutes: parseInt(rules.early_departure_minutes, 10),
        workingDays: rules.working_days,
      });
      toast.success('Attendance rules saved');
    } catch { toast.error('Failed to save'); }
  };

  const toggleDay = (day) => {
    setRules(prev => ({
      ...prev,
      working_days: prev.working_days.includes(day)
        ? prev.working_days.filter(d => d !== day)
        : [...prev.working_days, day].sort(),
    }));
  };

  return (
    <div>
      <h1 style={styles.title}>Settings</h1>

      <div style={styles.grid}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}><FiMapPin size={18} /> Institution & Geofence</h3>
          <div style={styles.field}>
            <label style={styles.label}>Institution Name</label>
            <input style={styles.input} value={inst.name || ''} onChange={e => setInst(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Address</label>
            <input style={styles.input} value={inst.address || ''} onChange={e => setInst(p => ({ ...p, address: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={styles.field}>
              <label style={styles.label}>City</label>
              <input style={styles.input} value={inst.city || ''} onChange={e => setInst(p => ({ ...p, city: e.target.value }))} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Region</label>
              <input style={styles.input} value={inst.region || ''} onChange={e => setInst(p => ({ ...p, region: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={styles.field}>
              <label style={styles.label}>Latitude</label>
              <input style={styles.input} type="number" step="any" value={inst.latitude || ''} onChange={e => setInst(p => ({ ...p, latitude: e.target.value }))} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Longitude</label>
              <input style={styles.input} type="number" step="any" value={inst.longitude || ''} onChange={e => setInst(p => ({ ...p, longitude: e.target.value }))} />
            </div>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Geofence Radius (meters)</label>
            <input style={styles.input} type="number" value={inst.geofence_radius || ''} onChange={e => setInst(p => ({ ...p, geofence_radius: e.target.value }))} />
            <span style={styles.hint}>Area within which staff can check in (recommended: 100-500m)</span>
          </div>
          <button style={styles.saveBtn} onClick={saveInstitution}><FiSave size={14} /> Save Institution</button>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Attendance Rules</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={styles.field}>
              <label style={styles.label}>Work Start Time</label>
              <input style={styles.input} type="time" value={rules.work_start_time || ''} onChange={e => setRules(p => ({ ...p, work_start_time: e.target.value }))} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Work End Time</label>
              <input style={styles.input} type="time" value={rules.work_end_time || ''} onChange={e => setRules(p => ({ ...p, work_end_time: e.target.value }))} />
            </div>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Late Threshold (minutes after start)</label>
            <input style={styles.input} type="number" value={rules.late_threshold_minutes || ''} onChange={e => setRules(p => ({ ...p, late_threshold_minutes: e.target.value }))} />
            <span style={styles.hint}>Staff arriving this many minutes after start time are marked late</span>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Early Departure (minutes before end)</label>
            <input style={styles.input} type="number" value={rules.early_departure_minutes || ''} onChange={e => setRules(p => ({ ...p, early_departure_minutes: e.target.value }))} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Working Days</label>
            <div style={styles.dayGrid}>
              {dayNames.map((name, i) => (
                <button key={i} style={styles.dayBtn(rules.working_days?.includes(i))} onClick={() => toggleDay(i)}>
                  {name}
                </button>
              ))}
            </div>
          </div>
          <button style={styles.saveBtn} onClick={saveRules}><FiSave size={14} /> Save Rules</button>
        </div>
      </div>
    </div>
  );
}
