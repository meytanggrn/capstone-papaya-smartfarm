<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import * as tf from '@tensorflow/tfjs'
import '@tensorflow/tfjs-backend-webgl'
import '@tensorflow/tfjs-backend-cpu'

const apiUrl = 'http://localhost:5000'
const router = useRouter()

// Reactive state
const fotoFile = ref(null)
const imagePreview = ref(null)
const predictionResult = ref(null)
const error = ref('')
const loading = ref(false)
const loadingMessage = ref('')
const model = ref(null)
const debug = true

const IMAGE_SIZE = 256

// Inisialisasi TFJS backend & load model
onMounted(async () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  loading.value = true
  loadingMessage.value = 'Menyiapkan AI...'

  // 1) Pilih backend WebGL, lalu fallback ke CPU jika gagal
  try {
    await tf.setBackend('webgl')
    await tf.ready()
    if (debug) console.log('TFJS backend aktif (webgl)')
  } catch {
    console.warn('WebGL gagal, fallback ke CPU')
    await tf.setBackend('cpu')
    await tf.ready()
    if (debug) console.log('TFJS backend aktif (cpu)')
  }

  // 2) Muat model LayersModel (Keras→TFJS)
  try {
    model.value = await tf.loadLayersModel('/model/tfjs_model/model.json')
    if (debug) console.log('Model berhasil dimuat (LayersModel)')
  } catch (e) {
    console.error('Gagal loadLayersModel:', e)
    error.value = 'Gagal memuat model AI'
  } finally {
    loading.value = false
  }
})

// Saat user pilih file
function onFileChange(e) {
  fotoFile.value = e.target.files[0] || null
  predictionResult.value = null
  error.value = ''

  if (fotoFile.value) {
    const reader = new FileReader()
    reader.onload = ev => {
      imagePreview.value = ev.target.result
    }
    reader.readAsDataURL(fotoFile.value)
  } else {
    imagePreview.value = null
  }
}

// Ubah HTMLImageElement menjadi tensor siap predict
function preprocessImage(img) {
  return tf.browser
    .fromPixels(img)
    .resizeNearestNeighbor([IMAGE_SIZE, IMAGE_SIZE])
    .toFloat()
    .div(tf.scalar(255.0))
    .expandDims()  // [1,256,256,3]
}

// Lakukan prediksi
async function predictDisease(file) {
  if (!model.value) {
    throw new Error('Model belum dimuat')
  }

  // 1) Baca file jadi HTMLImageElement
  const img = await new Promise((res, rej) => {
    const reader = new FileReader()
    reader.onload = e => {
      const image = new Image()
      image.onload = () => res(image)
      image.onerror = () => rej('Gagal memuat gambar')
      image.src = e.target.result
    }
    reader.onerror = () => rej('Gagal membaca file')
    reader.readAsDataURL(file)
  })

  // 2) Preprocess & predict dalam satu tf.tidy scope
  return tf.tidy(() => {
    const input = preprocessImage(img)

    if (debug) {
      console.log('Tensor shape:', input.shape)
      console.log('Current backend:', tf.getBackend())
    }

    // .predict untuk LayersModel
    const logits = model.value.predict(input)
    const scores = Array.from(logits.dataSync())

    input.dispose()
    logits.dispose()

    const labels = [
      'Bercak Daun',
      'Hawar Daun',
      'Karat Daun',
      'Busuk Batang',
      'Sehat'
    ]

    return scores
      .map((p, i) => ({ className: labels[i], probability: p }))
      .reduce((a, b) => (a.probability > b.probability ? a : b))
  })
}


async function submitDeteksi() {
  if (!fotoFile.value) {
    error.value = 'Pilih gambar terlebih dahulu'
    return
  }

  if (!model.value) {
    error.value = 'Model belum dimuat, tunggu sebentar lalu coba lagi'
    return
  }

  loading.value = true
  loadingMessage.value = 'Memprediksi penyakit...'
  error.value = ''

  try {
    await tf.ready();
    console.log('TFJS backend:', tf.getBackend());
    const pred = await predictDisease(fotoFile.value)
    predictionResult.value = pred

  } catch (e) {
    console.error('Error submitDeteksi:', e)
    error.value = typeof e === 'string' ? e : (e?.message || 'Gagal prediksi atau upload')
  } finally {
    loading.value = false
  }
}


</script>


<template>
  <div>
    <h2>Deteksi Penyakit Tanaman</h2>

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