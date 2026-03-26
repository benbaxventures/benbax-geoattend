-- Courses table
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id),
  code VARCHAR(20) NOT NULL,
  name VARCHAR(255) NOT NULL,
  department VARCHAR(100),
  credit_hours INTEGER DEFAULT 3,
  attendance_threshold INTEGER DEFAULT 75,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(institution_id, code)
);

-- Lecturers (link staff to lecturer role with courses)
CREATE TABLE IF NOT EXISTS course_lecturers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lecturer_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(course_id, lecturer_id)
);

-- Student enrollments in courses
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  semester VARCHAR(20) DEFAULT '2025/2026-2',
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'dropped', 'completed')),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(course_id, student_id, semester)
);

-- Timetable / scheduled lectures
CREATE TABLE IF NOT EXISTS lecture_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES institutions(id),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  venue VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Lecture instances (auto-created from schedule)
CREATE TABLE IF NOT EXISTS lecture_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES lecture_schedules(id) ON DELETE SET NULL,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES institutions(id),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled')),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(course_id, date, start_time)
);

-- Lecture attendance (per-lecture check-in)
CREATE TABLE IF NOT EXISTS lecture_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecture_instance_id UUID NOT NULL REFERENCES lecture_instances(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  check_in_time TIMESTAMP NOT NULL DEFAULT NOW(),
  is_late BOOLEAN DEFAULT false,
  is_within_geofence BOOLEAN DEFAULT true,
  method VARCHAR(20) DEFAULT 'gps' CHECK (method IN ('gps', 'qr_code', 'manual', 'auto')),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(lecture_instance_id, student_id)
);

-- Parent/guardian contacts
CREATE TABLE IF NOT EXISTS guardians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  relationship VARCHAR(50) DEFAULT 'parent',
  notify_on_absence BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Absence notifications log
CREATE TABLE IF NOT EXISTS absence_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  lecture_instance_id UUID REFERENCES lecture_instances(id) ON DELETE SET NULL,
  guardian_id UUID REFERENCES guardians(id) ON DELETE SET NULL,
  notification_type VARCHAR(20) NOT NULL CHECK (notification_type IN ('student', 'guardian', 'both')),
  channel VARCHAR(20) DEFAULT 'push' CHECK (channel IN ('push', 'sms', 'email')),
  message TEXT,
  sent_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed'))
);

-- Add lecturer role to staff
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_role_check;
ALTER TABLE staff ADD CONSTRAINT staff_role_check
  CHECK (role IN ('super_admin', 'admin', 'lecturer', 'staff', 'student'));

-- Add member_type student
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_member_type_check;
ALTER TABLE staff ADD CONSTRAINT staff_member_type_check
  CHECK (member_type IN ('staff', 'student', 'lecturer'));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_lecture_attendance_instance ON lecture_attendance(lecture_instance_id);
CREATE INDEX IF NOT EXISTS idx_lecture_attendance_student ON lecture_attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_lecture_instances_date ON lecture_instances(date);
CREATE INDEX IF NOT EXISTS idx_lecture_instances_course ON lecture_instances(course_id);
CREATE INDEX IF NOT EXISTS idx_guardians_student ON guardians(student_id);
