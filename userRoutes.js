const express = require('express');
const jwt = require('jsonwebtoken');

module.exports = (pool) => {
    const router = express.Router();

    // GET route to fetch the user's email
    router.get('/me', async (req, res) => {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, 'your_secret_key');
            const { email } = decoded;
            res.json({ email });
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
            const { email } = decoded;
            const { rows } = await pool.query(
                'SELECT username, email FROM users WHERE email = $1',
                [email]
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
            const { email } = decoded;
            const { username } = req.body;
            const { rows } = await pool.query(
                'UPDATE users SET username = $1 WHERE email = $2 RETURNING *',
                [username, email]
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