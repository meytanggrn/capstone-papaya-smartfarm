<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import * as tf from '@tensorflow/tfjs' // Import TensorFlow.js

const apiUrl = 'http://localhost:5000'
const router = useRouter()
const fotoFile = ref(null)
const error = ref('')
const loading = ref(false)
const loadingMessage = ref('Mengupload...')
const model = ref(null) 
const imagePreview = ref(null) 
const predictionResult = ref(null) 
const backendInitialized = ref(false) 
const debugMode = ref(true)

const IMAGE_SIZE = 256 

onMounted(async () => {
  loadingMessage.value = 'Memuat model AI...'
  loading.value = true
  try {

    await tf.ready() 
    tf.setBackend('cpu') 
    console.log(`TFJS backend: ${tf.getBackend()}`)
    backendInitialized.value = true 
    if (debugMode.value) console.log('Backend berhasil diinisialisasi')

    model.value = await tf.loadLayersModel('/model/tfjs_model/model.json')
    console.log('Model TF.js berhasil dimuat!')
    if (debugMode.value) console.log('Model berhasil dimuat')
    loading.value = false 
  } catch (e) {
    loading.value = false
    error.value = 'Gagal memuat model AI. Periksa koneksi atau path model.' 
    console.error('Error memuat model TF.js:', e)
  }
})

const onFileChange = e => {
  fotoFile.value = e.target.files[0]
  if (fotoFile.value) {
    const reader = new FileReader()
    reader.onload = event => {
      imagePreview.value = event.target.result
    }
    reader.readAsDataURL(fotoFile.value)
  } else {
    imagePreview.value = null
  }
  predictionResult.value = null 
}

function preprocessImage(image) {
  if (debugMode.value) console.log('Memproses gambar...')
  const tensor = tf.browser.fromPixels(image)
    .resizeNearestNeighbor([IMAGE_SIZE, IMAGE_SIZE]) 
    .toFloat()
    .div(tf.scalar(255.0)) 
    .expandDims() 
  if (debugMode.value) console.log('Gambar berhasil diproses')
  return tensor
}

const predictDisease = async imageFile => {
  if (debugMode.value) console.log('Memulai prediksi...')
  if (!backendInitialized.value) {
    error.value = 'Backend TF.js belum siap. Coba lagi nanti.'
    if (debugMode.value) console.log('Backend belum diinisialisasi')
    return null
  }

  if (!model.value) {
    error.value = 'Model AI belum dimuat.'
    if (debugMode.value) console.log('Model belum dimuat')
    return null
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async event => {
      try {
        const image = new Image()
        image.onload = async () => {
          try {
            const processedImage = preprocessImage(image)
            if (debugMode.value) {
              console.log('Gambar telah diproses')
              console.log('Bentuk gambar yang diproses:', processedImage.shape)
              console.log('Tipe data gambar yang diproses:', processedImage.dtype)
            }
            if (!model.value) {
              reject('Model belum dimuat.') 
              if (debugMode.value) console.log('Model tidak tersedia saat prediksi')
              return
            }
            if (debugMode.value) console.log('Memanggil model.predict...')
            const predictions = model.value.predict(processedImage)
            if (debugMode.value) {
              console.log('Prediksi berhasil dilakukan')
              console.log('Hasil prediksi:', predictions)
              console.log('Bentuk prediksi:', predictions.shape)
              console.log('Tipe data prediksi:', predictions.dtype)
            }

            const classNames = [
              'Bercak Daun',
              'Hawar Daun',
              'Karat Daun',
              'Busuk Batang',
              'Sehat'
            ]

            const topPrediction = Array.from(predictions.dataSync())
              .map((probability, index) => ({
                probability,
                className: classNames[index]
              }))
              .reduce((prev, current) =>
                prev.probability > current.probability ? prev : current
              )
            if (debugMode.value) console.log('Prediksi teratas:', topPrediction)

            processedImage.dispose() 
            predictions.dispose()
            resolve(topPrediction)
          } catch (predictError) {
            console.error('Error during prediction:', predictError)
            reject('Gagal melakukan prediksi.')
            if (debugMode.value) console.log('Terjadi kesalahan selama prediksi')
          }
        }
        image.onerror = imageError => {
          console.error('Error loading image:', imageError)
          reject('Gagal memuat gambar.')
          if (debugMode.value) console.log('Gagal memuat gambar')
        }
        image.src = event.target.result
      } catch (readError) {
        console.error('Error reading file:', readError)
        reject('Gagal membaca file.')
        if (debugMode.value) console.log('Gagal membaca file')
      }
    }
    reader.onerror = readerError => {
      console.error('Error FileReader:', readerError)
      reject('Gagal membaca file.')
      if (debugMode.value) console.log('FileReader mengalami kesalahan')
    }
    reader.readAsDataURL(imageFile)
  })
}

const submitDeteksi = async () => {
  if (!fotoFile.value) {
    error.value = 'Pilih gambar terlebih dahulu.'
    return
  }
  if (!model.value) {
    error.value = 'Model AI belum dimuat. Mohon tunggu atau periksa konsol.'
    return
  }

  error.value = ''
  loading.value = true
  loadingMessage.value = 'Menganalisis gambar...'

  try {
    const prediction = await predictDisease(fotoFile.value)
    predictionResult.value = prediction
    console.log('Hasil Prediksi:', prediction)

    loadingMessage.value = 'Mengupload data...'
    const formData = new FormData()
    formData.append('foto', fotoFile.value)
    formData.append(
      'status',
      prediction.className === 'Sehat' ? 'Sehat' : 'Terdeteksi'
    ) 
    formData.append('nama_penyakit', prediction.className) 

    const { data } = await axios.post(`${apiUrl}/api/deteksi`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    setTimeout(() => {
      loading.value = false
      router.replace({ path: '/deteksi/detail', query: { id: data.id } })
    }, 400)
  } catch (e) {
    loading.value = false
    error.value = e || 'Gagal melakukan deteksi atau upload.' 
    console.error('Error saat deteksi atau upload:', e)
  }
}
</script>

<template>
  <div>
    <h1>Deteksi Penyakit Tanaman</h1>

    <input type="file" accept="image/*" @change="onFileChange" />
    <img
      v-if="imagePreview"
      :src="imagePreview"
      alt="Preview"
      style="max-width: 200px;"
    />

    <button @click="submitDeteksi" :disabled="loading">
      {{ loading ? loadingMessage : 'Deteksi' }}
    </button>

    <div v-if="predictionResult">
      <h2>Hasil Prediksi:</h2>
      <p>Penyakit: {{ predictionResult.className }}</p>
      <p>Probabilitas: {{ predictionResult.probability }}</p>
    </div>

    <div v-if="error" style="color: red;">{{ error }}</div>
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
  background-color: #4CAF50; /* Example green color */
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