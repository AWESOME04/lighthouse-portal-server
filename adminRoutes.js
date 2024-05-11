const express = require('express');
const { verifyToken, isAdmin } = require('./middleware'); // Import the middleware functions

module.exports = (pool) => {
    const router = express.Router();

    // GET route to fetch all users (accessible only to admins)
    router.get('/users', verifyToken, isAdmin, async (req, res) => {
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