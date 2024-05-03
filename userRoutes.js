// userRoutes.js
const express = require('express');
const jwt = require('jsonwebtoken');

module.exports = (pool) => {
    const router = express.Router();

    // GET route to fetch the user's email
    router.get('/', async (req, res) => {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, 'your_secret_key');
            const { email, user_id } = decoded; // Assuming the JWT payload now includes user_id
            res.json({ email, user_id });
        } catch (error) {
            console.error('Error fetching user email:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // GET route to fetch the user's details
    router.get('/details', async (req, res) => {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, 'your_secret_key');
            const { user_id } = decoded; // Assuming the JWT payload now includes user_id

            const { rows } = await pool.query(
                'SELECT username, email FROM users WHERE user_id = $1',
                [user_id]
            );
            if (rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json(rows[0]);
        } catch (error) {
            console.error('Error fetching user details:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // PUT route to update the user's details
    router.put('/details', async (req, res) => {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, 'your_secret_key');
            const { user_id } = decoded; // Assuming the JWT payload now includes user_id
            const { username } = req.body;
            const { rows } = await pool.query(
                'UPDATE users SET username = $1 WHERE user_id = $2 RETURNING *',
                [username, user_id]
            );
            if (rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json(rows[0]); // Return the updated user data
        } catch (error) {
            console.error('Error updating user details:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    return router;
};