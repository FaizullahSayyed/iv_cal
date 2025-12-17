const express = require('express');
const cors = require('cors');
const pool = require('./dbcon');
require("dotenv").config();

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

console.log("PORT", process.env.BACKEND_PORT);

app.use(cors({
  origin: [
    "http://localhost:3000",  // Add this for local development
    "http://31.97.227.6:3000",
    "http://31.97.227.6"
  ],
  credentials: true
}));
// Configure CORS for production
// const corsOptions = {
//   origin: process.env.FRONTEND_URL || 'http://localhost:3000',
//   credentials: true
// };
// app.use(cors(corsOptions));
app.use(express.json());

async function initDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS patients (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        dob DATE NOT NULL,
        gender VARCHAR(10),
        room_number VARCHAR(20),
        admission_date DATE,
        diagnosis TEXT,
        iv_status VARCHAR(50) DEFAULT 'pending'
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS iv_items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price_inr DECIMAL(10,2) NOT NULL
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS patient_iv_assignments (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES patients(id),
        iv_item_id INTEGER REFERENCES iv_items(id),
        quantity INTEGER DEFAULT 1,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS discharged_patients (
        id SERIAL PRIMARY KEY,
        original_patient_id INTEGER,
        name VARCHAR(255) NOT NULL,
        dob DATE NOT NULL,
        gender VARCHAR(10),
        room_number VARCHAR(20),
        admission_date DATE,
        discharge_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        diagnosis TEXT,
        iv_status VARCHAR(50),
        total_amount DECIMAL(10,2) DEFAULT 0
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS discharged_patient_iv_assignments (
        id SERIAL PRIMARY KEY,
        discharged_patient_id INTEGER REFERENCES discharged_patients(id),
        iv_item_id INTEGER,
        iv_item_name VARCHAR(255),
        price_inr DECIMAL(10,2),
        quantity INTEGER DEFAULT 1,
        assigned_at TIMESTAMP
      )
    `);
    console.log('Database tables ready');
  } catch (err) {
    console.error('Error creating taSbles:', err);
  }
}
initDb();

app.get('/', (req, res) => {
  res.send('Server is running!');
});

app.get('/test-db', async (req, res) => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    res.send('Database connection successful!');
  } catch (err) {
    console.error(err);
    res.status(500).send('Database connection failed');
  }
});

// POST /api/login
// Expects JSON: { username, password }
// Returns: 200 { role } on success, 401 on invalid credentials
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password required' });
  }

  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT role FROM users WHERE name = $1 AND password = $2 LIMIT 1',
        [username, password]
      );
      
      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const role = result.rows[0].role || null;
      return res.json({ role });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/register', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  try {
    const existing = await pool.query('SELECT id FROM users WHERE name = $1', [username]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Username already exists' });
    }
    await pool.query(
      'INSERT INTO users (name, password, role) VALUES ($1, $2, $3)',
      [username, password, 'nurse']
    );
    res.status(201).json({ message: 'Registration successful' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/patients', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.id, p.name, 
             MAX(pia.assigned_at) as last_iv_assigned
      FROM patients p
      LEFT JOIN patient_iv_assignments pia ON p.id = pia.patient_id
      GROUP BY p.id, p.name
      ORDER BY p.name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching patients:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/patients', async (req, res) => {
  const { name, admission_date } = req.body || {};
  if (!name || !admission_date) {
    return res.status(400).json({ error: 'Name and admission date are required' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO patients (name, dob, admission_date) VALUES ($1, $2, $3) RETURNING *',
      [name, admission_date, admission_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding patient:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/iv-items', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name FROM iv_items ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching IV items:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/iv-items', async (req, res) => {
  const { name, price_inr } = req.body || {};
  if (!name || !price_inr) {
    return res.status(400).json({ error: 'Name and price are required' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO iv_items (name, price_inr) VALUES ($1, $2) RETURNING *',
      [name, parseFloat(price_inr)]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding IV item:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/patient-iv-assignments', async (req, res) => {
  const { patient_id, iv_item_id, quantity } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO patient_iv_assignments (patient_id, iv_item_id, quantity) VALUES ($1, $2, $3) RETURNING *',
      [patient_id, iv_item_id, quantity || 1]
    );
    await pool.query("UPDATE patients SET iv_status = 'active' WHERE id = $1", [patient_id]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error assigning IV item:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/billing/summary', async (req, res) => {
  try {
    const totalResult = await pool.query(`
      SELECT COALESCE(SUM(iv.price_inr * pia.quantity), 0) as total_revenue
      FROM patient_iv_assignments pia
      JOIN iv_items iv ON pia.iv_item_id = iv.id
    `);
    const detailsResult = await pool.query(`
      SELECT p.name as patient_name, p.room_number, iv.name as item_name, 
             iv.price_inr, pia.quantity, (iv.price_inr * pia.quantity) as total,
             pia.assigned_at
      FROM patient_iv_assignments pia
      JOIN patients p ON pia.patient_id = p.id
      JOIN iv_items iv ON pia.iv_item_id = iv.id
      ORDER BY pia.assigned_at DESC
    `);
    res.json({
      total_revenue: totalResult.rows[0].total_revenue,
      assignments: detailsResult.rows
    });
  } catch (err) {
    console.error('Error fetching billing summary:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/billing/patients', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.id, p.name,
             COALESCE(SUM(iv.price_inr * pia.quantity), 0) as total_amount
      FROM patients p
      LEFT JOIN patient_iv_assignments pia ON p.id = pia.patient_id
      LEFT JOIN iv_items iv ON pia.iv_item_id = iv.id
      GROUP BY p.id, p.name
      ORDER BY p.name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching billing patients:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/billing/patient/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const patientResult = await pool.query('SELECT * FROM patients WHERE id = $1', [id]);
    const assignmentsResult = await pool.query(`
      SELECT pia.id, iv.name as item_name, iv.price_inr, pia.quantity, 
             (iv.price_inr * pia.quantity) as total, pia.assigned_at
      FROM patient_iv_assignments pia
      JOIN iv_items iv ON pia.iv_item_id = iv.id
      WHERE pia.patient_id = $1
      ORDER BY pia.assigned_at DESC
    `, [id]);
    res.json({
      patient: patientResult.rows[0],
      assignments: assignmentsResult.rows
    });
  } catch (err) {
    console.error('Error fetching patient billing:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/nurse/patient/:id/iv-history', async (req, res) => {
  try {
    const { id } = req.params;
    const patientResult = await pool.query('SELECT id, name, dob, gender, room_number, admission_date, diagnosis FROM patients WHERE id = $1', [id]);
    if (patientResult.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    const assignmentsResult = await pool.query(`
      SELECT pia.id, iv.name as item_name, pia.quantity, pia.assigned_at
      FROM patient_iv_assignments pia
      JOIN iv_items iv ON pia.iv_item_id = iv.id
      WHERE pia.patient_id = $1
      ORDER BY pia.assigned_at DESC
    `, [id]);
    res.json({
      patient: patientResult.rows[0],
      assignments: assignmentsResult.rows
    });
  } catch (err) {
    console.error('Error fetching patient IV history:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/iv-assignment/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM patient_iv_assignments WHERE id = $1', [id]);
    res.json({ message: 'Assignment deleted successfully' });
  } catch (err) {
    console.error('Error deleting IV assignment:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/patients/:id/discharge', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;

    // Get patient details
    const patientResult = await client.query('SELECT * FROM patients WHERE id = $1', [id]);
    if (patientResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Patient not found' });
    }
    const patient = patientResult.rows[0];

    // Get all IV assignments with item details
    const assignmentsResult = await client.query(`
      SELECT pia.id, iv.id as iv_item_id, iv.name as item_name, iv.price_inr, pia.quantity, pia.assigned_at,
             (iv.price_inr * pia.quantity) as total
      FROM patient_iv_assignments pia
      JOIN iv_items iv ON pia.iv_item_id = iv.id
      WHERE pia.patient_id = $1
    `, [id]);

    // Calculate total amount
    const totalAmount = assignmentsResult.rows.reduce((sum, item) => sum + parseFloat(item.total), 0);

    // Insert into discharged_patients
    const dischargedResult = await client.query(`
      INSERT INTO discharged_patients (
        original_patient_id, name, dob, gender, room_number, admission_date, 
        diagnosis, iv_status, total_amount
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `, [
      patient.id,
      patient.name,
      patient.dob,
      patient.gender,
      patient.room_number,
      patient.admission_date,
      patient.diagnosis,
      patient.iv_status,
      totalAmount
    ]);

    const dischargedPatientId = dischargedResult.rows[0].id;

    // Insert IV assignments into discharged_patient_iv_assignments
    for (const assignment of assignmentsResult.rows) {
      await client.query(`
        INSERT INTO discharged_patient_iv_assignments (
          discharged_patient_id, iv_item_id, iv_item_name, price_inr, quantity, assigned_at
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        dischargedPatientId,
        assignment.iv_item_id,
        assignment.item_name,
        assignment.price_inr,
        assignment.quantity,
        assignment.assigned_at
      ]);
    }

    // Delete patient from active patients table and their IV assignments
    await client.query('DELETE FROM patient_iv_assignments WHERE patient_id = $1', [id]);
    await client.query('DELETE FROM patients WHERE id = $1', [id]);

    await client.query('COMMIT');
    res.json({ message: 'Patient discharged successfully', dischargedPatientId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error discharging patient:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

