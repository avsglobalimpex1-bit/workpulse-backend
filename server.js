require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

/* ---------------------------------------------------------------
   Health check -- open this URL in a browser after deploying to
   confirm the server and database are both reachable.
   --------------------------------------------------------------- */
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.use('/api/companies', require('./routes/companies'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/advances', require('./routes/advances'));
app.use('/api/travel', require('./routes/travel'));
app.use('/api/audit', require('./routes/audit'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`WorkPulse API running on port ${PORT}`));
