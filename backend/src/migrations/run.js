require('dotenv').config();

const migration = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Institutions table
CREATE TABLE IF NOT EXISTS institutions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  city VARCHAR(100),
  region VARCHAR(100),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  geofence_radius INTEGER NOT NULL DEFAULT 200,
  timezone VARCHAR(50) DEFAULT 'Africa/Accra',
  logo_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Staff table
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  staff_id VARCHAR(50) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  department VARCHAR(100),
  position VARCHAR(100),
  password_hash VARCHAR(255) NOT NULL,
  qr_code_data VARCHAR(255) UNIQUE,
  profile_photo_url TEXT,
  role VARCHAR(20) DEFAULT 'staff' CHECK (role IN ('staff', 'admin', 'super_admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(institution_id, staff_id)
);

-- Attendance records table
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_uuid UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  check_in_time TIMESTAMP NOT NULL,
  check_out_time TIMESTAMP,
  check_in_latitude DECIMAL(10, 8),
  check_in_longitude DECIMAL(11, 8),
  check_out_latitude DECIMAL(10, 8),
  check_out_longitude DECIMAL(11, 8),
  check_in_method VARCHAR(20) NOT NULL CHECK (check_in_method IN ('gps', 'qr_code', 'nfc', 'manual')),
  check_out_method VARCHAR(20) CHECK (check_out_method IN ('gps', 'qr_code', 'nfc', 'manual')),
  device_id VARCHAR(255),
  is_late BOOLEAN DEFAULT false,
  is_within_geofence BOOLEAN DEFAULT true,
  notes TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Attendance rules table
CREATE TABLE IF NOT EXISTS attendance_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  work_start_time TIME NOT NULL DEFAULT '08:00:00',
  work_end_time TIME NOT NULL DEFAULT '17:00:00',
  late_threshold_minutes INTEGER DEFAULT 15,
  early_departure_minutes INTEGER DEFAULT 30,
  working_days INTEGER[] DEFAULT '{1,2,3,4,5}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Device log table
CREATE TABLE IF NOT EXISTS device_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_uuid UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  device_id VARCHAR(255) NOT NULL,
  device_model VARCHAR(255),
  os_version VARCHAR(50),
  app_version VARCHAR(20),
  action VARCHAR(50) NOT NULL,
  ip_address VARCHAR(45),
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Google OAuth support
ALTER TABLE staff ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;
ALTER TABLE staff ALTER COLUMN password_hash DROP NOT NULL;

-- Ensure column sizes are correct (in case table was created with smaller sizes)
ALTER TABLE staff ALTER COLUMN profile_photo_url TYPE TEXT;
ALTER TABLE staff ALTER COLUMN staff_id TYPE VARCHAR(50);
ALTER TABLE staff ALTER COLUMN first_name TYPE VARCHAR(100);
ALTER TABLE staff ALTER COLUMN last_name TYPE VARCHAR(100);
ALTER TABLE staff ALTER COLUMN email TYPE VARCHAR(255);
ALTER TABLE staff ALTER COLUMN google_id TYPE VARCHAR(255);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_staff ON attendance_records(staff_uuid);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_attendance_institution ON attendance_records(institution_id);
CREATE INDEX IF NOT EXISTS idx_attendance_staff_date ON attendance_records(staff_uuid, date);
CREATE INDEX IF NOT EXISTS idx_staff_institution ON staff(institution_id);
CREATE INDEX IF NOT EXISTS idx_staff_qr ON staff(qr_code_data);
CREATE INDEX IF NOT EXISTS idx_device_logs_staff ON device_logs(staff_uuid);
`;

async function runMigration() {
  // Allow extra time for Neon cold-start wake-up
  const migrationPool = new (require('pg').Pool)({
    ...(() => {
      require('dotenv').config();
      const ssl = process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false;
      return process.env.DATABASE_URL
        ? { connectionString: process.env.DATABASE_URL, ssl }
        : {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT, 10) || 5432,
            database: process.env.DB_NAME || 'geofence_attendance',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || '',
            ssl,
          };
    })(),
    max: 1,
    connectionTimeoutMillis: 30000,
  });

  const client = await migrationPool.connect();
  try {
    console.log('Running migrations...');
    await client.query(migration);
    console.log('Migrations completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await migrationPool.end();
  }
}

runMigration();
