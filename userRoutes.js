const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const fs = require('fs');
const uploadDir = 'uploads/';

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

    router.put('/details', upload.single('profilePicture'), async (req, res) => {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, 'your_secret_key');
            const { email } = decoded;
            const { username, email: newEmail } = req.body;
            const profile_picture = req.file ? req.file.filename : null;

            const { rows } = await pool.query(
                'UPDATE users SET username = $1, email = $2, profile_picture = $3 WHERE email = $4 RETURNING username, email, profile_picture',
                [username, newEmail, profile_picture, email]
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

    router.put('/change-password', async (req, res) => {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, 'your_secret_key');
            const { email } = decoded;
            const { currentPassword, newPassword } = req.body;

            const { rows } = await pool.query('SELECT password FROM users WHERE email = $1', [email]);

            if (rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            const isMatch = await bcrypt.compare(currentPassword, rows[0].password);

            if (!isMatch) {
                return res.status(400).json({ error: 'Current password is incorrect' });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);

            await pool.query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, email]);

            res.json({ message: 'Password changed successfully' });
        } catch (error) {
            console.error('Error changing password:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    return router;
};
