const express = require('express');
const router = express.Router();
const pool = require('./db');

router.get('/', async (req, res) => {
  const { company_id, tenant_staff_id } = req.query;
  try {
    let query = 'SELECT * FROM advance_ledger WHERE 1=1';
    const values = [];
    if (company_id) { values.push(company_id); query += ` AND company_id = $${values.length}`; }
    if (tenant_staff_id) { values.push(tenant_staff_id); query += ` AND tenant_staff_id = $${values.length}`; }
    query += ' ORDER BY date DESC';
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { id, company_id, tenant_staff_id, amount, type, date } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO advance_ledger (id, company_id, tenant_staff_id, amount, type, date)
       VALUES ($1,$2,$3,$4,$5,COALESCE($6, now())) RETURNING *`,
      [id, company_id, tenant_staff_id, amount || 0, type || 'Cash', date || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE advance_ledger SET deducted_status = $1 WHERE id = $2 RETURNING *',
      [req.body.deducted_status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM advance_ledger WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
