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
    // Pastikan req.body.nama diubah menjadi req.body.name jika frontend mengirimnya demikian,
    // atau jika frontend tetap mengirim 'nama', kita bisa rename variabel di sini.
    // Asumsi frontend mengirim 'nama' dan kita akan merenamenya untuk DB.
    const { nama, longitude, latitude } = req.body; // Frontend mengirim 'nama'
    const foto = req.file ? req.file.filename : null;
    const userId = req.user.userId; // Mengambil userId dari token yang sudah diautentikasi
    const createdAt = new Date(); // Membuat timestamp untuk created_add

    try {
        const result = await pool.query(
            // --- PERBAIKAN DI SINI ---
            // 1. Mengubah 'nama' menjadi 'name'
            // 2. Menambahkan 'created_add' ke daftar kolom
            // 3. Menambahkan $6 untuk nilai created_add
            'INSERT INTO lahan (user_id, name, longitude, latitude, foto, created_add) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [userId, nama, longitude, latitude, foto, createdAt] // Menyesuaikan urutan dan menambahkan createdAt
        );
        res.json(result.rows[0]);
    } catch (e) {
        console.error('Error saat input lahan:', e.message); // Log error lebih detail di server
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
        console.error('Error saat ambil data lahan:', e.message); // Log error lebih detail
        res.status(500).json({ error: 'Gagal ambil data lahan' });
    }
});

module.exports = router;