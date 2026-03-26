const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { generateInstitutionQR } = require('../utils/qrcode');

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
    const result = await pool.query(
      `INSERT INTO institutions (id, name, address, city, region, latitude, longitude, geofence_radius)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [id, name, address || null, city || null, region || null, latitude, longitude, geofenceRadius || 200]
    );

    // Create default attendance rules
    await pool.query(
      `INSERT INTO attendance_rules (institution_id, member_type)
       VALUES ($1, 'staff'), ($1, 'student')
       ON CONFLICT DO NOTHING`,
      [id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create institution error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getAttendanceRules = async (req, res) => {
  try {
    const requested = (req.query.memberType || '').toLowerCase();
    const memberType =
      (req.user.role === 'admin' || req.user.role === 'super_admin')
        ? (requested || 'staff')
        : (req.user.member_type || 'staff');

    const result = await pool.query(
      'SELECT * FROM attendance_rules WHERE institution_id = $1 AND member_type = $2',
      [req.user.institution_id, memberType]
    );
    res.json(result.rows[0] || {});
  } catch (err) {
    console.error('Get attendance rules error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateAttendanceRules = async (req, res) => {
  try {
    const { workStartTime, workEndTime, lateThresholdMinutes, earlyDepartureMinutes, workingDays, memberType: bodyMemberType } = req.body;
    const institutionId = req.user.institution_id;
    const requested = (req.query.memberType || bodyMemberType || '').toLowerCase();
    const memberType =
      (req.user.role === 'admin' || req.user.role === 'super_admin')
        ? (requested || 'staff')
        : (req.user.member_type || 'staff');

    const result = await pool.query(
      `UPDATE attendance_rules SET
        work_start_time = COALESCE($1, work_start_time),
        work_end_time = COALESCE($2, work_end_time),
        late_threshold_minutes = COALESCE($3, late_threshold_minutes),
        early_departure_minutes = COALESCE($4, early_departure_minutes),
        working_days = COALESCE($5, working_days),
        updated_at = NOW()
       WHERE institution_id = $6 AND member_type = $7
       RETURNING *`,
      [workStartTime, workEndTime, lateThresholdMinutes, earlyDepartureMinutes, workingDays, institutionId, memberType]
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
