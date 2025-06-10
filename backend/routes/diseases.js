// routes/disease.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const pool = require('../db'); // Pastikan path ini benar

const router = express.Router();

// Konfigurasi storage upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Pastikan folder 'uploads/' ada dan bisa ditulis
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Tambahkan Date.now() untuk nama unik
    }
});
const upload = multer({ storage: storage });

// POST: Upload foto deteksi & simpan data penyakit
// API menerima upload deteksi penyakit
// routes/disease.js

// Tambah validasi dan log error
router.post('/api/deteksi', upload.single('foto'), async (req, res) => {
    const { status, nama_penyakit } = req.body;
    
    if (!status || !nama_penyakit || !req.file) {
        return res.status(400).json({ error: 'Data tidak lengkap: status, nama_penyakit, dan foto wajib diisi.' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    try {
        const user_id = req.user?.id || 1;
        const lahan_id = 1;

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



// GET: Detail deteksi penyakit by id
router.get('/deteksi', async (req, res) => {
    try {
        const user_id = req.user?.id || 1; // ganti sesuai autentikasi, untuk test bisa pakai 1
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