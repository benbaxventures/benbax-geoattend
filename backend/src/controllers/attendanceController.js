const pool = require('../config/database');
const { isWithinGeofence } = require('../utils/geofence');

exports.checkIn = async (req, res) => {
  try {
    const { latitude, longitude, method, deviceId, qrCode } = req.body;
    const staffUuid = req.user.id;
    const institutionId = req.user.institution_id;

    // Validate method
    const validMethods = ['gps', 'qr_code', 'nfc', 'manual'];
    if (!validMethods.includes(method)) {
      return res.status(400).json({ error: 'Invalid check-in method' });
    }

    // For QR code check-in, verify the QR code belongs to this staff
    if (method === 'qr_code' && qrCode) {
      const qrResult = await pool.query(
        'SELECT id FROM staff WHERE qr_code_data = $1 AND id = $2',
        [qrCode, staffUuid]
      );
      if (qrResult.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid QR code' });
      }
    }

    // Check for duplicate check-in today
    const today = new Date().toISOString().split('T')[0];
    const existing = await pool.query(
      'SELECT id, check_out_time FROM attendance_records WHERE staff_uuid = $1 AND date = $2 ORDER BY check_in_time DESC LIMIT 1',
      [staffUuid, today]
    );

    if (existing.rows.length > 0 && !existing.rows[0].check_out_time) {
      return res.status(400).json({ error: 'You already have an active check-in. Please check out first.' });
    }

    // GPS geofence verification (required for GPS method, optional for others)
    let withinGeofence = true;
    if (latitude && longitude) {
      const institution = await pool.query(
        'SELECT latitude, longitude, geofence_radius FROM institutions WHERE id = $1',
        [institutionId]
      );

      if (institution.rows.length > 0) {
        const inst = institution.rows[0];
        const geofenceCheck = isWithinGeofence(
          latitude, longitude,
          parseFloat(inst.latitude), parseFloat(inst.longitude),
          inst.geofence_radius
        );
        withinGeofence = geofenceCheck.isWithin;

        if (method === 'gps' && !withinGeofence) {
          return res.status(403).json({
            error: 'You are outside the institution geofence',
            distance: geofenceCheck.distance,
            radius: geofenceCheck.radius,
          });
        }
      }
    } else if (method === 'gps') {
      return res.status(400).json({ error: 'GPS coordinates are required for GPS check-in' });
    }

    // Check if late
    const rules = await pool.query(
      'SELECT work_start_time, late_threshold_minutes FROM attendance_rules WHERE institution_id = $1',
      [institutionId]
    );

    let isLate = false;
    if (rules.rows.length > 0) {
      const rule = rules.rows[0];
      const now = new Date();
      const [startHour, startMin] = rule.work_start_time.split(':').map(Number);
      const lateTime = new Date(now);
      lateTime.setHours(startHour, startMin + rule.late_threshold_minutes, 0, 0);
      isLate = now > lateTime;
    }

    // Record check-in
    const record = await pool.query(
      `INSERT INTO attendance_records
        (staff_uuid, institution_id, check_in_time, check_in_latitude, check_in_longitude,
         check_in_method, device_id, is_late, is_within_geofence, date)
       VALUES ($1, $2, NOW(), $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [staffUuid, institutionId, latitude || null, longitude || null, method, deviceId || null, isLate, withinGeofence, today]
    );

    // Log device
    if (deviceId) {
      await pool.query(
        `INSERT INTO device_logs (staff_uuid, device_id, action, ip_address)
         VALUES ($1, $2, 'check_in', $3)`,
        [staffUuid, deviceId, req.ip]
      );
    }

    res.status(201).json({
      message: 'Check-in successful',
      record: record.rows[0],
      isLate,
      withinGeofence,
    });
  } catch (err) {
    console.error('Check-in error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.checkOut = async (req, res) => {
  try {
    const { latitude, longitude, method, deviceId } = req.body;
    const staffUuid = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    // Find active check-in
    const active = await pool.query(
      'SELECT id FROM attendance_records WHERE staff_uuid = $1 AND date = $2 AND check_out_time IS NULL ORDER BY check_in_time DESC LIMIT 1',
      [staffUuid, today]
    );

    if (active.rows.length === 0) {
      return res.status(400).json({ error: 'No active check-in found' });
    }

    // GPS verification for check-out
    if (latitude && longitude) {
      const institution = await pool.query(
        'SELECT latitude, longitude, geofence_radius FROM institutions WHERE id = $1',
        [req.user.institution_id]
      );

      if (institution.rows.length > 0) {
        const inst = institution.rows[0];
        const geofenceCheck = isWithinGeofence(
          latitude, longitude,
          parseFloat(inst.latitude), parseFloat(inst.longitude),
          inst.geofence_radius
        );

        if (method === 'gps' && !geofenceCheck.isWithin) {
          return res.status(403).json({
            error: 'You are outside the institution geofence',
            distance: geofenceCheck.distance,
            radius: geofenceCheck.radius,
          });
        }
      }
    }

    const record = await pool.query(
      `UPDATE attendance_records
       SET check_out_time = NOW(), check_out_latitude = $1, check_out_longitude = $2, check_out_method = $3
       WHERE id = $4
       RETURNING *`,
      [latitude || null, longitude || null, method || 'gps', active.rows[0].id]
    );

    // Track overtime if checking out after work end time
    try {
      const rules = await pool.query(
        'SELECT work_end_time FROM attendance_rules WHERE institution_id = $1',
        [req.user.institution_id]
      );
      if (rules.rows.length > 0) {
        const now = new Date();
        const [endHour, endMin] = rules.rows[0].work_end_time.split(':').map(Number);
        const endTime = new Date(now);
        endTime.setHours(endHour, endMin, 0, 0);
        if (now > endTime) {
          const overtimeMinutes = Math.round((now - endTime) / 60000);
          if (overtimeMinutes > 0) {
            await pool.query(
              `INSERT INTO overtime_records (staff_uuid, institution_id, date, overtime_minutes, reason)
               VALUES ($1, $2, $3, $4, 'manual_checkout')
               ON CONFLICT DO NOTHING`,
              [staffUuid, req.user.institution_id, today, overtimeMinutes]
            );
          }
        }
      }
    } catch (otErr) {
      console.error('Overtime tracking error:', otErr.message);
    }

    if (deviceId) {
      await pool.query(
        `INSERT INTO device_logs (staff_uuid, device_id, action, ip_address)
         VALUES ($1, $2, 'check_out', $3)`,
        [staffUuid, deviceId, req.ip]
      );
    }

    res.json({ message: 'Check-out successful', record: record.rows[0] });
  } catch (err) {
    console.error('Check-out error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getMyAttendance = async (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 30 } = req.query;
    const offset = (page - 1) * limit;
    const staffUuid = req.user.id;

    let query = 'SELECT * FROM attendance_records WHERE staff_uuid = $1';
    const params = [staffUuid];
    let paramIndex = 2;

    if (startDate) {
      query += ` AND date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }
    if (endDate) {
      query += ` AND date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    query += ` ORDER BY date DESC, check_in_time DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM attendance_records WHERE staff_uuid = $1';
    const countParams = [staffUuid];
    if (startDate) countParams.push(startDate);
    if (endDate) countParams.push(endDate);
    if (startDate) countQuery += ' AND date >= $2';
    if (endDate) countQuery += ` AND date <= $${countParams.length}`;

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      records: result.rows,
      total: parseInt(countResult.rows[0].count, 10),
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
  } catch (err) {
    console.error('Get attendance error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getTodayStatus = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const result = await pool.query(
      'SELECT * FROM attendance_records WHERE staff_uuid = $1 AND date = $2 ORDER BY check_in_time DESC LIMIT 1',
      [req.user.id, today]
    );

    if (result.rows.length === 0) {
      return res.json({ status: 'not_checked_in', record: null });
    }

    const record = result.rows[0];
    const status = record.check_out_time ? 'checked_out' : 'checked_in';

    res.json({ status, record });
  } catch (err) {
    console.error('Get today status error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getWeeklyStats = async (req, res) => {
  try {
    const staffUuid = req.user.id;

    // Get stats for the current month
    const result = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE check_in_time IS NOT NULL) as total_present,
         COUNT(*) FILTER (WHERE is_late = true) as total_late,
         COUNT(*) FILTER (WHERE check_in_time IS NOT NULL AND is_late = false) as total_on_time,
         ROUND(AVG(EXTRACT(EPOCH FROM (check_out_time - check_in_time)) / 3600)::numeric, 1) as avg_hours
       FROM attendance_records
       WHERE staff_uuid = $1
         AND date >= date_trunc('month', CURRENT_DATE)
         AND date <= CURRENT_DATE`,
      [staffUuid]
    );

    // Get this week's records
    const weekResult = await pool.query(
      `SELECT date, check_in_time, check_out_time, is_late
       FROM attendance_records
       WHERE staff_uuid = $1
         AND date >= date_trunc('week', CURRENT_DATE)
         AND date <= CURRENT_DATE
       ORDER BY date`,
      [staffUuid]
    );

    // Get working days this month from rules
    const rulesResult = await pool.query(
      `SELECT working_days FROM attendance_rules WHERE institution_id = $1`,
      [req.user.institutionId]
    );
    const workingDays = rulesResult.rows[0]?.working_days || [1, 2, 3, 4, 5];

    // Count working days in current month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    let totalWorkingDays = 0;
    for (let d = new Date(monthStart); d <= now; d.setDate(d.getDate() + 1)) {
      if (workingDays.includes(d.getDay())) totalWorkingDays++;
    }

    const stats = result.rows[0];
    const totalAbsent = Math.max(0, totalWorkingDays - parseInt(stats.total_present || 0));

    res.json({
      month: {
        present: parseInt(stats.total_present || 0),
        late: parseInt(stats.total_late || 0),
        onTime: parseInt(stats.total_on_time || 0),
        absent: totalAbsent,
        avgHours: parseFloat(stats.avg_hours || 0),
        workingDays: totalWorkingDays,
      },
      week: weekResult.rows,
    });
  } catch (err) {
    console.error('Get weekly stats error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
