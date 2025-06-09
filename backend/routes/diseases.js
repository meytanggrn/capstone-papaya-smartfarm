// routes/disease.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const pool = require('../db');

const router = express.Router();

// Konfigurasi storage upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// POST: Upload foto deteksi & simpan data penyakit
// API menerima upload deteksi penyakit
router.post('/deteksi', async (req, res) => {
  const { user_id, lahan_id, title, status, note, image_url } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO deteksi_penyakit (user_id, lahan_id, title, status, note, image_url)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [user_id, lahan_id, title, status, note, image_url]
    );
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Gagal simpan data deteksi', detail: e.message });
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
    res.status(500).json({ error: 'Gagal ambil data deteksi penyakit' });
  }
});
router.get('/deteksi/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM deteksi_penyakit WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Gagal ambil data detail penyakit' });
  }
});



module.exports = router;
