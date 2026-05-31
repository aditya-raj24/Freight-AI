const axios = require('axios');

const FLASK_API_URL = process.env.FLASK_API_URL || 'http://127.0.0.1:5000';

exports.getDelayPrediction = async (data) => {
    try {
        const response = await axios.post(`${FLASK_API_URL}/predict`, data);
        return response.data.delay;
    } catch (error) {
        console.error("Error communicating with Flask API:", error.message);
        throw new Error("Failed to get prediction from ML model");
    }
};
