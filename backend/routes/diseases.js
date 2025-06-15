const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../db'); // Pastikan path ini benar ke konfigurasi database Anda

const router = express.Router();

// Pastikan folder uploads ada (ini akan berada di root direktori backend)
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory:', uploadsDir);
}

// Konfigurasi penyimpanan file dengan Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir); // Simpan di folder /uploads
  },
  filename: function (req, file, cb) {
    // Generate unique filename: disease-timestamp-random.ext
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'disease-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Konfigurasi Multer dengan validasi (hanya terima gambar, max 10MB)
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: function (req, file, cb) {
    // Only allow image mime types
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('File harus berupa gambar (JPEG, PNG, GIF, dll.)'), false);
    }
    cb(null, true);
  }
});

// POST: Endpoint untuk menyimpan hasil deteksi penyakit dan foto
// Endpoint: /api/deteksi
router.post('/', upload.single('foto'), async (req, res) => {
  try {
    console.log('📤 POST /api/deteksi - Request received');
    console.log('Body:', req.body);
    console.log('File:', req.file ? req.file.filename : 'No file uploaded');

    // Extract data from request body and file
    // Frontend mengirim 'status', 'nama_penyakit' dan 'foto'
    const { status, nama_penyakit } = req.body;
    // Frontend DeteksiScan2.vue tidak mengirim 'confidence', jadi pastikan ini bisa null/default
    // Frontend DeteksiScan2.vue tidak mengirim 'lahan_id' atau 'user_id' secara eksplisit
    // Anda perlu mendapatkan user_id dari sesi/token autentikasi yang sebenarnya.
    // Untuk saat ini, kita akan hardcode user_id dan lahan_id seperti sebelumnya.

    // Validasi input wajib
    if (!status || !nama_penyakit || !req.file) {
      console.log('❌ Validation failed: Missing required fields (status, nama_penyakit, or foto).');
      // Jika ada file terupload tapi validasi gagal, hapus file tersebut
      if (req.file) {
        fs.unlinkSync(req.file.path);
        console.log('🗑️ Deleted uploaded file due to validation error.');
      }
      return res.status(400).json({
        success: false,
        message: 'status, nama_penyakit, dan foto wajib diisi.',
        received: { status, nama_penyakit, hasFile: !!req.file }
      });
    }

    // Generate URL untuk foto yang disimpan
    // URL ini relatif dari root backend dan akan diakses frontend via /uploads
    const foto_url = `/uploads/${req.file.filename}`;

    // --- HARDCODE UNTUK SEMENTARA (Ganti dengan data asli dari autentikasi) ---
    const user_id = 1; // Ganti dengan user ID dari JWT/session user yang login
    const lahan_id = 1; // Ganti dengan lahan ID yang terkait, atau NULL jika tidak ada
    // ----------------------------------------------------------------------

    // `confidence` tidak dikirim dari frontend DeteksiScan.vue/DeteksiScan2.vue saat POST
    // Jadi, kita set ke NULL atau default 0. Backend Anda sebelumnya menggunakan 'confidence'.
    // Kita gunakan nama kolom sesuai DDL: `persentase_keyakinan`
    const persentase_keyakinan = req.body.probability ? parseFloat(req.body.probability) : null;
    // Jika frontend mengirim `probability` sebagai bagian dari body, gunakan itu.
    // Jika tidak, biarkan null.

    console.log('💾 Preparing to save to database:', {
      user_id,
      lahan_id,
      nama_penyakit,
      status,
      foto_url,
      persentase_keyakinan
    });

    // Query INSERT ke tabel deteksi_penyakit
    // Pastikan nama kolom di query ini sama persis dengan DDL tabel deteksi_penyakit Anda
    const query = `
            INSERT INTO deteksi_penyakit 
            (user_id, lahan_id, nama_penyakit, status, foto_url, persentase_keyakinan, timestamp_deteksi)
            VALUES ($1, $2, $3, $4, $5, $6, NOW()) 
            RETURNING id, user_id, lahan_id, nama_penyakit, status, foto_url, persentase_keyakinan, timestamp_deteksi;
        `;

    const values = [user_id, lahan_id, nama_penyakit, status, foto_url, persentase_keyakinan];
    const { rows } = await pool.query(query, values);

    const savedData = rows[0]; // Data yang baru disimpan dari database

    // Bentuk respons yang akan dikirim ke frontend
    const responseModel = {
      id: savedData.id,
      title: savedData.nama_penyakit, // Frontend DeteksiPenyakitDetail.vue menggunakan 'title'
      status: savedData.status,
      image_url: savedData.foto_url, // Frontend DeteksiPenyakitDetail.vue menggunakan 'image_url'
      confidence: savedData.persentase_keyakinan, // Sesuaikan dengan nama frontend
      created_at: savedData.timestamp_deteksi, // Sesuaikan dengan nama frontend
    };

    console.log('✅ Successfully saved detection record and responding with:', responseModel);

    res.status(201).json({ // 201 Created status
      success: true,
      message: 'Data deteksi berhasil disimpan',
      model: responseModel // Kirimkan model yang sudah diformat
    });

  } catch (error) {
    console.error('❌ Error in POST /api/deteksi:', error);

    // Hapus file yang terupload jika terjadi error saat insert ke DB
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
        console.log('🗑️ Deleted uploaded file due to error during database operation.');
      } catch (unlinkError) {
        console.error('Failed to delete file after DB error:', unlinkError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Gagal menyimpan data deteksi',
      error: error.message,
      detail: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// GET: Endpoint untuk mengambil semua data deteksi (untuk daftar di dashboard)
// Endpoint: /api/deteksi
router.get('/', async (req, res) => {
  try {
    console.log('📥 GET /api/deteksi - Request received for all detections');

    // --- HARDCODE UNTUK SEMENTARA (Ganti dengan user ID dari JWT/session) ---
    const user_id = 1;
    // ----------------------------------------------------------------------

    // Query SELECT semua data deteksi untuk user_id tertentu
    const result = await pool.query(
      `SELECT id, nama_penyakit, status, foto_url, persentase_keyakinan, timestamp_deteksi 
             FROM deteksi_penyakit 
             WHERE user_id = $1 
             ORDER BY timestamp_deteksi DESC`, // Urutkan berdasarkan waktu deteksi terbaru
      [user_id]
    );

    // Map hasil dari database ke format yang diharapkan frontend
    const models = result.rows.map(data => ({
      id: data.id,
      title: data.nama_penyakit, // Frontend Dashboard.vue kemungkinan menggunakan 'title'
      status: data.status,
      image_url: data.foto_url, // Frontend Dashboard.vue kemungkinan menggunakan 'image_url'
      confidence: data.persentase_keyakinan,
      created_at: data.timestamp_deteksi,
    }));

    console.log(`✅ Retrieved ${models.length} detection records for user ${user_id}`);

    res.json({
      success: true,
      models,
      count: models.length
    });

  } catch (error) {
    console.error('❌ Error in GET /api/deteksi (all):', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data deteksi penyakit',
      error: error.message
    });
  }
});

// GET: Endpoint untuk detail deteksi berdasarkan ID
// Endpoint: /api/deteksi/:id
router.get('/:id', async (req, res) => {
  try {
    console.log(`📥 GET /api/deteksi/${req.params.id} - Request received for single detection detail`);

    // Query SELECT data deteksi berdasarkan ID
    const result = await pool.query(
      `SELECT id, nama_penyakit, status, foto_url, persentase_keyakinan, timestamp_deteksi 
             FROM deteksi_penyakit 
             WHERE id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      console.log(`❌ Data deteksi dengan ID ${req.params.id} tidak ditemukan.`);
      return res.status(404).json({
        success: false,
        message: 'Data deteksi tidak ditemukan'
      });
    }

    const data = result.rows[0]; // Ambil baris pertama (harusnya cuma satu karena ID unik)

    // Bentuk respons yang akan dikirim ke frontend DeteksiPenyakitDetail.vue
    const responseModel = {
      id: data.id,
      title: data.nama_penyakit, // Frontend DeteksiPenyakitDetail.vue menggunakan 'title'
      status: data.status,
      image_url: data.foto_url, // Frontend DeteksiPenyakitDetail.vue menggunakan 'image_url'
      confidence: data.persentase_keyakinan,
      created_at: data.timestamp_deteksi,
      // Anda bisa tambahkan kolom lain di sini jika dibutuhkan di detail halaman
    };

    console.log('✅ Retrieved detection detail:', responseModel);

    res.json({
      success: true,
      model: responseModel // Kirimkan model yang sudah diformat
    });

  } catch (error) {
    console.error(`❌ Error in GET /api/deteksi/${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data detail penyakit',
      error: error.message
    });
  }
});

// DELETE: Endpoint untuk menghapus data deteksi berdasarkan ID
// Endpoint: /api/deteksi/:id
router.delete('/:id', async (req, res) => {
  try {
    console.log(`🗑️ DELETE /api/deteksi/${req.params.id} - Request received`);

    // Ambil URL gambar terlebih dahulu sebelum menghapus record dari DB
    const selectResult = await pool.query(
      'SELECT foto_url FROM deteksi_penyakit WHERE id = $1',
      [req.params.id]
    );

    if (selectResult.rows.length === 0) {
      console.log(`❌ Data deteksi dengan ID ${req.params.id} tidak ditemukan untuk dihapus.`);
      return res.status(404).json({
        success: false,
        message: 'Data deteksi tidak ditemukan'
      });
    }

    // Hapus record dari database
    const deleteResult = await pool.query(
      'DELETE FROM deteksi_penyakit WHERE id = $1 RETURNING *', // RETURNING * untuk mendapatkan data yang dihapus
      [req.params.id]
    );

    // Hapus file gambar dari server
    const foto_url_to_delete = selectResult.rows[0].foto_url;
    if (foto_url_to_delete) {
      // Path absolut ke file gambar di server
      const imagePath = path.join(__dirname, '..', foto_url_to_delete);
      try {
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath); // Hapus file
          console.log('🗑️ Deleted image file from server:', imagePath);
        } else {
          console.warn('⚠️ Image file not found on server, skipping deletion:', imagePath);
        }
      } catch (fileError) {
        console.error('Failed to delete image file (might be already deleted or permission issue):', fileError);
      }
    }

    console.log('✅ Successfully deleted detection record from database and file.');

    res.json({
      success: true,
      message: 'Data deteksi berhasil dihapus',
      deleted: deleteResult.rows[0] // Kirim data yang dihapus
    });

  } catch (error) {
    console.error(`❌ Error in DELETE /api/deteksi/${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus data deteksi',
      error: error.message
    });
  }
});

module.exports = router;