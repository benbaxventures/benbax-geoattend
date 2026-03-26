const pool = require('../config/database');

// Get all courses for institution
exports.getCourses = async (req, res) => {
  try {
    const { search, department } = req.query;
    let query = `
      SELECT c.*,
        (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.status = 'active') as enrolled_count,
        (SELECT string_agg(s.first_name || ' ' || s.last_name, ', ')
         FROM course_lecturers cl JOIN staff s ON cl.lecturer_id = s.id WHERE cl.course_id = c.id) as lecturers
      FROM courses c
      WHERE c.institution_id = $1 AND c.is_active = true
    `;
    const params = [req.user.institution_id];
    let idx = 2;

    if (search) {
      query += ` AND (c.code ILIKE $${idx} OR c.name ILIKE $${idx})`;
      params.push(`%${search}%`);
      idx++;
    }
    if (department) {
      query += ` AND c.department = $${idx}`;
      params.push(department);
      idx++;
    }

    query += ' ORDER BY c.code';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Get courses error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Create course
exports.createCourse = async (req, res) => {
  try {
    const { code, name, department, creditHours, attendanceThreshold } = req.body;
    if (!code || !name) return res.status(400).json({ error: 'Course code and name are required' });

    const result = await pool.query(
      `INSERT INTO courses (institution_id, code, name, department, credit_hours, attendance_threshold)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.institution_id, code.toUpperCase(), name, department || null, creditHours || 3, attendanceThreshold || 75]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Course code already exists' });
    console.error('Create course error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update course
exports.updateCourse = async (req, res) => {
  try {
    const { name, department, creditHours, attendanceThreshold, isActive } = req.body;
    const result = await pool.query(
      `UPDATE courses SET name = COALESCE($1, name), department = COALESCE($2, department),
       credit_hours = COALESCE($3, credit_hours), attendance_threshold = COALESCE($4, attendance_threshold),
       is_active = COALESCE($5, is_active), updated_at = NOW()
       WHERE id = $6 AND institution_id = $7 RETURNING *`,
      [name, department, creditHours, attendanceThreshold, isActive, req.params.id, req.user.institution_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Course not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update course error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Assign lecturer to course
exports.assignLecturer = async (req, res) => {
  try {
    const { lecturerId } = req.body;
    await pool.query(
      `INSERT INTO course_lecturers (course_id, lecturer_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [req.params.id, lecturerId]
    );
    // Update staff role to lecturer
    await pool.query(`UPDATE staff SET role = 'lecturer', member_type = 'lecturer' WHERE id = $1`, [lecturerId]);
    res.json({ message: 'Lecturer assigned' });
  } catch (err) {
    console.error('Assign lecturer error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Enroll students in course
exports.enrollStudents = async (req, res) => {
  try {
    const { studentIds, semester } = req.body;
    if (!studentIds || !Array.isArray(studentIds)) return res.status(400).json({ error: 'studentIds array required' });

    let enrolled = 0;
    for (const studentId of studentIds) {
      try {
        await pool.query(
          `INSERT INTO enrollments (course_id, student_id, semester) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
          [req.params.id, studentId, semester || '2025/2026-2']
        );
        enrolled++;
      } catch {}
    }
    res.json({ message: `${enrolled} students enrolled` });
  } catch (err) {
    console.error('Enroll students error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get enrolled students for a course
exports.getEnrolledStudents = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.id, s.staff_id, s.first_name, s.last_name, s.email, s.department, e.status, e.semester
       FROM enrollments e JOIN staff s ON e.student_id = s.id
       WHERE e.course_id = $1 AND e.status = 'active'
       ORDER BY s.last_name, s.first_name`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get enrolled students error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Add lecture schedule
exports.addSchedule = async (req, res) => {
  try {
    const { dayOfWeek, startTime, endTime, venue } = req.body;
    const result = await pool.query(
      `INSERT INTO lecture_schedules (course_id, institution_id, day_of_week, start_time, end_time, venue)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.params.id, req.user.institution_id, dayOfWeek, startTime, endTime, venue || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Add schedule error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get schedules for a course
exports.getSchedules = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM lecture_schedules WHERE course_id = $1 AND is_active = true ORDER BY day_of_week, start_time`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get schedules error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
