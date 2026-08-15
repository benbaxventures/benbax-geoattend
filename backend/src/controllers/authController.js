const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const crypto = require('crypto');
const {
  normalizeInstitutionCode,
  getInstitutionByCode,
  ensureTrialSubscription,
  getCurrentSubscription,
  buildSubscriptionSnapshot,
} = require('../services/subscriptionService');

async function getSubscriptionPayload(institutionId) {
  await ensureTrialSubscription(institutionId);
  const subscription = await getCurrentSubscription(institutionId);
  return buildSubscriptionSnapshot(subscription);
}

/** Never fail login if subscriptions table or trial row is missing. */
async function getSubscriptionPayloadSafe(institutionId) {
  try {
    return await getSubscriptionPayload(institutionId);
  } catch (e) {
    console.error('Login: subscription payload skipped:', e.message);
    return null;
  }
}

exports.login = async (req, res) => {
  try {
    const { staffId, password, institutionCode, deviceId, deviceModel, osVersion, memberType } = req.body;
    const normalizedMemberType = (memberType || 'staff').toLowerCase();
    const normalizedInstitutionCode = normalizeInstitutionCode(institutionCode);

    if (!staffId || !password) {
      return res.status(400).json({ error: 'Staff ID and password are required' });
    }

    let institution;
    let result;
    let staff;

    if (normalizedInstitutionCode) {
      institution = await getInstitutionByCode(normalizedInstitutionCode);
      if (!institution) {
        return res.status(404).json({ error: 'Invalid institution code' });
      }

      result = await pool.query(
        `SELECT s.*, i.name as institution_name, i.address as inst_address, i.city as inst_city, i.region as inst_region,
                i.latitude as inst_lat, i.longitude as inst_lon, i.geofence_radius, i.institution_code as inst_institution_code
         FROM staff s
         JOIN institutions i ON s.institution_id = i.id
         WHERE s.staff_id = $1 AND s.member_type = $2 AND s.institution_id = $3 AND s.is_active = true`,
        [staffId.toUpperCase(), normalizedMemberType, institution.id]
      );
      if (result.rows.length === 0) {
        return res.status(401).json({
          error:
            `No account found with Staff ID "${staffId}" for institution code "${normalizedInstitutionCode}". Please check your Staff ID and institution code, or contact your institution administrator.`,
        });
      }
    } else {
      // No institution code provided — try to resolve by staffId across institutions
      result = await pool.query(
        `SELECT s.*, i.name as institution_name, i.address as inst_address, i.city as inst_city, i.region as inst_region, i.latitude as inst_lat, i.longitude as inst_lon, i.geofence_radius, i.institution_code
         FROM staff s
         JOIN institutions i ON s.institution_id = i.id
         WHERE s.staff_id = $1 AND s.member_type = $2 AND s.is_active = true AND s.role IN ('admin','super_admin')`,
        [staffId.toUpperCase(), normalizedMemberType]
      );

      if (result.rows.length === 0) {
        return res.status(400).json({ error: 'Staff not found. Please provide your institution code.' });
      }
      if (result.rows.length > 1) {
        return res.status(400).json({ error: 'Multiple institutions found for this Staff ID — please provide your institution code.' });
      }
      institution = { id: result.rows[0].institution_id, institution_code: result.rows[0].institution_code };
    }

    staff = result.rows[0];
    if (!staff.password_hash) {
      return res.status(401).json({ error: 'Password login is not set for this account. Please reset your password.' });
    }
    const validPassword = await bcrypt.compare(password, staff.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: staff.id, role: staff.role, institutionId: staff.institution_id, memberType: staff.member_type },
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

    const subscription = await getSubscriptionPayloadSafe(staff.institution_id);

    const institutionCodeOut =
      institution?.institution_code ||
      staff.inst_institution_code ||
      normalizedInstitutionCode ||
      null;

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
        memberType: staff.member_type,
        institutionId: staff.institution_id,
        institutionName: staff.institution_name,
        profilePhoto: staff.profile_photo_url,
      },
      institution: {
        code: institutionCodeOut,
        name: staff.institution_name,
        address: staff.inst_address,
        city: staff.inst_city,
        region: staff.inst_region,
        latitude: parseFloat(staff.inst_lat),
        longitude: parseFloat(staff.inst_lon),
        geofenceRadius: staff.geofence_radius,
      },
      subscription,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error', debug: err.message });
  }
};

