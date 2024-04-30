const express = require('express');
const jwt = require('jsonwebtoken');

module.exports = (pool) => {
    const router = express.Router();

    // GET route to fetch the user's settings
    router.get('/', async (req, res) => {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, 'your_secret_key');
            const { email } = decoded;
            const { rows } = await pool.query(
                'SELECT theme, language, email_notifications, push_notifications, font_size, show_tutorials, dark_mode_schedule FROM user_settings WHERE email = $1',
                [email]
            );
            if (rows.length === 0) {
                // If the user doesn't have any settings yet, initialize them with default values
                await pool.query(
                    'INSERT INTO user_settings (email) VALUES ($1)',
                    [email]
                );
                res.json({
                    theme: 'light',
                    language: 'en',
                    emailNotifications: false,
                    pushNotifications: false,
                    fontSize: 16,
                    showTutorials: true,
                    darkModeSchedule: 'auto',
                });
            } else {
                res.json(rows[0]);
            }
        } catch (error) {
            console.error('Error fetching user settings:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // PUT route to update the user's settings
    router.put('/', async (req, res) => {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, 'your_secret_key');
            const { email } = decoded;
            const { theme, language, emailNotifications, pushNotifications, fontSize, showTutorials, darkModeSchedule } = req.body;
            const { rows } = await pool.query(
                'UPDATE user_settings SET theme = $1, language = $2, email_notifications = $3, push_notifications = $4, font_size = $5, show_tutorials = $6, dark_mode_schedule = $7 WHERE email = $8 RETURNING *',
                [theme, language, emailNotifications, pushNotifications, fontSize, showTutorials, darkModeSchedule, email]
            );
            if (rows.length === 0) {
                // If the user doesn't have any settings yet, insert a new record
                await pool.query(
                    'INSERT INTO user_settings (email, theme, language, email_notifications, push_notifications, font_size, show_tutorials, dark_mode_schedule) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
                    [email, theme, language, emailNotifications, pushNotifications, fontSize, showTutorials, darkModeSchedule]
                );
            }
            res.json({ success: true });
        } catch (error) {
            console.error('Error updating user settings:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    return router;
};