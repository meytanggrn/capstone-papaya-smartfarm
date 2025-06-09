<template>
  <div class="analisis-layout">
    <h2>Analisis Sensor & Prediksi Panen</h2>
    <!-- Chart Sensor -->
    <div class="chart-section">
      <canvas ref="chartEl"></canvas>
    </div>
    <!-- Prediksi Panen -->
    <div class="prediction-section">
      <h3>Prediksi Panen</h3>
      <form @submit.prevent="doPredict">
        <input v-model.number="inputValue" type="number" placeholder="Masukkan nilai suhu rata-rata" />
        <button type="submit">Prediksi (Local TFJS)</button>
      </form>
      <form @submit.prevent="doPredictAPI" style="margin-top:12px;">
        <input v-model.number="inputValue" type="number" placeholder="Masukkan nilai suhu rata-rata" />
        <button type="submit">Prediksi via Backend API</button>
      </form>
      <div v-if="prediction !== null"><b>Prediksi Lokal:</b> {{ prediction }} kg</div>
      <div v-if="predictionAPI !== null"><b>Prediksi API:</b> {{ predictionAPI }} kg</div>
    </div>
  </div>
</template>


<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import Chart from 'chart.js/auto'
import { io } from 'socket.io-client'
import * as tf from '@tensorflow/tfjs'
import axios from 'axios'

const apiUrl = 'http://localhost:5000'
const chartEl = ref(null)
const chartInstance = ref(null)

// Inisialisasi data dummy 12 jam (atau ubah sesuai kebutuhan)
const N = 12
const labels = ref(Array.from({length: N}, (_,i) => `Jam-${i+1}`))
const suhuArr = ref([])
const humArr  = ref([])
const chyArr  = ref([])

// Untuk prediksi
const inputValue = ref(30)
const prediction = ref(null)
const predictionAPI = ref(null)

// ===== CHART.JS =====
onMounted(() => {
  chartInstance.value = new Chart(chartEl.value, {
    type: 'line',
    data: {
      labels: labels.value,
      datasets: [
        {
          label: 'Suhu (°C)',
          data: suhuArr.value,
          borderColor: '#27ae60',
          backgroundColor: '#b7ffd6',
          tension: 0.4
        },
        {
          label: 'Kelembapan Udara (%)',
          data: humArr.value,
          borderColor: '#3498db',
          backgroundColor: '#c9eaff',
          tension: 0.4
        },
        {
          label: 'Cahaya (Lux)',
          data: chyArr.value,
          borderColor: '#f5b041',
          backgroundColor: '#f9e6b5',
          tension: 0.4
        }
      ]
    },
    options: { responsive: true }
  })
  setupSocket()
  setupModel()
})

onUnmounted(() => {
  if (chartInstance.value) chartInstance.value.destroy()
  if (socket) socket.disconnect()
})

// ====== SOCKET.IO (MQTT relay dari backend) =====
let socket
function setupSocket() {
  socket = io(apiUrl)
  // Hanya update array, geser data jika sudah N data
  socket.on('sensor-update', data => {
    updateSensorArr(data)
  })
  socket.on('sensor-single', ({ topic, value }) => {
    console.log('MQTT update:', topic, value)
    let data = {}
    if (topic === 'SMART-FARM/temp') data.temperature = parseFloat(value)
    if (topic === 'SMART-FARM/hum') data.humidity = parseFloat(value)
    if (topic === 'SMART-FARM/chy') data.cahaya = parseFloat(value)
    updateSensorArr(data)
  })
}
function updateSensorArr(data) {
  const nowLabel = new Date().toLocaleTimeString().slice(0,5)
  labels.value.push(nowLabel)
  if (labels.value.length > N) labels.value.shift()

  if ('temperature' in data) {
    suhuArr.value.push(data.temperature)
    if (suhuArr.value.length > N) suhuArr.value.shift()
  }
  if ('humidity' in data) {
    humArr.value.push(data.humidity)
    if (humArr.value.length > N) humArr.value.shift()
  }
  if ('cahaya' in data) {
    chyArr.value.push(data.cahaya)
    if (chyArr.value.length > N) chyArr.value.shift()
  }
  chartInstance.value.data.labels = labels.value
  chartInstance.value.update()
}


// ====== TFJS LOCAL REGRESSION MODEL =====
let model = null
async function setupModel() {
  model = tf.sequential()
  model.add(tf.layers.dense({inputShape: [1], units: 1}))
  model.compile({optimizer: 'sgd', loss: 'meanSquaredError'})
  const xs = tf.tensor1d([28,29,30,31,32])
  const ys = tf.tensor1d([52, 54, 55, 57, 58])
  await model.fit(xs, ys, {epochs: 120})
}

async function doPredict() {
  if (!model) return
  const input = tf.tensor2d([inputValue.value], [1, 1])
  const output = await model.predict(input).data()
  prediction.value = output[0].toFixed(2)
}

// ====== BACKEND API PREDIKSI =====
async function doPredictAPI() {
  try {
    const res = await axios.post(`${apiUrl}/api/predict`, {
      suhu: inputValue.value
    })
    predictionAPI.value = res.data.result // pastikan sesuai response backend
  } catch (e) {
    predictionAPI.value = 'Gagal'
  }
}
</script>


<style scoped>
.analisis-layout { max-width: 950px; margin: 0 auto; padding: 32px 0;}
.chart-section { background: #fff; border-radius: 14px; padding: 26px; margin-bottom: 30px; }
.prediction-section { background: #f8fafb; border-radius: 14px; padding: 18px 14px; margin-top:18px;}
</style>
