const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./db'); // Pastikan ini mengarah ke file koneksi database Anda
const router = express.Router();

router.post('/register', async (req, res) => {
    console.log('--- Menerima permintaan registrasi ---');
    console.log('Request Body:', req.body); // Cetak data yang diterima dari frontend

    const { email, password, name } = req.body;

    // Tambahkan validasi dasar untuk input
    if (!email || !password || !name) {
        console.error('Validation Error: Missing required fields (email, password, or name)');
        return res.status(400).json({ error: 'Email, password, dan nama harus diisi.' });
    }

    try {
        const hash = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name',
            [email, hash, name]
        );
        console.log('Pengguna berhasil didaftarkan:', result.rows[0].email);
        res.status(201).json(result.rows[0]); // Menggunakan 201 Created untuk registrasi
    } catch (e) {
        // Ini adalah bagian KRUSIAL: Mencetak detail error ke terminal backend
        console.error('--- ERROR PADA PROSES REGISTRASI ---');
        console.error('Objek Error Lengkap:', e); // Cetak seluruh objek error
        console.error('Pesan Error:', e.message); // Cetak pesan error
        console.error('Kode Error (jika ada):', e.code); // Cetak kode error (misal '23505')
        console.error('Stack Trace:', e.stack); // Cetak stack trace untuk melihat dari mana error berasal

        // Cek error unique violation (PostgreSQL error code)
        if (e.code === '23505') {
            res.status(400).json({ error: 'Email sudah digunakan!' });
        } else {
            // Untuk error lain, kirim pesan umum ke frontend, tapi log detail di backend
            res.status(500).json({ error: 'Server error: ' + (e.message || 'Unknown error occurred') });
        }
    }
});

router.post('/login', async (req, res) => {
    console.log('--- Menerima permintaan login ---');
    console.log('Request Body:', req.body);

    const { email, password } = req.body;
    if (!email || !password) {
        console.error('Validation Error: Missing email or password for login');
        return res.status(400).json({ error: 'Email dan password harus diisi.' });
    }

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            console.warn('Login attempt for non-existent user:', email);
            return res.status(400).json({ error: 'User tidak ditemukan' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.warn('Login attempt with wrong password for user:', email);
            return res.status(400).json({ error: 'Password salah' });
        }

        // Pastikan JWT_SECRET ada
        if (!process.env.JWT_SECRET) {
            console.error('ERROR: JWT_SECRET is not defined in .env file!');
            return res.status(500).json({ error: 'Server configuration error.' });
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        console.log('User logged in successfully:', user.email);
        res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
    } catch (e) {
        console.error('--- ERROR PADA PROSES LOGIN ---');
        console.error('Objek Error Lengkap:', e);
        console.error('Pesan Error:', e.message);
        console.error('Stack Trace:', e.stack);
        res.status(500).json({ error: 'Server error: ' + (e.message || 'Unknown error occurred') }); // Lebih informatif
    }
});

module.exports = router;