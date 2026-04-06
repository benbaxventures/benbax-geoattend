const pool = require('../config/database');
const { isWithinGeofence } = require('../utils/geofence');
const { sendSMS } = require('../services/smsService');

async function getAdminsWithContacts(institutionId) {
  const admins = await pool.query(
    `SELECT first_name, last_name, staff_id, phone, email, push_token
     FROM staff
     WHERE institution_id = $1
       AND role IN ('admin', 'super_admin')
       AND is_active = true`,
    [institutionId]
  );
  return admins.rows;
}

exports.recordEvent = async (req, res) => {
  try {
    const { latitude, longitude, source } = req.body || {};
    const staffUuid = req.user.id;
    const institutionId = req.user.institution_id;

    if (latitude == null || longitude == null) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const instResult = await pool.query(
      'SELECT latitude, longitude, geofence_radius, name FROM institutions WHERE id = $1',
      [institutionId]
    );
    if (instResult.rows.length === 0) {
      return res.status(400).json({ error: 'Institution not found' });
    }
    const inst = instResult.rows[0];

    const geofenceCheck = isWithinGeofence(
      parseFloat(latitude),
      parseFloat(longitude),
      parseFloat(inst.latitude),
      parseFloat(inst.longitude),
      inst.geofence_radius
    );

    const currentEvent = geofenceCheck.isWithin ? 'enter' : 'exit';
    const currentState = geofenceCheck.isWithin ? 'inside' : 'outside';

    // Get last event for this staff to determine state change
    const lastEventResult = await pool.query(
      `SELECT event, created_at
       FROM geofence_events
       WHERE staff_uuid = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [staffUuid]
    );

    let previousState = 'unknown';
    if (lastEventResult.rows.length > 0) {
      previousState = lastEventResult.rows[0].event === 'exit' ? 'outside' : 'inside';
    }

    const isStateChange = previousState !== currentState;

    // Always record the event so reporting has full history
    const insertResult = await pool.query(
      `INSERT INTO geofence_events (
         institution_id, staff_uuid, event,
         latitude, longitude, distance_m, radius_m
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        institutionId,
        staffUuid,
        currentEvent,
        latitude,
        longitude,
        geofenceCheck.distance,
        geofenceCheck.radius,
      ]
    );

    let alerted = false;

    // Anti-spam: only alert on inside -> outside transitions, with cooldown
    if (isStateChange && currentState === 'outside') {
      const cooldownMinutes = parseInt(process.env.GEOFENCE_ALERT_COOLDOWN_MINUTES || '15', 10);
      const recentExit = await pool.query(
        `SELECT created_at
         FROM geofence_events
         WHERE staff_uuid = $1 AND event = 'exit'
         ORDER BY created_at DESC
         LIMIT 1`,
        [staffUuid]
      );

      let allowAlert = true;
      if (recentExit.rows.length > 0) {
        const lastExitAt = new Date(recentExit.rows[0].created_at);
        const diffMinutes = (Date.now() - lastExitAt.getTime()) / 60000;
        if (diffMinutes < cooldownMinutes) {
          allowAlert = false;
        }
      }

      if (allowAlert) {
        const staffResult = await pool.query(
          `SELECT staff_id, first_name, last_name, member_type
           FROM staff
           WHERE id = $1`,
          [staffUuid]
        );
        const staff = staffResult.rows[0];
        const name = `${staff?.first_name || ''} ${staff?.last_name || ''}`.trim() || staff?.staff_id || 'Member';
        const idLabel = staff?.staff_id || '';
        const typeLabel = staff?.member_type || 'staff';

        const admins = await getAdminsWithContacts(institutionId);
        const message = `ALERT: ${name} (${idLabel}, ${typeLabel}) left ${inst.name} geofence at ${new Date().toLocaleTimeString()}. Distance ${geofenceCheck.distance}m (radius ${geofenceCheck.radius}m).`;

        // SMS to admins where phone is available
        for (const admin of admins) {
          if (admin.phone) {
            try {
              await sendSMS(admin.phone, message);
              alerted = true;
            } catch (smsErr) {
              console.error('Geofence SMS error:', smsErr.message);
            }
          }
        }

        // TODO: email / push notifications can be added here using existing services
      }
    }

    res.status(201).json({
      message: 'Geofence event recorded',
      event: insertResult.rows[0],
      state: currentState,
      isWithin: geofenceCheck.isWithin,
      distance: geofenceCheck.distance,
      radius: geofenceCheck.radius,
      alerted,
      source: source || 'unknown',
    });
  } catch (err) {
    console.error('Geofence event error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

