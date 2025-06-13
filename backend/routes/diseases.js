const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../db'); // Pastikan path ini benar

const router = express.Router();

// Pastikan folder uploads ada
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory:', uploadsDir);
}

// Konfigurasi penyimpanan file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'disease-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Konfigurasi multer dengan validasi
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: function (req, file, cb) {
    // Hanya terima image files
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('File harus berupa gambar'), false);
    }
    cb(null, true);
  }
});

// POST: Simpan deteksi penyakit
router.post('/', upload.single('foto'), async (req, res) => {
  try {
    console.log('📤 POST /api/deteksi - Request received');
    console.log('Body:', req.body);
    console.log('File:', req.file ? req.file.filename : 'No file');

    const { status, nama_penyakit, confidence, title } = req.body;
    
    // Validasi input
    if (!status || !nama_penyakit || !req.file) {
      console.log('❌ Validation failed:', { status, nama_penyakit, hasFile: !!req.file });
      return res.status(400).json({ 
        success: false, 
        message: 'status, nama_penyakit, dan foto wajib diisi.',
        received: { status, nama_penyakit, hasFile: !!req.file }
      });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    const user_id = 1; // Untuk sementara hardcode, nanti bisa dari token
    const lahan_id = 1; // Untuk sementara hardcode
    const detectionTitle = title || `Deteksi ${nama_penyakit}`;
    const confidenceLevel = confidence || '0';

    console.log('💾 Saving to database:', {
      user_id,
      lahan_id,
      title: detectionTitle,
      status,
      imageUrl,
      confidence: confidenceLevel
    });

    // Insert ke database
    const query = `
      INSERT INTO deteksi_penyakit 
      (user_id, lahan_id, title, status, image_url, confidence, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW()) 
      RETURNING *
    `;
    
    const values = [user_id, lahan_id, detectionTitle, status, imageUrl, confidenceLevel];
    const { rows } = await pool.query(query, values);

    const data = rows[0];
    const model = {
      id: data.id,
      title: data.title,
      status: data.status,
      image_url: data.image_url,
      confidence: data.confidence,
      created_at: data.created_at,
    };

    console.log('✅ Successfully saved:', model);

    res.json({ 
      success: true, 
      message: 'Data berhasil disimpan',
      model 
    });

  } catch (error) {
    console.error('❌ Error in POST /api/deteksi:', error);
    
    // Hapus file jika ada error
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
        console.log('🗑️ Deleted uploaded file due to error');
      } catch (unlinkError) {
        console.error('Failed to delete file:', unlinkError);
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

// GET: Ambil semua data deteksi
router.get('/', async (req, res) => {
  try {
    console.log('📥 GET /api/deteksi - Request received');
    
    const user_id = 1; // Untuk sementara hardcode
    const result = await pool.query(
      `SELECT id, title, status, image_url, confidence, created_at 
       FROM deteksi_penyakit 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [user_id]
    );

    const models = result.rows.map(data => ({
      id: data.id,
      title: data.title,
      status: data.status,
      image_url: data.image_url,
      confidence: data.confidence,
      created_at: data.created_at,
    }));

    console.log(`✅ Retrieved ${models.length} detection records`);

    res.json({ 
      success: true, 
      models,
      count: models.length
    });

  } catch (error) {
    console.error('❌ Error in GET /api/deteksi:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Gagal mengambil data deteksi penyakit',
      error: error.message 
    });
  }
});

// GET: Detail deteksi berdasarkan ID
router.get('/:id', async (req, res) => {
  try {
    console.log(`📥 GET /api/deteksi/${req.params.id} - Request received`);
    
    const result = await pool.query(
      `SELECT id, title, status, image_url, confidence, created_at 
       FROM deteksi_penyakit 
       WHERE id = $1`, 
      [req.params.id]
    );

    if (result.rows.length === 0) {
      console.log(`❌ Data with ID ${req.params.id} not found`);
      return res.status(404).json({ 
        success: false, 
        message: 'Data tidak ditemukan' 
      });
    }

    const data = result.rows[0];
    const model = {
      id: data.id,
      title: data.title,
      status: data.status,
      image_url: data.image_url,
      confidence: data.confidence,
      created_at: data.created_at,
    };

    console.log('✅ Retrieved detection detail:', model);

    res.json({ 
      success: true, 
      model 
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

// DELETE: Hapus deteksi berdasarkan ID
router.delete('/:id', async (req, res) => {
  try {
    console.log(`🗑️ DELETE /api/deteksi/${req.params.id} - Request received`);
    
    // Get the record first to delete the image file
    const selectResult = await pool.query(
      'SELECT image_url FROM deteksi_penyakit WHERE id = $1',
      [req.params.id]
    );

    if (selectResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Data tidak ditemukan' 
      });
    }

    // Delete from database
    const deleteResult = await pool.query(
      'DELETE FROM deteksi_penyakit WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    // Delete image file
    const imageUrl = selectResult.rows[0].image_url;
    if (imageUrl) {
      const imagePath = path.join(__dirname, '..', imageUrl);
      try {
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          console.log('🗑️ Deleted image file:', imagePath);
        }
      } catch (fileError) {
        console.error('Failed to delete image file:', fileError);
      }
    }

    console.log('✅ Successfully deleted detection record');

    res.json({ 
      success: true, 
      message: 'Data berhasil dihapus',
      deleted: deleteResult.rows[0]
    });

  } catch (error) {
    console.error(`❌ Error in DELETE /api/deteksi/${req.params.id}:`, error);
    res.status(500).json({ 
      success: false, 
      message: 'Gagal menghapus data',
      error: error.message 
    });
  }
});

module.exports = router;