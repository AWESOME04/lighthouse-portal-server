const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const sharp = require('sharp');
const { bucket } = require('../firebase');
const admin = require('firebase-admin');

const storage = multer.memoryStorage(); // Use memory storage to handle the buffer directly
const upload = multer({ storage });

// Helper function to upload files to Firebase Storage
const uploadFile = async (file) => {
    const fileName = `${Date.now()}_${Math.round(Math.random() * 1000000000)}${path.extname(file.originalname)}`;
    const fileUpload = bucket.file(fileName);
    const stream = fileUpload.createWriteStream({
        metadata: {
            contentType: file.mimetype,
        },
    });

    return new Promise((resolve, reject) => {
        stream.on('error', (err) => {
            console.error('Error uploading file:', err);
            reject(err);
        });

        stream.on('finish', async () => {
            // Make the uploaded file public
            await fileUpload.makePublic();
            const publicUrl = fileUpload.publicUrl();
            resolve(publicUrl);
        });

        stream.end(file.buffer);
    });
};

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
                "SELECT username, email, profilepic FROM users WHERE email = $1",
                [email]
            );
            if (rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            const user = rows[0];
            res.json({ ...user, profilePictureUrl: user.profilepic || '' });
        } catch (error) {
            console.error('Error fetching user details:', error);
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

            let profilePictureUrl = null;
            if (req.file) {
                profilePictureUrl = await uploadFile(req.file);
            }

            const { rows } = await pool.query(
                'UPDATE users SET username = $1, profilepic = $2 WHERE email = $3 RETURNING *',
                [username, profilePictureUrl, email]
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

    // PUT route to update the user's password
    router.put('/change-password', async (req, res) => {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, 'your_secret_key');
            const { email } = decoded;
            const { currentPassword, newPassword } = req.body;

            // Check if the current password is correct
            const { rows } = await pool.query('SELECT password FROM users WHERE email = $1', [email]);
            if (rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            const user = rows[0];
            const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ error: 'Invalid current password' });
            }

            // Hash the new password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            // Update the user's password in the database
            await pool.query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, email]);

            res.status(200).json({ message: 'Password updated successfully' });
        } catch (error) {
            console.error('Error updating password:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    return router;
};