exports.register = async (req, res) => {
  try {
    const { staffId, firstName, lastName, email, phone, password, department, position, institutionCode, memberType } = req.body;
    const normalizedMemberType = (memberType || 'staff').toLowerCase();
    const normalizedInstitutionCode = normalizeInstitutionCode(institutionCode);

    if (!staffId || !firstName || !lastName || !password || !normalizedInstitutionCode) {
      return res.status(400).json({ error: 'Staff ID, first name, last name, password, and institution code are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const institution = await getInstitutionByCode(normalizedInstitutionCode);
    if (!institution) {
      return res.status(404).json({ error: 'Invalid institution code' });
    }
    const institutionId = institution.id;

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
      `INSERT INTO staff (institution_id, staff_id, first_name, last_name, email, phone, department, position, password_hash, qr_code_data, role, member_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'staff', $11)
       RETURNING id`,
      [institutionId, staffId.toUpperCase(), firstName, lastName, email || null, phone || null, department || null, position || null, passwordHash, qrData, normalizedMemberType]
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

    // Clear any stored plaintext credential for this institution so the super admin
    // can no longer hand out a stale password; they must reset it from the dashboard.
    await pool.query(
      'DELETE FROM institution_admin_credentials WHERE institution_id = $1',
      [req.user.institution_id]
    ).catch(() => {});

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { staffId, email, newPassword, institutionCode, memberType } = req.body;
    const normalizedMemberType = (memberType || 'staff').toLowerCase();
    const normalizedInstitutionCode = normalizeInstitutionCode(institutionCode);

    if (!staffId || !email || !newPassword || !normalizedInstitutionCode) {
      return res.status(400).json({ error: 'Staff ID, email, new password, and institution code are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const institution = await getInstitutionByCode(normalizedInstitutionCode);
    if (!institution) {
      return res.status(404).json({ error: 'Invalid institution code' });
    }

    const result = await pool.query(
      'SELECT id FROM staff WHERE staff_id = $1 AND email = $2 AND member_type = $3 AND institution_id = $4 AND is_active = true',
      [staffId.toUpperCase(), email.toLowerCase().trim(), normalizedMemberType, institution.id]
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

// Super-admin helper: create the initial admin for an institution and return credentials.
exports.createInitialAdmin = async (req, res) => {
  try {
    const { institutionCode, staffId, firstName, lastName, email, phone, memberType } = req.body;
    const normalizedMemberType = (memberType || 'staff').toLowerCase();
    const normalizedInstitutionCode = normalizeInstitutionCode(institutionCode);

    if (!normalizedInstitutionCode) {
      return res.status(400).json({ error: 'Institution code is required' });
    }

    const institution = await getInstitutionByCode(normalizedInstitutionCode);
    if (!institution) {
      return res.status(404).json({ error: 'Invalid institution code' });
    }

    const institutionId = institution.id;

    // Prevent creating a second admin if one already exists for this institution
    const existingAdmin = await pool.query(
      "SELECT id FROM staff WHERE institution_id = $1 AND role IN ('admin','super_admin')",
      [institutionId]
    );
    if (existingAdmin.rows.length > 0) {
      return res.status(409).json({ error: 'An admin account already exists for this institution' });
    }

    const finalStaffId = staffId ? staffId.toUpperCase() : ('ADMIN' + crypto.randomBytes(3).toString('hex').toUpperCase());

    // Ensure unique staff id within institution
    const collide = await pool.query('SELECT id FROM staff WHERE staff_id = $1 AND institution_id = $2', [finalStaffId, institutionId]);
    if (collide.rows.length > 0) {
      return res.status(409).json({ error: 'Generated Staff ID already exists — try again' });
    }

    const rawPassword = crypto.randomBytes(4).toString('hex');
    const passwordHash = await bcrypt.hash(rawPassword, 12);
    const qrData = `STAFF-${institutionId}-${finalStaffId}`;

    const insertResult = await pool.query(
      `INSERT INTO staff (institution_id, staff_id, first_name, last_name, email, phone, password_hash, qr_code_data, role, member_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'admin', $9)
       RETURNING id, staff_id, first_name, last_name, email`,
      [institutionId, finalStaffId, firstName || 'Admin', lastName || 'User', email || null, phone || null, passwordHash, qrData, normalizedMemberType]
    );

    // Store the plaintext credentials so the super admin can retrieve them later.
    await pool.query(
      `INSERT INTO institution_admin_credentials (institution_id, admin_staff_id, admin_password)
       VALUES ($1, $2, $3)
       ON CONFLICT (institution_id) DO UPDATE SET
         admin_staff_id = EXCLUDED.admin_staff_id,
         admin_password = EXCLUDED.admin_password,
         updated_at = NOW()`,
      [institutionId, finalStaffId, rawPassword]
    ).catch(err => console.error('Create initial admin: store credentials error:', err.message));

    // Return the plaintext password once so the super-admin can relay it securely.
    res.status(201).json({
      message: 'Initial admin created',
      credentials: { staffId: finalStaffId, password: rawPassword },
      staff: insertResult.rows[0],
    });
  } catch (err) {
    console.error('Create initial admin error:', err);
    if (err.code === '23505') return res.status(409).json({ error: 'Staff ID or email already exists' });
    res.status(500).json({ error: 'Server error' });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const staff = req.user;
    const token = jwt.sign(
      {
        userId: staff.userId || staff.id,
        role: staff.role,
        institutionId: staff.institution_id || staff.institutionId,
        memberType: staff.member_type || staff.memberType,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
    res.json({ token });
  } catch (err) {
    console.error('Refresh token error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.savePushToken = async (req, res) => {
  try {
    const { pushToken } = req.body;
    if (!pushToken) return res.status(400).json({ error: 'Push token is required' });

    await pool.query(
      `UPDATE staff SET push_token = $1, updated_at = NOW() WHERE id = $2`,
      [pushToken, req.user.id]
    );
    res.json({ message: 'Push token saved' });
  } catch (err) {
    console.error('Save push token error:', err);
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
