const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const attendanceRoutes = require('./routes/attendance');
const staffRoutes = require('./routes/staff');
const institutionRoutes = require('./routes/institution');
const reportRoutes = require('./routes/reports');

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: false,
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests, please try again later' },
});
app.use('/api/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts, please try again later' },
}));
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/institutions', institutionRoutes);
app.use('/api/reports', reportRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Auto-migrate: ensure column sizes are correct on startup
const pool = require('./config/database');
async function runAutoMigration() {
  const alters = [
    'ALTER TABLE staff ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE',
    'ALTER TABLE staff ALTER COLUMN profile_photo_url TYPE TEXT',
    'ALTER TABLE staff ALTER COLUMN google_id TYPE VARCHAR(255)',
    'ALTER TABLE staff ALTER COLUMN staff_id TYPE VARCHAR(50)',
    'ALTER TABLE staff ALTER COLUMN first_name TYPE VARCHAR(100)',
    'ALTER TABLE staff ALTER COLUMN last_name TYPE VARCHAR(100)',
    'ALTER TABLE staff ALTER COLUMN email TYPE VARCHAR(255)',
    'ALTER TABLE staff ALTER COLUMN password_hash DROP NOT NULL',
  ];
  for (const sql of alters) {
    try {
      await pool.query(sql);
    } catch (err) {
      console.error('Auto-migration skip:', sql.slice(0, 60), '-', err.message);
    }
  }
  console.log('Auto-migration: column sizes verified.');
}

async function ensureAdminExists() {
  try {
    const existing = await pool.query("SELECT id FROM staff WHERE staff_id = 'ADMIN001'");
    if (existing.rows.length > 0) return;

    const bcrypt = require('bcryptjs');
    const instResult = await pool.query('SELECT id FROM institutions ORDER BY created_at LIMIT 1');
    let institutionId;

    if (instResult.rows.length === 0) {
      const ins = await pool.query(
        `INSERT INTO institutions (name, address, city, region, latitude, longitude, geofence_radius)
         VALUES ('Sample Institution Ghana', '123 Independence Avenue', 'Accra', 'Greater Accra', 5.6037, -0.1870, 200)
         RETURNING id`
      );
      institutionId = ins.rows[0].id;
      await pool.query('INSERT INTO attendance_rules (institution_id) VALUES ($1)', [institutionId]);
    } else {
      institutionId = instResult.rows[0].id;
    }

    const passwordHash = await bcrypt.hash(process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123', 12);
    await pool.query(
      `INSERT INTO staff (institution_id, staff_id, first_name, last_name, email, password_hash, role, department, position, qr_code_data)
       VALUES ($1, 'ADMIN001', 'System', 'Administrator', $2, $3, 'super_admin', 'Administration', 'System Administrator', $4)
       ON CONFLICT DO NOTHING`,
      [institutionId, process.env.DEFAULT_ADMIN_EMAIL || 'admin@institution.edu.gh', passwordHash, `STAFF-${institutionId}-ADMIN001`]
    );
    console.log('Admin account created: ADMIN001');
  } catch (err) {
    console.error('Ensure admin error:', err.message);
  }
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  await runAutoMigration();
  await ensureAdminExists();
});

module.exports = app;
