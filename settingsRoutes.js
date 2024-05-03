const express = require('express');
const jwt = require('jsonwebtoken');

module.exports = (pool) => {
    const router = express.Router();

    // GET route to fetch user settings
    router.get('/', async (req, res) => {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, 'your_secret_key');
            const { user_id } = decoded;

            const query = 'SELECT campaign_name, day_end_time, notification_enabled, measurement_unit FROM user_settings WHERE user_id = $1';
            const result = await pool.query(query, [user_id]);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'User settings not found' });
            }

            res.status(200).json(result.rows[0]);
        } catch (error) {
            console.error('Error fetching user settings:', error);
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ error: 'Invalid token' });
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // PUT route to update user settings
    router.put('/', async (req, res) => {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, 'your_secret_key');
            const { user_id } = decoded; // Assuming the JWT payload now includes the user_id field

            const { campaign_name, day_end_time, notification_enabled, measurement_unit } = req.body;

            // Log the values to verify the user_id
            console.log('Values:', [user_id, campaign_name, day_end_time, notification_enabled, measurement_unit]);

            // Check if user_id is valid
            if (!user_id) {
                return res.status(400).json({ error: 'Invalid user ID' });
            }

            const query = `
            INSERT INTO user_settings (user_id, campaign_name, day_end_time, notification_enabled, measurement_unit)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (user_id)
            DO UPDATE SET campaign_name = $2, day_end_time = $3, notification_enabled = $4, measurement_unit = $5;
        `;
            const values = [user_id, campaign_name, day_end_time, notification_enabled, measurement_unit];

            await pool.query(query, values);
            res.status(200).json({ message: 'User settings updated successfully' });
        } catch (error) {
            console.error('Error updating user settings:', error);
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ error: 'Invalid token' });
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    });
    return router;
};