const express = require('express');
const jwt = require('jsonwebtoken');

module.exports = (pool) => {
    const router = express.Router();

    // PUT route to update user settings
    router.put('/', async (req, res) => {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, 'your_secret_key');
            const { user_id } = decoded;
            const { campaign_name, day_end_time, notification_enabled, measurement_unit } = req.body;

            // Check if user settings already exist
            const existingSettings = await pool.query('SELECT * FROM user_settings WHERE user_id = $1', [user_id]);
            if (existingSettings.rows.length === 0) {
                // If settings don't exist, insert new settings
                await pool.query(
                    'INSERT INTO user_settings (user_id, campaign_name, day_end_time, notification_enabled, measurement_unit) VALUES ($1, $2, $3, $4, $5)',
                    [user_id, campaign_name, day_end_time, notification_enabled, measurement_unit]
                );
            } else {
                // If settings exist, update them
                await pool.query(
                    'UPDATE user_settings SET campaign_name = $1, day_end_time = $2, notification_enabled = $3, measurement_unit = $4 WHERE user_id = $5',
                    [campaign_name, day_end_time, notification_enabled, measurement_unit, user_id]
                );
            }

            res.status(200).json({ message: 'User settings updated successfully' });
        } catch (error) {
            console.error('Error updating user settings:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    return router;
};
