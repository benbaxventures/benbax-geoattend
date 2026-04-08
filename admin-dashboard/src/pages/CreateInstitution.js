import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { createInstitution, getAllInstitutions, repairInstitutionCode } from '../services/api';

const styles = {
  container: { maxWidth: 760, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 700 },
  form: { background: '#fff', padding: 20, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  row: { display: 'flex', gap: 12, marginBottom: 12 },
  input: { flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 14 },
  btn: (bg) => ({ padding: '8px 16px', borderRadius: 8, background: bg, color: '#fff', border: 'none', cursor: 'pointer' }),
  codeBox: { marginTop: 16, padding: 12, background: '#f6f8fa', borderRadius: 8, fontFamily: 'monospace' }
};

export default function CreateInstitution() {
  const DRAFT_KEY = 'createInstitutionDraft';
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [geofenceRadius, setGeofenceRadius] = useState(200);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(null);
  const [showRaw, setShowRaw] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  // load draft from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d && typeof d === 'object') {
          const restored = {
            name: String(d.name ?? '').trim(),
            address: String(d.address ?? '').trim(),
            city: String(d.city ?? '').trim(),
            region: String(d.region ?? '').trim(),
            latitude: d.latitude === null || d.latitude === undefined ? '' : String(d.latitude),
            longitude: d.longitude === null || d.longitude === undefined ? '' : String(d.longitude),
            geofenceRadius: Number.isFinite(Number(d.geofenceRadius)) ? Number(d.geofenceRadius) : 200,
          };

          const hasAny =
            !!(restored.name || restored.address || restored.city || restored.region || restored.latitude || restored.longitude);

          if (hasAny) {
            setName(restored.name);
            setAddress(restored.address);
            setCity(restored.city);
            setRegion(restored.region);
            setLatitude(restored.latitude);
            setLongitude(restored.longitude);
            setGeofenceRadius(restored.geofenceRadius);
            toast.info('Draft restored for Create Institution');
            setHasDraft(true);
          } else {
            // If the stored draft is empty, don't show "restored" messaging.
            setHasDraft(false);
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // persist draft to localStorage when fields change
  useEffect(() => {
    try {
      const draft = { name, address, city, region, latitude, longitude, geofenceRadius };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      setHasDraft(!!(name || address || city || region || latitude || longitude));
    } catch (e) {}
  }, [name, address, city, region, latitude, longitude, geofenceRadius]);

  const submit = async (e) => {
    e && e.preventDefault();
    if (!name || !latitude || !longitude) return toast.error('Name, latitude and longitude are required');
    setCreating(true);
    try {
      const payload = { name, address, city, region, latitude: parseFloat(latitude), longitude: parseFloat(longitude), geofenceRadius: parseInt(geofenceRadius, 10) };
      const res = await createInstitution(payload);
      let inst = res.data;
      // If backend did not return an institution code, try fetching the created institution
      if (!inst.institution_code && inst.id) {
        try {
          const listRes = await getAllInstitutions();
          const found = Array.isArray(listRes.data) ? listRes.data.find(i => i.id === inst.id) : null;
          if (found) inst = found;
        } catch (e) {
          // ignore fetch errors
        }
      }
      // Still missing code? Try repairing it (super_admin only).
      if (!inst.institution_code && inst.id) {
        try {
          const repaired = await repairInstitutionCode(inst.id);
          const repairedInst = repaired?.data?.institution;
          if (repairedInst) inst = repairedInst;
        } catch (e) {
          // ignore repair errors; raw response will still show for debugging
        }
      }
      setCreated(inst);
      toast.success('Institution created');
      try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create institution');
    } finally { setCreating(false); }
  };

  const copyCode = async () => {
    const code = created?.institution_code || created?.institutionCode || created?.code || created?.data?.institution_code || created?.data?.code;
    if (!code) return toast.info('Institution code not available');
    try {
      await navigator.clipboard.writeText(code);
      toast.success('Institution code copied');
    } catch {
      toast.info('Copy this code: ' + code);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Create Institution</h2>
      </div>

      <form style={styles.form} onSubmit={submit}>
        {hasDraft && (
          <div style={{ marginBottom: 12, padding: 10, background: '#fff8e1', borderRadius: 8 }}>
            <strong>Draft saved:</strong> your entered values were restored from a draft. <button type="button" onClick={() => { try { localStorage.removeItem(DRAFT_KEY); setHasDraft(false); setName(''); setAddress(''); setCity(''); setRegion(''); setLatitude(''); setLongitude(''); setGeofenceRadius(200); } catch(e){} }} style={{ marginLeft: 8 }}>Clear draft</button>
          </div>
        )}
        <div style={styles.row}>
          <input style={styles.input} placeholder="Institution name" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div style={styles.row}>
          <input style={styles.input} placeholder="Address" value={address} onChange={e => setAddress(e.target.value)} />
          <input style={styles.input} placeholder="City" value={city} onChange={e => setCity(e.target.value)} />
        </div>
        <div style={styles.row}>
          <input style={styles.input} placeholder="Region" value={region} onChange={e => setRegion(e.target.value)} />
          <input style={styles.input} placeholder="Geofence radius (meters)" value={geofenceRadius} onChange={e => setGeofenceRadius(e.target.value)} />
        </div>
        <div style={styles.row}>
          <input style={styles.input} placeholder="Latitude" value={latitude} onChange={e => setLatitude(e.target.value)} />
          <input style={styles.input} placeholder="Longitude" value={longitude} onChange={e => setLongitude(e.target.value)} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" onClick={() => { setName(''); setAddress(''); setCity(''); setRegion(''); setLatitude(''); setLongitude(''); setGeofenceRadius(200); setCreated(null); try { localStorage.removeItem(DRAFT_KEY); } catch(e) {} }} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #e0e0e0', background: '#fff' }}>Reset</button>
          <button type="submit" disabled={creating} style={styles.btn('#1a5276')}>{creating ? 'Creating...' : 'Create Institution'}</button>
        </div>

        {created && (
            <div style={styles.codeBox}>
              <div><strong>Institution created:</strong> {created.name || created.data?.name || '—'}</div>
              <div style={{ marginTop: 8 }}>
                <strong>Institution code:</strong>{' '}
                <span style={{ fontFamily: 'monospace' }}>
                  {created.institution_code || created.institutionCode || created.code || created.data?.institution_code || 'Not returned'}
                </span>
              </div>
              <div style={{ marginTop: 8 }}>
                <button onClick={copyCode} style={{ ...styles.btn('#27ae60'), marginRight: 8 }}>Copy Code</button>
                <label style={{ marginLeft: 8 }}><input type="checkbox" checked={showRaw} onChange={e => setShowRaw(e.target.checked)} /> Show raw response</label>
                <div style={{ marginTop: 8 }}><small style={{ color: '#666' }}>Share this code with the institution admin so they can register/login under this institution.</small></div>
                {showRaw && (
                  <pre style={{ marginTop: 8, maxHeight: 200, overflow: 'auto', background: '#fff', padding: 8 }}>{JSON.stringify(created, null, 2)}</pre>
                )}
              </div>
            </div>
          )}
      </form>
    </div>
  );
}
