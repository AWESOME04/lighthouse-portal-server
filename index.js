const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const authRoutes = require('./auth');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware to enable CORS
app.use(cors());

app.use(cors({
    origin: 'https://lighthouse-q5b7.onrender.com/',
    credentials: true,
}));

// Middleware to parse JSON requests
app.use(express.json());

// PostgreSQL pool using the connection string
const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:0cOxDdLE8KSY@ep-holy-cake-a5lsl8iz.us-east-2.aws.neon.tech/neondb?sslmode=require',
});

// Use the authentication routes
app.use('/api/auth', authRoutes(pool));

app.get('/', (req, res) => {
    res.send('Hello from Express server!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
