const express = require('express');
const router = express.Router();
const pool = require('./db');

// Create a new tenant/company (used during Owner sign-up / bootstrap)
router.post('/', async (req, res) => {
  const { id, company_name, owner_name, phone, email, id_prefix, currency, language_preference } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO companies (id, company_name, owner_name, phone, email, id_prefix, currency, language_preference)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [id, company_name, owner_name, phone, email, id_prefix || 'ID-', currency || 'USD', language_preference || 'en']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get one company by id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM companies WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Company not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update company settings (branding, currency, id_prefix, etc.)
router.patch('/:id', async (req, res) => {
  const fields = ['company_name','owner_name','phone','email','id_prefix','currency','language_preference'];
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
      `UPDATE companies SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
