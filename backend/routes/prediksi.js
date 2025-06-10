const express = require('express');
const multer = require('multer');
const path = require('path');
const pool = require('../db');

const router = express.Router();
app.post('/api/predict', (req, res) => {
    const suhu = req.body.suhu
    // Model dummy: hasil = suhu * 1.5 + 10 (samakan dengan model tfjs)
    const result = (suhu * 1.5 + 10).toFixed(2)
    res.json({ result })
})

// Variabel reaktif untuk prediksi
const inputValue = ref(30); // Nilai input default untuk prediksi (misal: suhu rata-rata)
const prediction = ref(null); // Hasil prediksi dari model TF.js lokal
const predictionAPI = ref(null); // Hasil prediksi dari API backend

// ====== MODEL REGRESI TFJS LOKAL =====
let model = null; // Variabel untuk menyimpan model TF.js
async function setupModel() {
    model = tf.sequential(); // Membuat model sequential baru
    // Menambahkan lapisan Dense (fully connected layer)
    // inputShape: [1] berarti model menerima 1 fitur input (misal: suhu)
    // units: 1 berarti model mengeluarkan 1 nilai output (misal: prediksi panen)
    model.add(tf.layers.dense({ inputShape: [1], units: 1 }));
    // Mengompilasi model dengan optimizer Stochastic Gradient Descent (SGD)
    // dan fungsi loss Mean Squared Error (MSE), cocok untuk regresi
    model.compile({ optimizer: 'sgd', loss: 'meanSquaredError' });
    // Data pelatihan dummy:
    // xs (fitur input): [28, 29, 30, 31, 32] (misal: suhu)
    // ys (label output): [52, 54, 55, 57, 58] (misal: kg panen)
    const xs = tf.tensor1d([28, 29, 30, 31, 32]);
    const ys = tf.tensor1d([52, 54, 55, 57, 58]);
    // Melatih model selama 120 epoch
    await model.fit(xs, ys, { epochs: 120 });
    // Catatan: Model ini adalah contoh *sangat sederhana* dan dilatih ulang setiap kali komponen di-mount.
    // Untuk model yang lebih serius, Anda akan memuat model yang sudah dilatih dari file.
}

async function doPredict() {
    if (!model) return; // Jika model belum dimuat/dilatih, keluar
    // Konversi inputValue menjadi tensor 2D dengan bentuk [1, 1] (1 sampel, 1 fitur)
    const input = tf.tensor2d([inputValue.value], [1, 1]);
    // Lakukan prediksi dan ambil datanya
    const output = await model.predict(input).data();
    // Simpan hasil prediksi (ambil elemen pertama dan format ke 2 desimal)
    prediction.value = output[0].toFixed(2);
}

// ====== PREDIKSI VIA BACKEND API =====
async function doPredictAPI() {
    try {
        // Mengirim permintaan POST ke API backend dengan nilai suhu
        const res = await axios.post(`${apiUrl}/api/predict`, {
            suhu: inputValue.value
        });
        predictionAPI.value = res.data.result; // Simpan hasil dari respons backend
    } catch (e) {
        predictionAPI.value = 'Gagal'; // Tangani error
    }
}