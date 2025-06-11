<template>
  <div class="analisis-page-wrapper">
<div class="prediksi-container">
  <h2>Prediksi Panen Berdasarkan Sensor</h2>
  <div>
    <input v-model.number="suhu" type="number" placeholder="Suhu (°C)" />
    <input v-model.number="kelembapan" type="number" placeholder="Kelembapan (%)" />
    <input v-model.number="cahaya" type="number" placeholder="Cahaya (Lux)" />
    <input v-model.number="ph" type="number" placeholder="pH" />

    <button @click="doPredict" :disabled="predictionLoading">
      {{ predictionLoading ? 'Memproses...' : 'Prediksi (Local TFJS)' }}
    </button>
    <button @click="predictFromAPI">Prediksi via Backend API</button>

    <p v-if="prediction !== null">Prediksi Lokal: {{ prediction }} </p>
    <p v-if="predictionError" style="color: red;">{{ predictionError }}</p>
    <p><b>Prediksi API:</b> {{ predictionAPI }}</p>
  </div>
</div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import * as tf from '@tensorflow/tfjs'

const suhu = ref(0)
const kelembapan = ref(0)
const cahaya = ref(0)
const ph = ref(0)

const prediction = ref(null)
const predictionError = ref('')
const predictionLoading = ref(false)
const predictionAPI = ref(null)
let model = null

// Inisialisasi model lokal saat komponen di-mount
async function setupModel() {
  model = await tf.loadGraphModel('/model-prediksi/tfjs_model/model.json');
}


onMounted(setupModel)

function normalize(val, min, max) {
  return (val - min) / (max - min)
}
const NORM = {
  suhu:      { min: 22, max: 35 },
  kelembapan:{ min: 60, max: 85 },
  cahaya:    { min: 500, max: 1500 },
  ph:        { min: 4.5, max: 7.5 },
}

async function doPredict() {
  predictionLoading.value = true
  predictionError.value = ''
  prediction.value = null

  try {
    if (!model) {
      predictionError.value = 'Model belum dimuat. Silakan tunggu sebentar.'
      return
    }

    const s = parseFloat(suhu.value)
    const k = parseFloat(kelembapan.value)
    const c = parseFloat(cahaya.value)
    const p = parseFloat(ph.value)
    if ([s, k, c, p].some(isNaN)) {
      predictionError.value = 'Semua input harus angka!'
      return
    }

    // NORMALISASI DI SINI!
    const vals = [
      normalize(s, NORM.suhu.min, NORM.suhu.max),
      normalize(k, NORM.kelembapan.min, NORM.kelembapan.max),
      normalize(c, NORM.cahaya.min, NORM.cahaya.max),
      normalize(p, NORM.ph.min, NORM.ph.max)
    ]

    const inputTensor = tf.tensor2d([vals], [1, 4])
    const outputTensor = model.predict(inputTensor)
    const outputArray = await outputTensor.data()
    const hasil = outputArray[0]

    if (isNaN(hasil)) {
      predictionError.value = 'Hasil prediksi tidak valid (NaN).'
      prediction.value = null
    } else {
      prediction.value = hasil.toFixed(2)
    }

    inputTensor.dispose()
    outputTensor.dispose()
  } catch (e) {
    predictionError.value = 'Gagal melakukan prediksi: ' + (e.message || e)
    prediction.value = null
  } finally {
    predictionLoading.value = false
  }
}




// Prediksi via backend API
const predictFromAPI = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/prediksi', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    suhu: 27,
    kelembaban: 70,
    cahaya: 1200,
    ph: 6.5,
  })
});

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    predictionAPI.value = data.prediksi?.toFixed(2) || 'Error';
  } catch (error) {
    console.error('Gagal prediksi dari API:', error);
    predictionAPI.value = 'Gagal memuat prediksi dari server';
  }
};
</script>

<style scoped>
.analisis-page-wrapper {
  padding: 20px;
  max-width: 500px;
  margin: 0 auto;
  font-family: 'Arial', sans-serif;
}
.prediction-section {
  background: #f8fafb;
  border-radius: 14px;
  padding: 18px 14px;
  margin-top: 18px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}
input[type="number"] {
  margin-right: 8px;
  padding: 4px;
  width: 100px;
}
button {
  margin-right: 10px;
  padding: 6px 16px;
  border-radius: 8px;
  border: 1px solid #10B981;
  background: white;
  color: #10B981;
  font-weight: bold;
  cursor: pointer;
}
button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
p {
  margin: 12px 0 0 0;
}
</style>
