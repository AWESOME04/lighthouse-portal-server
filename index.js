// index.js
const express = require('express');
const { Pool } = require('pg');
const cors = require('./cors');
const authRoutes = require('./auth');

const app = express();
const PORT = process.env.PORT || 5001;

// Apply CORS middleware
app.use(cors);

// Middleware to parse JSON requests
app.use(express.json());

// Create the PostgreSQL pool
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'lighthouse',
    password: '12345qwerty',
    port: 5432,
});

// Use the authentication routes
app.use('/api/auth', authRoutes(pool));

app.get('/', (req, res) => {
    res.send('Hello from Express server!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});