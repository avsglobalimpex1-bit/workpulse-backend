const { Pool } = require('pg');

// Neon requires SSL. The connection string comes from an environment
// variable so it is never hardcoded into the codebase.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = pool;
