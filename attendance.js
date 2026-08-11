const express = require('express');
const router = express.Router();
const pool = require('./db');

router.get('/', async (req, res) => {
  const { company_id, tenant_staff_id } = req.query;
  try {
    let query = 'SELECT * FROM attendance WHERE 1=1';
    const values = [];
    if (company_id) { values.push(company_id); query += ` AND company_id = $${values.length}`; }
    if (tenant_staff_id) { values.push(tenant_staff_id); query += ` AND tenant_staff_id = $${values.length}`; }
    query += ' ORDER BY timestamp DESC';
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { id, company_id, tenant_staff_id, timestamp, gps_lat, gps_lng, mode } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO attendance (id, company_id, tenant_staff_id, timestamp, gps_lat, gps_lng, mode)
       VALUES ($1,$2,$3,COALESCE($4, now()),$5,$6,$7) RETURNING *`,
      [id, company_id, tenant_staff_id, timestamp || null, gps_lat || null, gps_lng || null, mode || 'Office']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM attendance WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
