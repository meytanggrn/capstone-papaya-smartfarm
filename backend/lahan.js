const express = require('express');
const multer = require('multer');
const path = require('path');
const authenticateToken = require('./middleware/auth');
const pool = require('./db');

const router = express.Router();

// Setup storage untuk foto
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // folder uploads, buat jika belum ada
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, unique + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// API input data lahan
router.post('/', authenticateToken, upload.single('foto'), async (req, res) => {
    const { nama, longitude, latitude } = req.body;
    const foto = req.file ? req.file.filename : null;
    try {
        const result = await pool.query(
            'INSERT INTO lahan (user_id, nama, longitude, latitude, foto) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [req.user.userId, nama, longitude, latitude, foto]
        );
        res.json(result.rows[0]);
    } catch (e) {
        res.status(500).json({ error: 'Gagal input lahan: ' + e.message });
    }
});

// Endpoint GET semua lahan milik user (optional)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM lahan WHERE user_id = $1',
            [req.user.userId]
        );
        res.json(result.rows);
    } catch (e) {
        res.status(500).json({ error: 'Gagal ambil data lahan' });
    }
});

module.exports = router;
