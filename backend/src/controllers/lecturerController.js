const pool = require('../config/database');

// Get lecturer's courses
exports.getMyCourses = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*,
        (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.status = 'active') as enrolled_count
       FROM course_lecturers cl
       JOIN courses c ON cl.course_id = c.id
       WHERE cl.lecturer_id = $1 AND c.is_active = true
       ORDER BY c.code`,
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get lecturer courses error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get today's lectures for lecturer
exports.getTodayLectures = async (req, res) => {
  try {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const dateStr = today.toISOString().split('T')[0];

    // Auto-create lecture instances from schedule if not exists
    await pool.query(
      `INSERT INTO lecture_instances (schedule_id, course_id, institution_id, date, start_time, end_time)
       SELECT ls.id, ls.course_id, ls.institution_id, $1::date, ls.start_time, ls.end_time
       FROM lecture_schedules ls
       JOIN course_lecturers cl ON cl.course_id = ls.course_id
       WHERE cl.lecturer_id = $2 AND ls.day_of_week = $3 AND ls.is_active = true
       ON CONFLICT (course_id, date, start_time) DO NOTHING`,
      [dateStr, req.user.userId, dayOfWeek]
    );

    // Fetch today's lectures with attendance count
    const result = await pool.query(
      `SELECT li.*, c.code as course_code, c.name as course_name, ls.venue,
        (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = li.course_id AND e.status = 'active') as total_students,
        (SELECT COUNT(*) FROM lecture_attendance la WHERE la.lecture_instance_id = li.id) as present_count,
        (SELECT COUNT(*) FROM lecture_attendance la WHERE la.lecture_instance_id = li.id AND la.is_late = true) as late_count
       FROM lecture_instances li
       JOIN courses c ON li.course_id = c.id
       LEFT JOIN lecture_schedules ls ON li.schedule_id = ls.id
       JOIN course_lecturers cl ON cl.course_id = li.course_id
       WHERE cl.lecturer_id = $1 AND li.date = $2
       ORDER BY li.start_time`,
      [req.user.userId, dateStr]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get today lectures error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get real-time attendance for a lecture instance
exports.getLectureAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    // Get all enrolled students with their attendance status
    const result = await pool.query(
      `SELECT s.id, s.staff_id, s.first_name, s.last_name, s.email, s.profile_photo_url,
        la.check_in_time, la.is_late, la.method,
        CASE WHEN la.id IS NOT NULL THEN 'present' ELSE 'absent' END as status
       FROM lecture_instances li
       JOIN enrollments e ON e.course_id = li.course_id AND e.status = 'active'
       JOIN staff s ON e.student_id = s.id
       LEFT JOIN lecture_attendance la ON la.lecture_instance_id = li.id AND la.student_id = s.id
       WHERE li.id = $1
       ORDER BY s.last_name, s.first_name`,
      [id]
    );

    // Get summary
    const summary = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM enrollments e JOIN lecture_instances li ON li.course_id = e.course_id WHERE li.id = $1 AND e.status = 'active') as total,
        (SELECT COUNT(*) FROM lecture_attendance WHERE lecture_instance_id = $1) as present,
        (SELECT COUNT(*) FROM lecture_attendance WHERE lecture_instance_id = $1 AND is_late = true) as late`,
      [id]
    );

    res.json({
      students: result.rows,
      summary: summary.rows[0],
    });
  } catch (err) {
    console.error('Get lecture attendance error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get attendance percentage per course per student
exports.getCourseAttendanceStats = async (req, res) => {
  try {
    const { courseId } = req.params;

    const result = await pool.query(
      `SELECT s.id, s.staff_id, s.first_name, s.last_name,
        COUNT(DISTINCT li.id) as total_lectures,
        COUNT(DISTINCT la.lecture_instance_id) as attended,
        ROUND(
          CASE WHEN COUNT(DISTINCT li.id) > 0
            THEN (COUNT(DISTINCT la.lecture_instance_id)::numeric / COUNT(DISTINCT li.id)::numeric * 100)
            ELSE 0 END, 1
        ) as attendance_percentage,
        c.attendance_threshold
       FROM enrollments e
       JOIN staff s ON e.student_id = s.id
       JOIN courses c ON e.course_id = c.id
       CROSS JOIN lecture_instances li ON li.course_id = e.course_id AND li.status IN ('completed', 'ongoing')
       LEFT JOIN lecture_attendance la ON la.lecture_instance_id = li.id AND la.student_id = s.id
       WHERE e.course_id = $1 AND e.status = 'active'
       GROUP BY s.id, s.staff_id, s.first_name, s.last_name, c.attendance_threshold
       ORDER BY attendance_percentage ASC`,
      [courseId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Get course attendance stats error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get student's attendance across all courses (for student mobile app)
exports.getStudentCourseAttendance = async (req, res) => {
  try {
    const studentId = req.user.userId;

    const result = await pool.query(
      `SELECT c.id, c.code, c.name, c.attendance_threshold,
        COUNT(DISTINCT li.id) as total_lectures,
        COUNT(DISTINCT la.lecture_instance_id) as attended,
        ROUND(
          CASE WHEN COUNT(DISTINCT li.id) > 0
            THEN (COUNT(DISTINCT la.lecture_instance_id)::numeric / COUNT(DISTINCT li.id)::numeric * 100)
            ELSE 0 END, 1
        ) as attendance_percentage
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       LEFT JOIN lecture_instances li ON li.course_id = c.id AND li.status IN ('completed', 'ongoing')
       LEFT JOIN lecture_attendance la ON la.lecture_instance_id = li.id AND la.student_id = e.student_id
       WHERE e.student_id = $1 AND e.status = 'active'
       GROUP BY c.id, c.code, c.name, c.attendance_threshold
       ORDER BY c.code`,
      [studentId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Get student course attendance error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
