<template>
  <div class="scan-card">
    <h2>Deteksi Penyakit Tanaman</h2>

    <input type="file" accept="image/*" @change="onFileChange" />
    <div v-if="imagePreview">
      <img :src="imagePreview" alt="Preview" style="max-width:200px; margin-top:10px;" />
    </div>

    <button @click="submitDeteksi" :disabled="loading || !isModelReady" class="btn-green">
      {{ loading ? loadingMessage : (isModelReady ? 'Deteksi Sekarang' : 'Memuat Model...') }}
    </button>

    <div v-if="predictionResult" class="hasil">
      <b>Penyakit:</b> {{ predictionResult.className }}<br>
      <b>Probabilitas:</b> {{ (predictionResult.probability * 100).toFixed(2) }}%
    </div>
    <div v-if="error" style="color:red">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import * as tf from '@tensorflow/tfjs'
import '@tensorflow/tfjs-backend-webgl'
import '@tensorflow/tfjs-backend-cpu'

const apiUrl = 'http://localhost:5000'
const fotoFile = ref(null)
const imagePreview = ref(null)
const predictionResult = ref(null)
const error = ref('')
const loading = ref(false)
const loadingMessage = ref('')
const model = ref(null)
const isModelReady = ref(false)
const IMAGE_SIZE = 256

onMounted(async () => {
  try {
    console.log('Initializing TensorFlow.js...')
    
    // Coba webgl dulu, kalau gagal fallback ke cpu
    try {
      await tf.setBackend('webgl')
    } catch (e) {
      console.warn('WebGL backend failed, falling back to CPU:', e)
      await tf.setBackend('cpu')
    }
    
    await tf.ready()
    console.log('TensorFlow.js ready! Backend:', tf.getBackend())
    
    // Test tensor operation
    const testTensor = tf.tensor([1, 2, 3])
    console.log('Test tensor created successfully')
    testTensor.dispose()
    
    console.log('Loading model...')
    model.value = await tf.loadLayersModel('/model/tfjs_model/model.json')
    console.log('Model loaded successfully!', model.value)
    isModelReady.value = true
    
  } catch (e) {
    console.error('TFJS initialization error:', e)
    error.value = `Gagal memuat model: ${e.message}`
    isModelReady.value = false
  }
})

function onFileChange(e) {
  fotoFile.value = e.target.files[0] || null
  predictionResult.value = null
  error.value = ''
  if (fotoFile.value) {
    const reader = new FileReader()
    reader.onload = ev => { imagePreview.value = ev.target.result }
    reader.readAsDataURL(fotoFile.value)
  } else {
    imagePreview.value = null
  }
}

function preprocessImage(img) {
  return tf.tidy(() => {
    return tf.browser
      .fromPixels(img)
      .resizeNearestNeighbor([IMAGE_SIZE, IMAGE_SIZE])
      .toFloat()
      .div(tf.scalar(255))
      .expandDims()
  })
}

async function submitDeteksi() {
  if (!fotoFile.value) {
    error.value = 'Pilih gambar terlebih dahulu'
    return
  }
  
  if (!isModelReady.value || !model.value) {
    error.value = 'Model belum siap, silakan tunggu sebentar'
    return
  }
  
  loading.value = true
  loadingMessage.value = 'Memprediksi penyakit...'
  error.value = ''
  
  try {
    console.log('---[ SUBMIT DETEKSI ]---')
    
    // Double check TensorFlow.js readiness
    if (!tf.getBackend()) {
      throw new Error('TensorFlow.js backend not available')
    }
    
    console.log('Starting prediction...')
    const pred = await predictDisease(fotoFile.value)
    predictionResult.value = pred
    console.log('Prediction result:', pred)
    
    loadingMessage.value = 'Menyimpan hasil ke server...'
    const form = new FormData()
    form.append('foto', fotoFile.value)
    form.append('status', pred.className === 'Sehat' ? 'Sehat' : 'Terdeteksi')
    form.append('nama_penyakit', pred.className)
    
    console.log('Uploading to server...')
    const response = await axios.post(`${apiUrl}/api/deteksi`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    console.log('Server response:', response.data)
    
  } catch (e) {
    console.error('Error in submitDeteksi:', e)
    error.value = typeof e === 'string' ? e : (e?.message || 'Gagal prediksi atau upload')
  } finally {
    loading.value = false
    loadingMessage.value = ''
    console.log('---[ SUBMIT DETEKSI COMPLETED ]---')
  }
}

async function predictDisease(file) {
  return new Promise((resolve, reject) => {
    if (!model.value) {
      reject(new Error('Model belum dimuat'))
      return
    }
    
    console.log('Converting image to tensor...')
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const image = new Image()
      
      image.onload = () => {
        try {
          console.log('Image loaded, processing...')
          
          // Use tf.tidy to manage memory
          const result = tf.tidy(() => {
            const input = preprocessImage(image)
            console.log('Input tensor shape:', input.shape)
            
            const logits = model.value.predict(input)
            console.log('Prediction tensor:', logits.shape)
            
            const scores = Array.from(logits.dataSync())
            console.log('Prediction scores:', scores)
            
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
          
          resolve(result)
          
        } catch (err) {
          console.error('Error during prediction:', err)
          reject(new Error(`Prediksi gagal: ${err.message}`))
        }
      }
      
      image.onerror = () => {
        reject(new Error('Gagal memuat gambar'))
      }
      
      image.src = e.target.result
    }
    
    reader.onerror = () => {
      reject(new Error('Gagal membaca file'))
    }
    
    reader.readAsDataURL(file)
  })
}
</script>

<style scoped>
.scan-card {
  background: #fff;
  max-width: 400px;
  margin: 35px auto;
  padding: 32px 20px;
  border-radius: 16px;
  box-shadow: 0 3px 16px #c0c7d480;
  text-align: center;
}
.btn-green {
  margin-top: 16px;
  background: linear-gradient(90deg, #22b573, #12b37e 80%);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 13px 22px;
  font-size: 1.12rem;
  font-weight: 500;
  box-shadow: 0 2px 12px #b4edd2b0;
  cursor: pointer;
  transition: background 0.18s;
}
.btn-green:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}
.hasil {
  margin-top: 18px;
  background: #f2fff7;
  border-radius: 7px;
  padding: 11px;
  font-size: 1.07rem;
  color: #23653e;
}
</style>