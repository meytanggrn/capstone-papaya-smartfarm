const express = require('express');
const authenticateToken = require('./middleware/auth');
const pool = require('./db');
const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
    // Contoh: return dummy data
    // Atau dari database sesuai user: 
    // const data = await pool.query('SELECT * FROM sensor_data WHERE user_id = $1', [req.user.userId]);
    // res.json({ sensorData: data.rows });
});

module.exports = router;
