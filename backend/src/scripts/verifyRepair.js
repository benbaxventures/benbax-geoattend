const pool = require('../config/database');

async function verify() {
  const r = await pool.query(
    `SELECT i.name, i.institution_code, s.staff_id AS admin_id, s.role,
            (SELECT status FROM subscriptions sub WHERE sub.institution_id = i.id ORDER BY created_at DESC LIMIT 1) AS sub_status
     FROM institutions i
     LEFT JOIN staff s ON s.institution_id = i.id AND s.role IN ('admin', 'super_admin')
     WHERE i.name ILIKE $1
     ORDER BY i.created_at DESC`,
    [`%${process.argv[2] || ''}%`]
  );
  console.table(r.rows);
  const missing = r.rows.filter(x => !x.institution_code || !x.admin_id);
  console.log(missing.length === 0 ? 'ALL OK: every Rising Soul institution has a code + admin' : `STILL BROKEN: ${missing.length}`);
  process.exit(0);
}

verify().catch(e => { console.error(e.message); process.exit(1); });
