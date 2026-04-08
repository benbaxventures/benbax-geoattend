const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { generateInstitutionQR } = require('../utils/qrcode');
const {
  DEFAULT_TRIAL_DAYS,
  ensureTrialSubscription,
  getCurrentSubscription,
  buildSubscriptionSnapshot,
} = require('../services/subscriptionService');

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
    const result = await pool.query(
      `INSERT INTO institutions (id, name, institution_code, address, city, region, latitude, longitude, geofence_radius)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [id, name, institutionCode, address || null, city || null, region || null, latitude, longitude, geofenceRadius || 200]
    );

    // Some DB setups or triggers may null out the institution_code; ensure it's present
    let created = result.rows[0];
    if (!created.institution_code) {
      // generate a unique code and update the row
      const newCode = await generateInstitutionCode();
      try {
        const upd = await pool.query(
          `UPDATE institutions SET institution_code = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
          [newCode, id]
        );
        if (upd.rows.length > 0) created = upd.rows[0];
        // Immediately re-query to verify
        const verify = await pool.query('SELECT institution_code FROM institutions WHERE id = $1', [id]);
        console.log('Institution code after update:', verify.rows[0]?.institution_code);
      } catch (e) {
        console.error('Failed to set institution_code after create:', e.message || e);
      }
    }
    // Ensure we return the latest persisted row (in case triggers/updates modified it)
    try {
      const fresh = await pool.query('SELECT * FROM institutions WHERE id = $1', [id]);
      if (fresh.rows.length > 0) created = fresh.rows[0];
    } catch (e) {
      console.error('Failed to re-query institution after create:', e.message || e);
    }

    // Create default attendance rules
    await pool.query(
      `INSERT INTO attendance_rules (institution_id, member_type)
       VALUES ($1, 'staff'), ($1, 'student')
       ON CONFLICT DO NOTHING`,
      [id]
    );

    await ensureTrialSubscription(id);

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

exports.getSubscriptionStatus = async (req, res) => {
  try {
    await ensureTrialSubscription(req.user.institution_id);
    const subscription = await getCurrentSubscription(req.user.institution_id);
    res.json({ subscription: buildSubscriptionSnapshot(subscription) });
  } catch (err) {
    console.error('Get subscription status error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const axios = require('axios');

exports.activateSubscription = async (req, res) => {
  try {
    const { planName, durationDays, paymentReference } = req.body;
    const days = parseInt(durationDays || '30', 10);

    if (!Number.isFinite(days) || days < 1 || days > 366) {
      return res.status(400).json({ error: 'durationDays must be between 1 and 366' });
    }

    // If a paymentReference is provided, verify it with Paystack using secret key
    if (paymentReference) {
      const secret = process.env.PAYSTACK_SECRET_KEY;
      if (!secret) {
        return res.status(500).json({ error: 'Payment verification not configured on server' });
      }

      try {
        const verifyRes = await axios.get(`https://api.paystack.co/transaction/verify/${encodeURIComponent(paymentReference)}`, {
          headers: { Authorization: `Bearer ${secret}` },
          timeout: 15000,
        });
        const verified = verifyRes.data && verifyRes.data.data && verifyRes.data.data.status === 'success';
        if (!verified) {
          return res.status(400).json({ error: 'Payment not verified or failed' });
        }
      } catch (verErr) {
        console.error('Paystack verify error:', verErr?.response?.data || verErr.message || verErr);
        return res.status(400).json({ error: 'Failed to verify payment reference' });
      }
    }

    const result = await pool.query(
      `INSERT INTO subscriptions (institution_id, plan_name, status, trial_start, trial_end, current_period_end, payment_reference)
       VALUES ($1, $2, 'active', NULL, NULL, NOW() + ($3 || ' days')::INTERVAL, $4)
       RETURNING id, plan_name, status, trial_start, trial_end, current_period_end, payment_reference`,
      [req.user.institution_id, planName || 'paid_plan', String(days), paymentReference || null]
    );

    res.json({
      message: 'Subscription activated',
      subscription: buildSubscriptionSnapshot(result.rows[0]),
    });
  } catch (err) {
    console.error('Activate subscription error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.extendTrial = async (req, res) => {
  try {
    const extraDays = parseInt(req.body.extraDays || String(DEFAULT_TRIAL_DAYS), 10);
    if (!Number.isFinite(extraDays) || extraDays < 1 || extraDays > 90) {
      return res.status(400).json({ error: 'extraDays must be between 1 and 90' });
    }

    await ensureTrialSubscription(req.user.institution_id);
    const updated = await pool.query(
      `WITH latest AS (
         SELECT id
         FROM subscriptions
         WHERE institution_id = $2
         ORDER BY created_at DESC
         LIMIT 1
       )
       UPDATE subscriptions s
       SET status = 'trialing',
           trial_end = GREATEST(COALESCE(s.trial_end, NOW()), NOW()) + ($1 || ' days')::INTERVAL,
           updated_at = NOW()
       FROM latest
       WHERE s.id = latest.id
       RETURNING s.id, s.plan_name, s.status, s.trial_start, s.trial_end, s.current_period_end, s.payment_reference`,
      [String(extraDays), req.user.institution_id]
    );
    if (updated.rows.length === 0) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    res.json({
      message: 'Trial extended',
      subscription: buildSubscriptionSnapshot(updated.rows[0]),
    });
  } catch (err) {
    console.error('Extend trial error:', err);
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
