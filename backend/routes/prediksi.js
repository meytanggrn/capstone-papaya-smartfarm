const express = require('express');
const router = express.Router();
const tf = require('@tensorflow/tfjs');

// ----------------------
// 1. SET NILAI MIN-MAX DARI DATA TRAININGMU
//    (ganti dengan angka hasil analisis notebook-mu!)
// ----------------------
const NORMALIZATION = {
    suhu:      { min: 22,   max: 35 },   // contoh, sesuaikan!
    kelembaban:{ min: 60,   max: 85 },
    cahaya:    { min: 500,  max: 1500 },
    ph:        { min: 4.5,  max: 7.5 },
};

// ----------------------
// 2. FUNGSI NORMALISASI MIN-MAX
// ----------------------
function normalize(val, min, max) {
    if (max === min) return 0; // Hindari pembagian 0
    return (val - min) / (max - min);
}

// ----------------------
// 3. LOAD ATAU TRAIN MODEL
//    (Contoh: Model dummy simple, kamu bisa load dari file h5 atau tfjs)
// ----------------------
let model = null;

// Model dummy untuk contoh (bisa diganti loadLayersModel)
async function trainModel() {
    model = tf.sequential();
    model.add(tf.layers.dense({ inputShape: [4], units: 16, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 1 })); // Output 1 nilai (misal prediksi bulan/hari/kg)
    model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });

    // Data dummy [suhu, kelembaban, cahaya, ph] - HARUS sudah dinormalisasi juga saat training
    const xs = tf.tensor2d([
        [normalize(27,22,35), normalize(70,60,85), normalize(1200,500,1500), normalize(6,4.5,7.5)],
        [normalize(30,22,35), normalize(80,60,85), normalize(900,500,1500), normalize(5.8,4.5,7.5)],
        // ... tambahkan data trainingmu sendiri
    ]);
    const ys = tf.tensor2d([[4.0],[5.5]]); // Contoh: prediksi bulan/hari/kg

    await model.fit(xs, ys, { epochs: 120 });
    console.log('✅ Model prediksi panen dilatih');
}

trainModel(); // Panggil saat server start

// ----------------------
// 4. ENDPOINT PREDIKSI PANEN
// ----------------------
router.post('/api/prediksi', async (req, res) => {
    // Ambil data dari body POST (pastikan frontend mengirim semua)
    const { suhu, kelembaban, cahaya, ph } = req.body;

    // Validasi
    if (
        typeof suhu !== 'number' ||
        typeof kelembaban !== 'number' ||
        typeof cahaya !== 'number' ||
        typeof ph !== 'number'
    ) {
        return res.status(400).json({ error: 'Semua input harus berupa angka.' });
    }

    // Normalisasi input sesuai min-max
    const suhuNorm       = normalize(suhu, NORMALIZATION.suhu.min, NORMALIZATION.suhu.max);
    const kelembabanNorm = normalize(kelembaban, NORMALIZATION.kelembaban.min, NORMALIZATION.kelembaban.max);
    const cahayaNorm     = normalize(cahaya, NORMALIZATION.cahaya.min, NORMALIZATION.cahaya.max);
    const phNorm         = normalize(ph, NORMALIZATION.ph.min, NORMALIZATION.ph.max);

    try {
        const inputTensor = tf.tensor2d([[suhuNorm, kelembabanNorm, cahayaNorm, phNorm]], [1, 4]);
        const prediction = model.predict(inputTensor);
        const output = await prediction.data();
        const hasil = output[0];
        if (isNaN(hasil)) {
            return res.status(500).json({ error: 'Hasil prediksi tidak valid (NaN)' });
        }
        res.json({ prediksi: hasil });
    } catch (err) {
        console.error('❌ Gagal melakukan prediksi:', err);
        res.status(500).json({ error: 'Gagal memproses prediksi' });
    }
});

module.exports = router;
