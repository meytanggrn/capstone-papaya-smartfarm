// routes/diseases.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const pool = require('../db'); // Pastikan path dan export pool benar

const router = express.Router();

// ========== SETUP MULTER UNTUK UPLOAD ==========
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Pastikan folder 'uploads/' ada
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// ========== ROUTE: UPLOAD & SIMPAN DETEKSI ==========
router.post('/api/deteksi', upload.single('foto'), async (req, res) => {
    try {
        // Validasi input
        const { status, nama_penyakit } = req.body;
        console.log('Body:', req.body);
        console.log('File:', req.file);

        if (!status || !nama_penyakit || !req.file) {
            return res.status(400).json({ error: 'Data tidak lengkap: status, nama_penyakit, dan foto wajib diisi.' });
        }

        // Buat url untuk gambar yang disimpan
        const imageUrl = `/uploads/${req.file.filename}`;

        // Sementara: user_id dan lahan_id dummy, sesuaikan dengan autentikasi kamu
        const user_id = req.user?.id || 1;
        const lahan_id = 1;

        // Simpan ke database
        const { rows } = await pool.query(
            `INSERT INTO deteksi_penyakit (user_id, lahan_id, title, status, image_url)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [user_id, lahan_id, nama_penyakit, status, imageUrl]
        );

        res.json(rows[0]);
    } catch (e) {
        console.error('DB Error:', e.message);
        res.status(500).json({ error: 'Gagal menyimpan data deteksi', detail: e.message });
    }
});

// ========== ROUTE: LIST SEMUA DETEKSI BY USER ==========
router.get('/deteksi', async (req, res) => {
    try {
        const user_id = req.user?.id || 1; // ganti sesuai autentikasi
        const result = await pool.query(
            'SELECT * FROM deteksi_penyakit WHERE user_id = $1 ORDER BY created_at DESC',
            [user_id]
        );
        res.json(result.rows);
    } catch (e) {
        console.error('Error saat mengambil data deteksi:', e);
        res.status(500).json({ error: 'Gagal ambil data deteksi penyakit' });
    }
});

// ========== ROUTE: DETAIL DETEKSI BY ID ==========
router.get('/deteksi/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM deteksi_penyakit WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(result.rows[0]);
    } catch (e) {
        console.error('Error saat mengambil detail penyakit:', e);
        res.status(500).json({ error: 'Gagal ambil data detail penyakit' });
    }
});

module.exports = router;
