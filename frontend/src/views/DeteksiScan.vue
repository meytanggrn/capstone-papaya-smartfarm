<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import * as tf from '@tensorflow/tfjs'
import '@tensorflow/tfjs-backend-webgl'
import '@tensorflow/tfjs-backend-cpu'

const apiUrl = 'http://localhost:5000'
const router = useRouter()
const fotoFile = ref(null)
const error = ref('')
const loading = ref(false)
const loadingMessage = ref('')
const model = ref(null)
const imagePreview = ref(null)
const predictionResult = ref(null)
const backendInitialized = ref(false)
const debugMode = ref(true)
const IMAGE_SIZE = 256

onMounted(async () => {
  loadingMessage.value = 'Menyiapkan AI...'
  loading.value = true
  try {
    await tf.setBackend('webgl')
    await tf.ready()
    console.log('Backend aktif:', tf.getBackend())
    backendInitialized.value = true

    model.value = await tf.loadLayersModel('/model/tfjs_model/model.json')
    console.log('Model berhasil dimuat')
    loading.value = false
  } catch (err) {
    console.error('Inisialisasi gagal:', err)
    error.value = 'Gagal inisialisasi model atau backend.'
    loading.value = false
  }
})

const onFileChange = e => {
  fotoFile.value = e.target.files[0]
  predictionResult.value = null
  if (fotoFile.value) {
    const reader = new FileReader()
    reader.onload = ev => (imagePreview.value = ev.target.result)
    reader.readAsDataURL(fotoFile.value)
  } else {
    imagePreview.value = null
  }
}

function preprocessImage(image) {
  const tensor = tf.browser.fromPixels(image)
    .resizeNearestNeighbor([IMAGE_SIZE, IMAGE_SIZE])
    .toFloat()
    .div(255.0)
    .expandDims()
  return tensor
}

const predictDisease = async imageFile => {
  if (!backendInitialized.value || !model.value) {
    error.value = 'AI belum siap digunakan.'
    return null
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async ev => {
      const img = new Image()
      img.onload = async () => {
        try {
          const input = preprocessImage(img)
          const prediction = model.value.predict(input)
          const probs = prediction.dataSync()
          const labels = ['Bercak Daun', 'Hawar Daun', 'Karat Daun', 'Busuk Batang', 'Sehat']

          const top = probs.map((p, i) => ({ className: labels[i], probability: p }))
            .reduce((a, b) => (a.probability > b.probability ? a : b))

          input.dispose()
          prediction.dispose()
          resolve(top)
        } catch (err) {
          console.error('Prediksi gagal:', err)
          reject('Gagal prediksi.')
        }
      }
      img.onerror = () => reject('Gagal memuat gambar.')
      img.src = ev.target.result
    }
    reader.onerror = () => reject('Gagal membaca file.')
    reader.readAsDataURL(imageFile)
  })
}

const submitDeteksi = async () => {
  if (!fotoFile.value || !model.value) {
    error.value = 'Gambar atau model belum tersedia.'
    return
  }

  loading.value = true
  loadingMessage.value = 'Memprediksi penyakit...'
  try {
    const prediction = await predictDisease(fotoFile.value)
    predictionResult.value = prediction

    loadingMessage.value = 'Menyimpan ke server...'
    const form = new FormData()
    form.append('foto', fotoFile.value)
    form.append('status', prediction.className === 'Sehat' ? 'Sehat' : 'Terdeteksi')
    form.append('nama_penyakit', prediction.className)

    const { data } = await axios.post(`${apiUrl}/api/deteksi`, form)

    router.replace({ path: '/deteksi/detail', query: { id: data.id } })
  } catch (err) {
    error.value = err || 'Gagal prediksi atau upload.'
    console.error('Kesalahan:', err)
  } finally {
    loading.value = false
  }
}
</script>


<template>
  <div>
    <h1>Deteksi Penyakit Tanaman</h1>

    <input
  type="file"
  accept="image/*"
  @change="onFileChange"
  class="w-full border border-gray-300 rounded p-2"
/>

<div v-if="imagePreview" class="text-center">
  <img
    :src="imagePreview"
    alt="Preview"
    class="max-w-xs mx-auto rounded shadow"
  />
</div>

<button
  @click="submitDeteksi"
  :disabled="loading"
  class="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:bg-gray-400"
>
  {{ loading ? loadingMessage : 'Deteksi Sekarang' }}
</button>

<div v-if="predictionResult" class="bg-white shadow p-4 rounded">
  <h2 class="text-xl font-semibold text-green-700">Hasil Prediksi</h2>
  <p><strong>Penyakit:</strong> {{ predictionResult.className }}</p>
  <p><strong>Probabilitas:</strong> {{ (predictionResult.probability * 100).toFixed(2) }}%</p>
</div>

<div v-if="error" class="text-red-600 text-sm font-semibold">
  {{ error }}
</div>
  </div>
</template>

<style scoped>
.scan-layout {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f0f2f5;
}

.scan-card {
  background-color: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
  width: 100%;
  max-width: 500px;
}

.btn-photo {
  background-color: #4CAF50; 
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  margin-top: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%; /* Make button full width */
}

.btn-photo:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.spinner {
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top: 4px solid white;
  width: 20px;
  height: 20px;
  -webkit-animation: spin 1s linear infinite; /* Safari */
  animation: spin 1s linear infinite;
  margin-right: 8px;
}

/* Safari */
@-webkit-keyframes spin {
  0% { -webkit-transform: rotate(0deg); }
  100% { -webkit-transform: rotate(360deg); }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.image-preview {
  margin-top: 15px;
  border: 1px solid #ddd;
  padding: 10px;
  border-radius: 5px;
}
</style>