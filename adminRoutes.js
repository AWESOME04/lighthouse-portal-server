const express = require('express');
const jwt = require('jsonwebtoken');

module.exports = (pool) => {
    const router = express.Router();

    // Middleware to verify the admin token
    const verifyAdminToken = (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, 'your_admin_secret_key');
            req.user = decoded;
            next();
        } catch (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
    };

    // GET route to fetch all users
    router.get('/users', verifyAdminToken, async (req, res) => {
        try {
            const { rows } = await pool.query('SELECT id, username, email FROM users');
            res.json(rows);
        } catch (error) {
            console.error('Error fetching users:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    return router;
};