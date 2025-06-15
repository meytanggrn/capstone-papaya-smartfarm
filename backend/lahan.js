const express = require('express');
const multer = require('multer');
const path = require('path');
const authenticateToken = require('./middleware/auth');
const pool = require('./db');

const router = express.Router();

// 📁 Setup penyimpanan file untuk foto lahan
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Pastikan folder ini ada di proyek
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, unique + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

/**
 * 🔘 POST /api/lahan
 * Tambah data lahan + upload foto
 */
router.post('/', authenticateToken, upload.single('foto'), async (req, res) => {
    const { nama, longitude, latitude } = req.body;
    const foto = req.file ? req.file.filename : null;

    try {
        const result = await pool.query(
            'INSERT INTO lahan (user_id, nama, longitude, latitude, foto) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [req.user.userId, nama, longitude, latitude, foto]
        );

        // ✅ Return response JSON yang sesuai agar frontend tidak error
        res.status(201).json({
            message: 'Lahan berhasil disimpan',
            data: result.rows[0]
        });

    } catch (e) {
        console.error('Error insert lahan:', e);
        res.status(500).json({ error: 'Gagal input lahan: ' + e.message });
    }
});

/**
 * 🔘 GET /api/lahan
 * Ambil semua data lahan milik user yang sedang login
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM lahan WHERE user_id = $1 ORDER BY created_at DESC',
            [req.user.userId]
        );
        res.json(result.rows);
    } catch (e) {
        console.error('Error get lahan:', e);
        res.status(500).json({ error: 'Gagal ambil data lahan' });
    }
});

module.exports = router;