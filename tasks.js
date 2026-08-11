const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  const { company_id, tenant_staff_id } = req.query;
  try {
    let query = 'SELECT * FROM tasks WHERE 1=1';
    const values = [];
    if (company_id) { values.push(company_id); query += ` AND company_id = $${values.length}`; }
    if (tenant_staff_id) { values.push(tenant_staff_id); query += ` AND tenant_staff_id = $${values.length}`; }
    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { id, company_id, tenant_staff_id, title, description, category, frequency, priority, progress_percentage, status } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO tasks (id, company_id, tenant_staff_id, title, description, category, frequency, priority, progress_percentage, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [id, company_id, tenant_staff_id, title, description, category || 'General', frequency || 'One-time', priority || 'Normal', progress_percentage || 0, status || 'Pending']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', async (req, res) => {
  const fields = ['title','description','category','frequency','priority','progress_percentage','status'];
  const updates = []; const values = []; let i = 1;
  for (const f of fields) {
    if (req.body[f] !== undefined) { updates.push(`${f} = $${i}`); values.push(req.body[f]); i++; }
  }
  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
  values.push(req.params.id);
  try {
    const result = await pool.query(`UPDATE tasks SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`, values);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
