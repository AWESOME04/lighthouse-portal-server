const express = require('express');
const jwt = require('jsonwebtoken');

module.exports = (pool) => {
    const router = express.Router();

    router.get('/', async (req, res) => {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, 'your_secret_key');
            const user_id = decoded.user_id;

            const { rows } = await pool.query(
                'SELECT age, weight, height, gender, activity_level FROM user_measurements WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
                [user_id]
            );

            if (rows.length > 0) {
                res.json(rows[0]);
            } else {
                res.status(404).json({ error: 'User measurements not found' });
            }
        } catch (err) {
            console.error('Error verifying token:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });

    return router;
};