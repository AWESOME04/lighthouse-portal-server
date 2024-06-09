const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const sharp = require('sharp');
const isDev = process.env.NODE_ENV !== 'production';

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
                "SELECT username, email, profilepic FROM users WHERE email = $1",
                [email]
            );
            if (rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            const user = rows[0];
            const profilePictureUrl = user.profilepic
                ? `${req.protocol}://${req.get('host')}/uploads/${user.profilepic}`
                : '';
            // res.json({ ...user, profilePictureUrl });
            res.json({ ...user, profilePictureFilename: user.profilepic });
        } catch (error) {
            console.error('Error fetching user details:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });


    // GET route to fetch the user's resized profile picture URL
    router.get('/profile-picture', async (req, res) => {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, 'your_secret_key');
            const { email } = decoded;
            const { rows } = await pool.query(
                'SELECT profilepic FROM users WHERE email = $1',
                [email]
            );
            if (rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            const profilePictureFilename = rows[0].profilepic;
            if (!profilePictureFilename) {
                return res.json({ profilePictureUrl: '' });
            }

            const profilePicturePath = path.join(
                __dirname,
                '..',
                'uploads',
                profilePictureFilename
            );
            const resizedImageBuffer = await sharp(profilePicturePath)
                .resize(100, 100)
                .toFormat('jpeg')
                .toBuffer();

            res.set('Content-Type', 'image/jpeg');
            res.send(resizedImageBuffer);
        } catch (error) {
            console.error('Error fetching user profile picture:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    router.get('/profile-picture/:filename', async (req, res) => {
        const { filename } = req.params;

        try {
            if (isDev) {
                // Serve the profile picture in development environment
                const profilePicturePath = path.join(__dirname, '..', 'uploads', filename);
                if (fs.existsSync(profilePicturePath)) {
                    res.sendFile(profilePicturePath);
                } else {
                    res.status(404).json({ error: 'Profile picture not found' });
                }
            } else {
                // Serve the profile picture in production environment
                res.sendFile(path.join(__dirname, '..', 'uploads', filename));
            }
        } catch (err) {
            console.error('Error serving profile picture:', err);
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
            const profilepic = req.file ? req.file.filename : null;

            const { rows } = await pool.query(
                'UPDATE users SET username = $1, profilepic = $2 WHERE email = $3 RETURNING *',
                [username, profilepic, email]
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

    // Delete route to delete a particular user from the database
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