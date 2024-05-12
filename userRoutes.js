const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

const fs = require('fs');
const uploadDir = 'uploads/';

// Create the uploads directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname);
        const filename = `${Date.now()}_${Math.round(Math.random() * 1000000000)}${extension}`;
        cb(null, filename);
    },
});

const upload = multer({ storage });

module.exports = (pool) => {
    const router = express.Router();

    // GET route to fetch the user's email
    router.get('/', async (req, res) => {
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
                'SELECT username, email, profile_picture FROM users WHERE email = $1',
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

    // GET route to fetch the user's profile picture URL
    router.get('/profile-picture', async (req, res) => {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, 'your_secret_key');
            const { email } = decoded;
            const { rows } = await pool.query(
                'SELECT profile_picture FROM users WHERE email = $1',
                [email]
            );
            if (rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            const profilePictureUrl = rows[0].profile_picture
                ? `${req.protocol}://${req.get('host')}/uploads/${rows[0].profile_picture}`
                : '';
            res.json({ profilePictureUrl });
        } catch (error) {
            console.error('Error fetching user profile picture:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // PUT route to update the user's details and profile picture
    router.put('/details', upload.single('profilePicture'), async (req, res) => {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, 'your_secret_key');
            const { email } = decoded;
            const { username } = req.body;
            const profile_picture = req.file ? req.file.filename : null;

            const { rows } = await pool.query(
                'UPDATE users SET username = $1, profile_picture = $2 WHERE email = $3 RETURNING *',
                [username, profile_picture, email]
            );
            if (rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json(rows[0]);
        } catch (error) {
            console.error('Error updating user details:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });


    // POST route to store user measurements
    router.post('/measurements', async (req, res) => {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, 'your_secret_key');
            const { user_id } = decoded;
            const { age, weight, height, gender, activity_level } = req.body;

            // Insert the user measurements into the user_measurements table
            await pool.query(
                'INSERT INTO user_measurements (user_id, age, weight, height, gender, activity_level) VALUES ($1, $2, $3, $4, $5, $6)',
                [user_id, age, weight, height, gender, activity_level]
            );

            res.status(200).json({ message: 'User measurements saved successfully' });
        } catch (error) {
            console.error('Error saving user measurements:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    router.delete('/delete-account', async (req, res) => {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, 'your_secret_key');
            const { email } = decoded;

            // Delete the user from the database
            await pool.query('DELETE FROM users WHERE email = $1', [email]);

            res.status(200).json({ message: 'Account deleted successfully' });
        } catch (error) {
            console.error('Error deleting account:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
    return router;
};