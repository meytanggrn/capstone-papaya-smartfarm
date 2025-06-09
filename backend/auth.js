const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./db');
const router = express.Router();

router.post('/register', async (req, res) => {
    const { email, password, name } = req.body;
    try {
        const hash = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name',
            [email, hash, name]
        );
        res.json(result.rows[0]);
    } catch (e) {
        // Cek error unique violation
        if (e.code === '23505') {
            res.status(400).json({ error: 'Email sudah digunakan!' });
        } else {
            res.status(500).json({ error: 'Server error: ' + e.message });
        }
    }
});


router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];
        if (!user) return res.status(400).json({ error: 'User tidak ditemukan' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Password salah' });

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
