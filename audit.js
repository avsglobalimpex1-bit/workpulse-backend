const express = require('express');
const router = express.Router();
const pool = require('./db');

router.get('/', async (req, res) => {
  const { company_id } = req.query;
  try {
    const result = await pool.query(
      'SELECT * FROM audit_logs WHERE company_id = $1 ORDER BY timestamp DESC LIMIT 500',
      [company_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { id, company_id, action_type, performed_by, details, meta } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO audit_logs (id, company_id, action_type, performed_by, details, meta)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [id, company_id, action_type, performed_by, details, meta || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
