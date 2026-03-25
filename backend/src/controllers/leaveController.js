const pool = require('../config/database');

// Staff: request leave
exports.requestLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;
    const staffUuid = req.user.id;
    const institutionId = req.user.institution_id;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start and end dates are required' });
    }

    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ error: 'Start date must be before end date' });
    }

    if (new Date(startDate) < new Date().setHours(0, 0, 0, 0)) {
      return res.status(400).json({ error: 'Cannot request leave for past dates' });
    }

    // Check for overlapping leave requests
    const overlap = await pool.query(
      `SELECT id FROM leave_requests
       WHERE staff_uuid = $1 AND status IN ('pending', 'approved')
         AND start_date <= $3 AND end_date >= $2`,
      [staffUuid, startDate, endDate]
    );

    if (overlap.rows.length > 0) {
      return res.status(400).json({ error: 'You already have a leave request for these dates' });
    }

    const result = await pool.query(
      `INSERT INTO leave_requests (staff_uuid, institution_id, leave_type, start_date, end_date, reason)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [staffUuid, institutionId, leaveType || 'personal', startDate, endDate, reason || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Request leave error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Staff: get my leave requests
exports.getMyLeaves = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT lr.*, s.first_name as reviewer_first_name, s.last_name as reviewer_last_name
       FROM leave_requests lr
       LEFT JOIN staff s ON lr.reviewed_by = s.id
       WHERE lr.staff_uuid = $1
       ORDER BY lr.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get my leaves error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Staff: cancel own pending leave
exports.cancelLeave = async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE leave_requests SET status = 'cancelled', updated_at = NOW()
       WHERE id = $1 AND staff_uuid = $2 AND status = 'pending'
       RETURNING *`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Leave request not found or cannot be cancelled' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Cancel leave error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Admin: get all leave requests for institution
exports.getAllLeaves = async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    const institutionId = req.user.institution_id;

    let query = `
      SELECT lr.*, s.staff_id, s.first_name, s.last_name, s.department,
             r.first_name as reviewer_first_name, r.last_name as reviewer_last_name
      FROM leave_requests lr
      JOIN staff s ON lr.staff_uuid = s.id
      LEFT JOIN staff r ON lr.reviewed_by = r.id
      WHERE lr.institution_id = $1`;
    const params = [institutionId];
    let paramIndex = 2;

    if (status) {
      query += ` AND lr.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY lr.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const result = await pool.query(query, params);

    const countQuery = `SELECT COUNT(*) FROM leave_requests WHERE institution_id = $1${status ? ' AND status = $2' : ''}`;
    const countParams = status ? [institutionId, status] : [institutionId];
    const countResult = await pool.query(countQuery, countParams);

    res.json({
      leaves: result.rows,
      total: parseInt(countResult.rows[0].count, 10),
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
  } catch (err) {
    console.error('Get all leaves error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Admin: approve or reject leave
exports.reviewLeave = async (req, res) => {
  try {
    const { status, reviewNote } = req.body;
    const { id } = req.params;
    const institutionId = req.user.institution_id;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be approved or rejected' });
    }

    const existing = await pool.query(
      'SELECT id, status FROM leave_requests WHERE id = $1 AND institution_id = $2',
      [id, institutionId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    if (existing.rows[0].status !== 'pending') {
      return res.status(400).json({ error: 'Can only review pending requests' });
    }

    const result = await pool.query(
      `UPDATE leave_requests
       SET status = $1, reviewed_by = $2, reviewed_at = NOW(), review_note = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [status, req.user.id, reviewNote || null, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Review leave error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get leave stats for dashboard
exports.getLeaveStats = async (req, res) => {
  try {
    const institutionId = req.user.institution_id;
    const result = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'approved') as approved,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
        COUNT(*) FILTER (WHERE status = 'approved' AND start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE) as on_leave_today
      FROM leave_requests WHERE institution_id = $1
    `, [institutionId]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Leave stats error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
