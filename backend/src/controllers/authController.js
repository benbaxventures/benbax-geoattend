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
      `SELECT s.*, i.name as institution_name, i.address as inst_address, i.city as inst_city, i.region as inst_region, i.latitude as inst_lat, i.longitude as inst_lon, i.geofence_radius
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

    // Log device info (non-blocking — don't fail login if this errors)
    if (deviceId) {
      pool.query(
        `INSERT INTO device_logs (staff_uuid, device_id, device_model, os_version, action, ip_address)
         VALUES ($1, $2, $3, $4, 'login', $5)`,
        [staff.id, deviceId, deviceModel || null, osVersion || null, req.ip]
      ).catch(err => console.error('Device log error:', err.message));
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
        name: staff.institution_name,
        address: staff.inst_address,
        city: staff.inst_city,
        region: staff.inst_region,
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

exports.register = async (req, res) => {
  try {
    const { staffId, firstName, lastName, email, phone, password, department, position } = req.body;

    if (!staffId || !firstName || !lastName || !password) {
      return res.status(400).json({ error: 'Staff ID, first name, last name, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Get the first institution (default)
    const instResult = await pool.query('SELECT id FROM institutions ORDER BY created_at LIMIT 1');
    if (instResult.rows.length === 0) {
      return res.status(400).json({ error: 'No institution configured. Contact your administrator.' });
    }
    const institutionId = instResult.rows[0].id;

    // Check if staff ID already exists
    const existing = await pool.query(
      'SELECT id FROM staff WHERE staff_id = $1 AND institution_id = $2',
      [staffId.toUpperCase(), institutionId]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Staff ID already registered. Please login or contact admin.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const qrData = `STAFF-${institutionId}-${staffId.toUpperCase()}`;

    const result = await pool.query(
      `INSERT INTO staff (institution_id, staff_id, first_name, last_name, email, phone, department, position, password_hash, qr_code_data, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'staff')
       RETURNING id`,
      [institutionId, staffId.toUpperCase(), firstName, lastName, email || null, phone || null, department || null, position || null, passwordHash, qrData]
    );

    res.status(201).json({ message: 'Registration successful. You can now login with your Staff ID and password.' });
  } catch (err) {
    console.error('Register error:', err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Staff ID or email already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const { googleId, email, firstName, lastName, profilePhoto, deviceId, deviceModel, osVersion } = req.body;

    if (!googleId || !email) {
      return res.status(400).json({ error: 'Google ID and email are required' });
    }

    // Truncate values to fit column limits safely
    const safe = {
      googleId: String(googleId).slice(0, 255),
      email: String(email).slice(0, 255),
      firstName: (firstName || 'User').slice(0, 100),
      lastName: (lastName || '').slice(0, 100),
      profilePhoto: profilePhoto || null,
      staffId: ('G-' + String(googleId).slice(-8)).toUpperCase().slice(0, 50),
      deviceId: deviceId ? String(deviceId).slice(0, 255) : null,
      deviceModel: deviceModel ? String(deviceModel).slice(0, 255) : null,
      osVersion: osVersion ? String(osVersion).slice(0, 50) : null,
    };

    // Check if user exists by google_id or email
    let result = await pool.query(
      `SELECT s.*, i.name as institution_name, i.address as inst_address, i.city as inst_city, i.region as inst_region, i.latitude as inst_lat, i.longitude as inst_lon, i.geofence_radius
       FROM staff s
       JOIN institutions i ON s.institution_id = i.id
       WHERE (s.google_id = $1 OR s.email = $2) AND s.is_active = true`,
      [safe.googleId, safe.email]
    );

    let staff;

    if (result.rows.length === 0) {
      // Auto-register: assign to the first institution
      const instResult = await pool.query('SELECT id FROM institutions ORDER BY created_at LIMIT 1');
      if (instResult.rows.length === 0) {
        return res.status(400).json({ error: 'No institution configured. Contact your administrator.' });
      }

      const institutionId = instResult.rows[0].id;

      const insertResult = await pool.query(
        `INSERT INTO staff (institution_id, staff_id, first_name, last_name, email, google_id, profile_photo_url, role)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'staff')
         RETURNING *`,
        [institutionId, safe.staffId, safe.firstName, safe.lastName, safe.email, safe.googleId, safe.profilePhoto]
      );

      // Re-fetch with institution join
      result = await pool.query(
        `SELECT s.*, i.name as institution_name, i.address as inst_address, i.city as inst_city, i.region as inst_region, i.latitude as inst_lat, i.longitude as inst_lon, i.geofence_radius
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
        await pool.query('UPDATE staff SET google_id = $1, updated_at = NOW() WHERE id = $2', [safe.googleId, staff.id]);
      }
    }

    const token = jwt.sign(
      { userId: staff.id, role: staff.role, institutionId: staff.institution_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Device log — non-blocking so it can't crash login
    if (safe.deviceId) {
      pool.query(
        `INSERT INTO device_logs (staff_uuid, device_id, device_model, os_version, action, ip_address)
         VALUES ($1, $2, $3, $4, 'google_login', $5)`,
        [staff.id, safe.deviceId, safe.deviceModel, safe.osVersion, req.ip]
      ).catch(err => console.error('Device log error:', err.message));
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
        name: staff.institution_name,
        address: staff.inst_address,
        city: staff.inst_city,
        region: staff.inst_region,
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

exports.forgotPassword = async (req, res) => {
  try {
    const { staffId, email, newPassword } = req.body;

    if (!staffId || !email || !newPassword) {
      return res.status(400).json({ error: 'Staff ID, email, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const result = await pool.query(
      'SELECT id FROM staff WHERE staff_id = $1 AND email = $2 AND is_active = true',
      [staffId.toUpperCase(), email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No account found with that Staff ID and email combination' });
    }

    const hash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE staff SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hash, result.rows[0].id]);

    res.json({ message: 'Password reset successfully. You can now login with your new password.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const staff = req.user;
    const token = jwt.sign(
      { userId: staff.userId || staff.id, role: staff.role, institutionId: staff.institutionId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
    res.json({ token });
  } catch (err) {
    console.error('Refresh token error:', err);
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
