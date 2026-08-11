const express = require('express');
const router = express.Router();
const pool = require('../db');

/* Small helper to build the "id_prefix + next number" serial for a company */
async function nextSerialForCompany(companyId) {
  const co = await pool.query('SELECT id_prefix FROM companies WHERE id = $1', [companyId]);
  const prefix = co.rows[0] ? co.rows[0].id_prefix : 'ID-';
  const existing = await pool.query(
    'SELECT tenant_staff_serial_id FROM tenant_staff_map WHERE company_id = $1',
    [companyId]
  );
  let max = 1000;
  existing.rows.forEach(r => {
    if (r.tenant_staff_serial_id && r.tenant_staff_serial_id.startsWith(prefix)) {
      const n = parseInt(r.tenant_staff_serial_id.replace(prefix, ''), 10);
      if (!isNaN(n) && n > max) max = n;
    }
  });
  return prefix + (max + 1);
}

/* -----------------------------------------------------------------
   GET /api/staff?company_id=xxx
   Returns every staff member mapped to a tenant, joined with their
   global identity (name/phone/email).
   ----------------------------------------------------------------- */
router.get('/', async (req, res) => {
  const { company_id } = req.query;
  if (!company_id) return res.status(400).json({ error: 'company_id is required' });
  try {
    const result = await pool.query(
      `SELECT t.*, g.full_name, g.phone, g.email
       FROM tenant_staff_map t
       JOIN global_staff_registry g ON g.id = t.global_staff_id
       WHERE t.company_id = $1
       ORDER BY t.joined_date DESC`,
      [company_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* -----------------------------------------------------------------
   POST /api/staff/onboard
   Cross-tenant-safe onboarding: looks up the global identity by
   phone. If it already exists (e.g. this person worked at another
   tenant before), it re-uses that identity and just creates a new
   tenant_staff_map row with a fresh serial ID for THIS company.
   ----------------------------------------------------------------- */
router.post('/onboard', async (req, res) => {
  const { company_id, full_name, phone, email, department, role, base_salary, allowances } = req.body;
  if (!company_id || !full_name || !phone) {
    return res.status(400).json({ error: 'company_id, full_name and phone are required' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let globalId;
    const existing = await client.query('SELECT * FROM global_staff_registry WHERE phone = $1', [phone]);
    if (existing.rows.length > 0) {
      globalId = existing.rows[0].id;
      await client.query(
        `UPDATE global_staff_registry SET full_name = $1, email = COALESCE($2, email), global_status = 'active' WHERE id = $3`,
        [full_name, email, globalId]
      );
    } else {
      globalId = 'gstaff_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      await client.query(
        `INSERT INTO global_staff_registry (id, full_name, phone, email, global_status) VALUES ($1,$2,$3,$4,'active')`,
        [globalId, full_name, phone, email || '']
      );
    }

    const serial = await nextSerialForCompany(company_id);
    const tenantMapId = 'tmap_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const inserted = await client.query(
      `INSERT INTO tenant_staff_map
        (id, company_id, global_staff_id, tenant_staff_serial_id, department, role, base_salary, allowances)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [tenantMapId, company_id, globalId, serial, department, role, base_salary || 0, allowances || 0]
    );

    await client.query('COMMIT');
    res.status(201).json({ ...inserted.rows[0], full_name, phone, email });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

/* Update a tenant_staff_map row: role, salary, bank details, status, etc. */
router.patch('/:id', async (req, res) => {
  const fields = [
    'department','role','base_salary','allowances','bank_details_json',
    'emergency_contact_json','employment_status','relieved_date'
  ];
  const updates = [];
  const values = [];
  let i = 1;
  for (const f of fields) {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = $${i}`);
      values.push(req.body[f]);
      i++;
    }
  }
  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
  values.push(req.params.id);
  try {
    const result = await pool.query(
      `UPDATE tenant_staff_map SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM tenant_staff_map WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* -----------------------------------------------------------------
   Staff-portal login lookups
   ----------------------------------------------------------------- */
router.get('/login/by-id/:serial', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, g.full_name, g.phone, g.email
       FROM tenant_staff_map t JOIN global_staff_registry g ON g.id = t.global_staff_id
       WHERE t.tenant_staff_serial_id = $1 AND t.employment_status = 'Active'`,
      [req.params.serial]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'No active staff record found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/login/by-phone/:phone', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, g.full_name, g.phone, g.email
       FROM tenant_staff_map t JOIN global_staff_registry g ON g.id = t.global_staff_id
       WHERE g.phone = $1 AND t.employment_status = 'Active'`,
      [req.params.phone]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
