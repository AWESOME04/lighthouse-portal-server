const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

module.exports = (pool) => {
    const router = express.Router();

    // POST route for admin login
    router.post('/admin-login', async (req, res) => {
        try {
            const { email, password } = req.body;

            // Check if the email is 'admin@gmail.com' and password is 'admin'
            if (email === 'admin@gmail.com' && password === 'admin') {
                // Check if the admin user exists in the database
                const { rows } = await pool.query('SELECT * FROM users WHERE email = $1 AND is_admin = true', [email]);
                if (rows.length === 0) {
                    return res.status(401).json({ error: 'Invalid admin credentials' });
                }

                const user = rows[0];

                // Generate a JWT token with the user's role
                const token = jwt.sign({ email, user_id: user.id, is_admin: user.is_admin }, 'your_secret_key', { expiresIn: '1h' });

                // Return the token in the response
                res.json({ token });
            } else {
                return res.status(401).json({ error: 'Invalid admin credentials' });
            }
        } catch (error) {
            console.error('Error in admin login:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // POST route for login
    router.post('/login', async (req, res) => {
        try {
            const { email, password } = req.body;

            // Check if the user exists in the database
            const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
            if (rows.length === 0) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            const user = rows[0];

            // Compare the provided password with the hashed password in the database
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            // Generate a JWT token with the user's role
            const token = jwt.sign({ email, user_id: user.id, is_admin: user.is_admin }, 'your_secret_key', { expiresIn: '1h' });

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
                'INSERT INTO users (userName, email, password, is_admin) VALUES ($1, $2, $3, $4)',
                [userName, email, hashedPassword, false] // Set is_admin to false for regular users
            );

            // Generate a JWT token with the user's role
            const token = jwt.sign({ email, is_admin: false }, 'your_secret_key', { expiresIn: '1h' });

            res.status(201).json({ token });
        } catch (error) {
            console.error('Error in signup:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    return router;
};