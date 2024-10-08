require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');

const cors = require('cors');
const authRoutes = require('./Routes/authRoutes');
const memoRoutes = require('./Routes/memoRoutes');
const userRoutes = require('./Routes/userRoutes');
const hydrationRoutes = require('./Routes/hydrationRoutes');
const settingsRoutes = require('./Routes/settingsRoutes');
const userMeasurementsRoutes = require('./Routes/userMeasurementsRoutes');
const path = require('path');
const caloriesRoutes = require('./Routes/caloriesRoutes');

const app = express();
const PORT = process.env.PORT || 5001;
app.use((req, res, next) => {
    res.on('finish', () => {
        console.log(`${req.method} ${req.originalUrl} ${res.statusCode}`);
    });
    next();
});

// Middleware to enable CORS
app.use(cors());

app.use(cors({
    origin: '*',
    credentials: true,
}));

// Middleware to parse JSON requests
app.use(express.json());

// PostgreSQL pool using the connection string
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// authentication routes
app.use('/api/auth', authRoutes(pool));

// memo routes
app.use('/api/memos', memoRoutes(pool));

// user routes
app.use('/api/users', userRoutes(pool));

// Hydration routes
app.use('/api/hydration', hydrationRoutes(pool));

// Calories routes
app.use('/api/calories', caloriesRoutes(pool));

// Settings routes
app.use('/api/settings', settingsRoutes(pool));

// User measurements routes
app.use('/api/measurements', userMeasurementsRoutes(pool));

app.get('/', (req, res) => {
    res.send('Hello from Express server!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});