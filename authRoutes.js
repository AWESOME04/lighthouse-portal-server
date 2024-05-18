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
                // Generate an admin JWT token
                const adminToken = jwt.sign({ email }, 'your_admin_secret_key', { expiresIn: '1h' });

                // Return the admin token in the response
                res.json({ adminToken });
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

            // Compare the provided password with the hashed password in the database
            const user = rows[0];
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            // Generate a JWT token
            const token = jwt.sign({ email, user_id: user.id }, 'your_secret_key', { expiresIn: '1h' });

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

    return router;
};