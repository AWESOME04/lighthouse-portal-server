const express = require('express');
const jwt = require('jsonwebtoken');

module.exports = (pool) => {
    const router = express.Router();

    // POST route to calculate calories
    router.post('/calculate', async (req, res) => {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, 'your_secret_key');
            const { user_id } = decoded;
            const { age, weight, height, gender, activityLevel } = req.body;

            // Validate and sanitize input values
            const sanitizedAge = parseInt(age, 10);
            const sanitizedWeight = parseFloat(weight);
            const sanitizedHeight = parseInt(height, 10);

            if (isNaN(sanitizedAge) || isNaN(sanitizedWeight) || isNaN(sanitizedHeight)) {
                return res.status(400).json({ error: 'Invalid input values' });
            }

            // Fetch the user's measurements from the user_measurements table
            const { rows } = await pool.query(
                'SELECT age, weight, height, gender, activity_level FROM user_measurements WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
                [user_id]
            );

            let userMeasurements;
            if (rows.length > 0) {
                userMeasurements = rows[0];
            } else {
                // Insert the user's measurements into the user_measurements table
                const insertResult = await pool.query(
                    'INSERT INTO user_measurements (user_id, age, weight, height, gender, activity_level) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                    [user_id, sanitizedAge, sanitizedWeight, sanitizedHeight, gender, activityLevel]
                );
                userMeasurements = insertResult.rows[0];
            }

            // Calculate calorie values
            const bmr = calculateBMR(userMeasurements.gender, userMeasurements.age, userMeasurements.weight, userMeasurements.height);
            const restingCalories = Math.round(bmr);
            const calorieIntake = Math.round(bmr * getActivityFactor(userMeasurements.activity_level));
            const caloriesBurned = Math.round(calorieIntake - restingCalories);

            res.json({ restingCalories, calorieIntake, caloriesBurned });
        } catch (error) {
            console.error('Error calculating calories:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Helper functions for BMR calculation and activity factor
    const calculateBMR = (gender, age, weight, height) => {
        const bmr = gender === 'male'
            ? 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age
            : 447.593 + 9.247 * weight + 3.098 * height - 4.33 * age;

        return bmr;
    };

    const getActivityFactor = (activityLevel) => {
        switch (activityLevel) {
            case 'sedentary':
                return 1.2;
            case 'lightly':
                return 1.375;
            case 'moderately':
                return 1.55;
            case 'very':
                return 1.725;
            case 'extra':
                return 1.9;
            default:
                return 1.2;
        }
    };

    return router;
};