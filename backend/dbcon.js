// generate code for a database connection file in Node.js using the `pg` library to connect to a PostgreSQL database. The file should export a function that establishes the connection and handles any connection errors.```javascript
const { Pool } = require('pg');
require('dotenv').config();     

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'iv_db',
  password: process.env.DB_PASSWORD || '25112025',
  port: parseInt(process.env.DB_PORT) || 5432,
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

pool.connect()
  .then(client => {
    console.log('Connected to PostgreSQL database');
    client.release();
  })
  .catch(err => {
    console.error('Connection error', err.stack);
  });

module.exports = pool;