const { Pool } = require('pg');
const path = require('path');

// Load .env file from backend directory
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'iv_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Test connection on startup
pool.connect()
  .then(client => {
    console.log('Connected to PostgreSQL database');
    client.release();
  })
  .catch(err => {
    console.error('Database connection error:', err.message);
    console.error('Connection details:', {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'iv_db',
      user: process.env.DB_USER || 'postgres'
    });
  });

module.exports = pool;