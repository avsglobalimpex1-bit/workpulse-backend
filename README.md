# WorkPulse OS — Backend API

This is the real backend for your WorkPulse OS system. It replaces
browser localStorage with a proper PostgreSQL database (hosted on
Neon), so data created on owner.html is instantly visible on
staff.html — even from different devices.

## What's inside
- `server.js` — the Express API server
- `db.js` — database connection
- `schema.sql` — creates all the tables
- `migrate.js` — runs schema.sql against your database
- `routes/` — one file per data type (companies, staff, tasks, etc.)

## Deployment — see the step-by-step guide sent separately in chat.
