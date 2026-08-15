const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { generateInstitutionQR } = require('../utils/qrcode');

async function generateInstitutionCode() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = `INST-${Math.floor(100000 + Math.random() * 900000)}`;
    const exists = await pool.query('SELECT id FROM institutions WHERE institution_code = $1', [code]);
    if (exists.rows.length === 0) return code;
  }
  return `INST-${Date.now().toString().slice(-6)}`;
}

exports.getInstitution = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM institutions WHERE id = $1',
      [req.user.institution_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Institution not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get institution error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateInstitution = async (req, res) => {
  try {
    const { name, address, city, region, latitude, longitude, geofenceRadius } = req.body;
    const institutionId = req.user.institution_id;

    const result = await pool.query(
      `UPDATE institutions SET
        name = COALESCE($1, name),
        address = COALESCE($2, address),
        city = COALESCE($3, city),
        region = COALESCE($4, region),
        latitude = COALESCE($5, latitude),
        longitude = COALESCE($6, longitude),
        geofence_radius = COALESCE($7, geofence_radius),
        updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [name, address, city, region, latitude, longitude, geofenceRadius, institutionId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update institution error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getAllInstitutions = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM institutions ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error('Get all institutions error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createInstitution = async (req, res) => {
  try {
    const { name, address, city, region, latitude, longitude, geofenceRadius } = req.body;

    if (!name || !latitude || !longitude) {
      return res.status(400).json({ error: 'Name, latitude, and longitude are required' });
    }

    const id = uuidv4();
    const institutionCode = await generateInstitutionCode();
    let created;
    const result = await pool.query(
      `INSERT INTO institutions (id, name, institution_code, address, city, region, latitude, longitude, geofence_radius)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [id, name, institutionCode, address || null, city || null, region || null, latitude, longitude, geofenceRadius || 200]
    );

    created = result.rows[0];

    // Backfill institution_code for any rows that didn't get one
    if (!created.institution_code) {
      const newCode = await generateInstitutionCode();
      const upd = await pool.query(
        'UPDATE institutions SET institution_code = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [newCode, id]
      );
      if (upd.rows.length > 0) created = upd.rows[0];
    }

    // Create default attendance rules
    await pool.query(
      'INSERT INTO attendance_rules (institution_id) VALUES ($1)',
      [id]
    );

    res.status(201).json(created);
  } catch (err) {
    console.error('Create institution error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.repairInstitutionCode = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Institution id is required' });

    const existing = await pool.query('SELECT id, institution_code FROM institutions WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Institution not found' });
    }
    if (existing.rows[0].institution_code) {
      return res.json({ message: 'Institution already has a code', institution: existing.rows[0] });
    }

    const code = await generateInstitutionCode();
    const updated = await pool.query(
      'UPDATE institutions SET institution_code = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [code, id]
    );

    res.json({ message: 'Institution code repaired', institution: updated.rows[0] });
  } catch (err) {
    console.error('Repair institution code error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getAttendanceRules = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM attendance_rules WHERE institution_id = $1',
      [req.user.institution_id]
    );
    res.json(result.rows[0] || {});
  } catch (err) {
    console.error('Get attendance rules error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateAttendanceRules = async (req, res) => {
  try {
    const { workStartTime, workEndTime, lateThresholdMinutes, earlyDepartureMinutes, workingDays } = req.body;
    const institutionId = req.user.institution_id;

    const result = await pool.query(
      `UPDATE attendance_rules SET
        work_start_time = COALESCE($1, work_start_time),
        work_end_time = COALESCE($2, work_end_time),
        late_threshold_minutes = COALESCE($3, late_threshold_minutes),
        early_departure_minutes = COALESCE($4, early_departure_minutes),
        working_days = COALESCE($5, working_days),
        updated_at = NOW()
       WHERE institution_id = $6
       RETURNING *`,
      [workStartTime, workEndTime, lateThresholdMinutes, earlyDepartureMinutes, workingDays, institutionId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update attendance rules error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getInstitutionQR = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM institutions WHERE id = $1',
      [req.user.institution_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Institution not found' });
    }

    const institution = result.rows[0];
    const qrCode = await generateInstitutionQR(institution);

    res.json({
      qrCode,
      institutionName: institution.name,
      institutionId: institution.id,
    });
  } catch (err) {
    console.error('Get institution QR error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
