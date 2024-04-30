const express = require('express');
const jwt = require('jsonwebtoken');

module.exports = (pool) => {
    const router = express.Router();

    // GET route to fetch the user's hydration data
    router.get('/', async (req, res) => {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, 'your_secret_key');
            const { email } = decoded;
            const { rows } = await pool.query(
                'SELECT hydration_level FROM hydration_data WHERE email = $1',
                [email]
            );
            if (rows.length === 0) {
                // If the user doesn't have any hydration data yet, initialize it to 1
                await pool.query(
                    'INSERT INTO hydration_data (email, hydration_level) VALUES ($1, $2)',
                    [email, 1]
                );
                res.json({ hydrationLevel: 1 });
            } else {
                res.json({ hydrationLevel: rows[0].hydration_level });
            }
        } catch (error) {
            console.error('Error fetching hydration data:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // PUT route to update the user's hydration data
    router.put('/', async (req, res) => {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, 'your_secret_key');
            const { email } = decoded;
            const { hydrationLevel } = req.body;
            const { rows } = await pool.query(
                'UPDATE hydration_data SET hydration_level = $1 WHERE email = $2 RETURNING *',
                [hydrationLevel, email]
            );
            if (rows.length === 0) {
                // If the user doesn't have any hydration data yet, insert a new record
                await pool.query(
                    'INSERT INTO hydration_data (email, hydration_level) VALUES ($1, $2)',
                    [email, hydrationLevel]
                );
            }
            res.json({ success: true });
        } catch (error) {
            console.error('Error updating hydration data:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    return router;
};