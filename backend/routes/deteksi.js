const express = require('express');
const multer = require('multer');
const path = require('path');
const pool = require('../db');
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Tambahkan deteksi penyakit
router.post('/deteksi', upload.single('foto'), async (req, res) => {
  try {
    const { status, nama_penyakit } = req.body;
    if (!status || !nama_penyakit || !req.file) {
      return res.status(400).json({ error: 'status, nama_penyakit, dan foto wajib diisi.' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    const user_id = 1;
    const lahan_id = 1;
    const { rows } = await pool.query(
      `INSERT INTO deteksi_penyakit (user_id, lahan_id, title, status, image_url)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [user_id, lahan_id, nama_penyakit, status, imageUrl]
    );
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Gagal menyimpan data deteksi', detail: e.message });
  }
});

// List semua deteksi penyakit user
router.get('/deteksi', async (req, res) => {
  try {
    const user_id = 1;
    const result = await pool.query(
      'SELECT * FROM deteksi_penyakit WHERE user_id = $1 ORDER BY created_at DESC',
      [user_id]
    );
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: 'Gagal ambil data deteksi penyakit' });
  }
});

// Detail deteksi penyakit
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
