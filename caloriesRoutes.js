const express = require('express');
const jwt = require('jsonwebtoken');

module.exports = (pool) => {
    const router = express.Router();

    // POST route to calculate calories
    router.post('/calculate', async (req, res) => {
        try {
            const token = req.headers.authorization.split(' ')[1];
            console.log('Received token:', token); // Log the received token

            const decoded = jwt.verify(token, 'your_secret_key');
            const { user_id } = decoded;
            console.log('Decoded user_id:', user_id); // Log the decoded user_id

            const { age, weight, height, gender, activityLevel } = req.body;
            console.log('Received request body:', req.body);

            // Validate and sanitize input values
            const sanitizedAge = parseInt(age, 10);
            const sanitizedWeight = parseFloat(weight);
            const sanitizedHeight = parseInt(height, 10);

            if (isNaN(sanitizedAge) || isNaN(sanitizedWeight) || isNaN(sanitizedHeight)) {
                return res.status(400).json({ error: 'Invalid input values' });
            }

            // Calculate calorie values
            const bmr = calculateBMR(gender, sanitizedAge, sanitizedWeight, sanitizedHeight);
            const activityFactor = getActivityFactor(activityLevel);
            const restingCalories = Math.round(bmr);
            const calorieIntake = Math.round(bmr * activityFactor);
            const caloriesBurned = Math.round(calorieIntake - restingCalories);

            console.log('Response data:', { restingCalories, calorieIntake, caloriesBurned });

            res.json({ restingCalories, calorieIntake, caloriesBurned });
        } catch (error) {
            console.error('Error calculating calories:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Helper functions for BMR calculation and activity factor
    const calculateBMR = (gender, age, weight, height) => {
        const weightInKg = parseFloat(weight);
        const heightInCm = parseFloat(height);
        let bmr;

        if (gender === 'male') {
            bmr = 88.362 + 13.397 * weightInKg + 4.799 * heightInCm - 5.677 * age;
        } else {
            bmr = 447.593 + 9.247 * weightInKg + 3.098 * heightInCm - 4.33 * age;
        }

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