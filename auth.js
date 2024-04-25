const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

module.exports = (pool) => {
    const router = express.Router();

    // POST route for login
    router.post('/login', async (req, res) => {
        try {
            const { email, password } = req.body;

            // Check if the user exists in the database
            const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
            if (rows.length === 0) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            // Compare the provided password with the hashed password in the database
            const user = rows[0];
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            // Generate a JWT token
            const token = jwt.sign({ email }, 'your_secret_key', { expiresIn: '1h' });

            // Return the token in the response
            res.json({ token });
        } catch (error) {
            console.error('Error in login:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // POST route for signup
    router.post('/signup', async (req, res) => {
        try {
            const { userName, email, password } = req.body;

            // Check if the user already exists in the database
            const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
            if (rows.length > 0) {
                return res.status(400).json({ error: 'User with this email already exists' });
            }

            // Hash the password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Insert the new user into the database
            await pool.query(
                'INSERT INTO users (userName, email, password) VALUES ($1, $2, $3)',
                [userName, email, hashedPassword]
            );

            // Generate a JWT token
            const token = jwt.sign({ email }, 'your_secret_key', { expiresIn: '1h' });

            res.status(201).json({ token });
        } catch (error) {
            console.error('Error in signup:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Memo-related routes
    router.post('/memos', async (req, res) => {
        try {
            const { email, memo } = req.body;
            console.log('Received email:', email, 'memo:', memo); // Add this line

            const { rows } = await pool.query(
                'INSERT INTO memos (email, memo) VALUES ($1, $2) RETURNING *',
                [email, memo]
            );

            console.log('Inserted memo:', rows[0]); // Add this line
            res.status(201).json(rows[0]);
        } catch (error) {
            console.error('Error creating memo:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    router.get('/memos', async (req, res) => {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, 'your_secret_key');
            const { email } = decoded;
            const { rows } = await pool.query(
                'SELECT * FROM memos WHERE email = $1',
                [email]
            );
            res.json(rows);
        } catch (error) {
            console.error('Error fetching memos:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    router.put('/memos/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { memo } = req.body;
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, 'your_secret_key');
            const { email } = decoded;
            const { rows } = await pool.query(
                'UPDATE memos SET memo = $1 WHERE id = $2 AND email = $3 RETURNING *',
                [memo, id, email]
            );
            if (rows.length === 0) {
                return res.status(404).json({ error: 'Memo not found' });
            }
            res.json(rows[0]);
        } catch (error) {
            console.error('Error updating memo:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // GET route to fetch the user's email
    router.get('/user', async (req, res) => {
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

    router.delete('/memos/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, 'your_secret_key');
            const { email } = decoded;
            await pool.query('DELETE FROM memos WHERE id = $1 AND email = $2', [id, email]);
            res.sendStatus(204);
        } catch (error) {
            console.error('Error deleting memo:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });


    // GET route to fetch the user's hydration data
    router.get('/hydration', async (req, res) => {
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
    router.put('/hydration', async (req, res) => {
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

    // GET route to fetch the user's settings
    router.get('/settings', async (req, res) => {
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
    router.put('/settings', async (req, res) => {
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

    // GET route to fetch the user's details
    router.get('/user-details', async (req, res) => {
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
    router.put('/user-details', async (req, res) => {
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