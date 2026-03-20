const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

exports.login = async (req, res) => {
  try {
    const { staffId, password, deviceId, deviceModel, osVersion } = req.body;

    if (!staffId || !password) {
      return res.status(400).json({ error: 'Staff ID and password are required' });
    }

    const result = await pool.query(
      `SELECT s.*, i.name as institution_name, i.latitude as inst_lat, i.longitude as inst_lon, i.geofence_radius
       FROM staff s
       JOIN institutions i ON s.institution_id = i.id
       WHERE s.staff_id = $1 AND s.is_active = true`,
      [staffId.toUpperCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const staff = result.rows[0];
    const validPassword = await bcrypt.compare(password, staff.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: staff.id, role: staff.role, institutionId: staff.institution_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Log device info
    if (deviceId) {
      await pool.query(
        `INSERT INTO device_logs (staff_uuid, device_id, device_model, os_version, action, ip_address)
         VALUES ($1, $2, $3, $4, 'login', $5)`,
        [staff.id, deviceId, deviceModel || null, osVersion || null, req.ip]
      );
    }

    res.json({
      token,
      user: {
        id: staff.id,
        staffId: staff.staff_id,
        firstName: staff.first_name,
        lastName: staff.last_name,
        email: staff.email,
        role: staff.role,
        department: staff.department,
        position: staff.position,
        institutionId: staff.institution_id,
        institutionName: staff.institution_name,
        profilePhoto: staff.profile_photo_url,
      },
      institution: {
        latitude: parseFloat(staff.inst_lat),
        longitude: parseFloat(staff.inst_lon),
        geofenceRadius: staff.geofence_radius,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error', debug: err.message });
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const { googleId, email, firstName, lastName, profilePhoto, deviceId, deviceModel, osVersion } = req.body;

    if (!googleId || !email) {
      return res.status(400).json({ error: 'Google ID and email are required' });
    }

    // Check if user exists by google_id or email
    let result = await pool.query(
      `SELECT s.*, i.name as institution_name, i.latitude as inst_lat, i.longitude as inst_lon, i.geofence_radius
       FROM staff s
       JOIN institutions i ON s.institution_id = i.id
       WHERE (s.google_id = $1 OR s.email = $2) AND s.is_active = true`,
      [googleId, email]
    );

    let staff;

    if (result.rows.length === 0) {
      // Auto-register: assign to the first institution
      const instResult = await pool.query('SELECT id FROM institutions ORDER BY created_at LIMIT 1');
      if (instResult.rows.length === 0) {
        return res.status(400).json({ error: 'No institution configured. Contact your administrator.' });
      }

      const institutionId = instResult.rows[0].id;
      const staffId = 'G-' + googleId.slice(-8).toUpperCase();

      const insertResult = await pool.query(
        `INSERT INTO staff (institution_id, staff_id, first_name, last_name, email, google_id, profile_photo_url, role)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'staff')
         RETURNING *`,
        [institutionId, staffId, firstName || 'User', lastName || '', email, googleId, profilePhoto || null]
      );

      // Re-fetch with institution join
      result = await pool.query(
        `SELECT s.*, i.name as institution_name, i.latitude as inst_lat, i.longitude as inst_lon, i.geofence_radius
         FROM staff s
         JOIN institutions i ON s.institution_id = i.id
         WHERE s.id = $1`,
        [insertResult.rows[0].id]
      );
      staff = result.rows[0];
    } else {
      staff = result.rows[0];
      // Link google_id if not yet linked
      if (!staff.google_id) {
        await pool.query('UPDATE staff SET google_id = $1, updated_at = NOW() WHERE id = $2', [googleId, staff.id]);
      }
    }

    const token = jwt.sign(
      { userId: staff.id, role: staff.role, institutionId: staff.institution_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    if (deviceId) {
      await pool.query(
        `INSERT INTO device_logs (staff_uuid, device_id, device_model, os_version, action, ip_address)
         VALUES ($1, $2, $3, $4, 'google_login', $5)`,
        [staff.id, deviceId, deviceModel || null, osVersion || null, req.ip]
      );
    }

    res.json({
      token,
      user: {
        id: staff.id,
        staffId: staff.staff_id,
        firstName: staff.first_name,
        lastName: staff.last_name,
        email: staff.email,
        role: staff.role,
        department: staff.department,
        position: staff.position,
        institutionId: staff.institution_id,
        institutionName: staff.institution_name,
        profilePhoto: staff.profile_photo_url,
      },
      institution: {
        latitude: parseFloat(staff.inst_lat),
        longitude: parseFloat(staff.inst_lon),
        geofenceRadius: staff.geofence_radius,
      },
    });
  } catch (err) {
    console.error('Google login error:', err);
    res.status(500).json({ error: 'Server error', debug: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const result = await pool.query('SELECT password_hash FROM staff WHERE id = $1', [req.user.id]);
    const validPassword = await bcrypt.compare(currentPassword, result.rows[0].password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE staff SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, req.user.id]);

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.id, s.staff_id, s.first_name, s.last_name, s.email, s.phone,
              s.department, s.position, s.role, s.profile_photo_url, s.qr_code_data,
              i.name as institution_name, i.latitude, i.longitude, i.geofence_radius
       FROM staff s
       JOIN institutions i ON s.institution_id = i.id
       WHERE s.id = $1`,
      [req.user.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
