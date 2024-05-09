const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const authRoutes = require('./authRoutes');
const memoRoutes = require('./memoRoutes');
const userRoutes = require('./userRoutes');
const hydrationRoutes = require('./hydrationRoutes');
const settingsRoutes = require('./settingsRoutes');
const adminRoutes = require('./adminRoutes');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5001;
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
    connectionString: 'postgresql://neondb_owner:0cOxDdLE8KSY@ep-holy-cake-a5lsl8iz.us-east-2.aws.neon.tech/neondb?sslmode=require',
});

// authentication routes
app.use('/api/auth', authRoutes(pool));

// memo routes
app.use('/api/memos', memoRoutes(pool));

// user routes
app.use('/api/users', userRoutes(pool));

// Hydration routes
app.use('/api/hydration', hydrationRoutes(pool));

// Settings routes
app.use('/api/settings', settingsRoutes(pool));

app.use('/api/admin', adminRoutes(pool));

app.get('/', (req, res) => {
    res.send('Hello from Express server!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});