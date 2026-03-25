const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Seeding database...');

    // Create default institution
    const institutionId = uuidv4();
    await client.query(`
      INSERT INTO institutions (id, name, address, city, region, latitude, longitude, geofence_radius)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (institution_id, staff_id) DO NOTHING
    `, [
      institutionId,
      'Sample Institution Ghana',
      '123 Independence Avenue',
      'Accra',
      'Greater Accra',
      5.6037,    // Accra latitude
      -0.1870,   // Accra longitude
      200        // 200 meters geofence radius
    ]);

    // Create default attendance rules
    await client.query(`
      INSERT INTO attendance_rules (institution_id)
      VALUES ($1)
      ON CONFLICT (institution_id, staff_id) DO NOTHING
    `, [institutionId]);

    // Create default admin user
    const passwordHash = await bcrypt.hash(
      process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123',
      12
    );

    await client.query(`
      INSERT INTO staff (institution_id, staff_id, first_name, last_name, email, password_hash, role, department, position, qr_code_data)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (institution_id, staff_id) DO NOTHING
    `, [
      institutionId,
      'ADMIN001',
      'System',
      'Administrator',
      process.env.DEFAULT_ADMIN_EMAIL || 'admin@institution.edu.gh',
      passwordHash,
      'super_admin',
      'Administration',
      'System Administrator',
      `STAFF-${institutionId}-ADMIN001`
    ]);

    console.log('Seed completed successfully.');
    console.log(`Institution ID: ${institutionId}`);
    console.log(`Admin login: ADMIN001 / ${process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123'}`);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
