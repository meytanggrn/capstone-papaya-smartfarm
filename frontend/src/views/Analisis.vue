<template>
  <div class="analisis-page-wrapper">
    <!-- Header -->
    <div class="analysis-header-banner">
      ANALISIS DATA SENSOR
    </div>
    <!-- Nav & Tanggal -->
    <div class="analysis-controls-info">
      <div class="nav-buttons">
        <button
          v-for="nav in navOptions"
          :key="nav.value"
          :class="['nav-btn', { active: currentView === nav.value }]"
          @click="handleNewNavSelection(nav.value)"
        >
          {{ nav.label }}
        </button>
      </div>
      <div class="date-display-wrapper">
        <span class="displayed-date">{{ formattedSelectedDateForHistorical }}</span>
        <input type="date" :value="selectedDateForHistorical" @input="handleHistoricalDateChange($event.target.value)" />
      </div>
    </div>
    <!-- Main Area -->
    <div class="main-content-area">
      <!-- Kiri: Chart atau Prediksi Panen -->
      <div v-if="currentView !== 'prediksi-panen'" class="chart-section">
        <h2 class="chart-title">{{ currentHistoricalChartTitle }}</h2>
        <div class="chart-canvas-wrapper">
          <canvas ref="chartEl" height="260"></canvas>
        </div>
      </div>
      <div v-else class="prediction-section">
        <h2 class="chart-title">Prediksi Panen</h2>
        <form class="prediction-form" @submit.prevent="doPredict">
          <div class="input-row">
            <input v-model.number="suhu" type="number" placeholder="Suhu (°C)" required />
            <input v-model.number="kelembapan" type="number" placeholder="Kelembapan (%)" required />
          </div>
          <div class="input-row">
            <input v-model.number="cahaya" type="number" placeholder="Cahaya (Lux)" required />
            <input v-model.number="ph" type="number" placeholder="pH" required />
          </div>
          <div class="btn-row">
            <button type="submit" :disabled="predictionLoading">
              {{ predictionLoading ? 'Memproses...' : 'Prediksi (Local TFJS)' }}
            </button>
            <button type="button" @click="predictFromAPI" :disabled="predictionLoading">
              Prediksi via Backend API
            </button>
          </div>
        </form>
        <div class="prediction-result">
          <div v-if="prediction !== null">
            <b>Prediksi Lokal:</b> {{ prediction }} kg
          </div>
          <div v-if="predictionError" class="err">{{ predictionError }}</div>
          <div v-if="predictionAPI !== null"><b>Prediksi API:</b> {{ predictionAPI }} kg</div>
        </div>
      </div>
      <!-- Kanan: Ringkasan -->
      <div class="right-sidebar-placeholder">
        <h3>INFORMASI TAMBAHAN</h3>
        <div class="info-card">
          <h4>Ringkasan Data ({{ formattedSelectedDateForHistorical }})</h4>
          <p><b>Suhu Rata-rata:</b> {{ averageSuhuComputed }} °C</p>
          <p><b>Kelembaban Rata-rata:</b> {{ averageKelembabanComputed }} %</p>
          <p><b>Cahaya Rata-rata:</b> {{ averageCahayaComputed }} Lux</p>
          <p><b>pH Rata-rata:</b> {{ averagePHComputed }}</p>
        </div>
        <div class="info-card">
          <h4>Kondisi Optimal Pepaya</h4>
          <ul>
            <li>Suhu: 25 - 30 °C</li>
            <li>Kelembaban: 60 - 80 %</li>
            <li>Cahaya: 500 - 1500 Lux</li>
            <li>pH Tanah: 6.0 - 7.0</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import * as tf from '@tensorflow/tfjs'
import Chart from 'chart.js/auto'

// -- Navigation State --
const navOptions = [
  { value: 'cahaya', label: 'Intensitas Cahaya' },
  { value: 'suhu', label: 'Suhu' },
  { value: 'kelembaban', label: 'Kelembaban Udara' },
  { value: 'ph', label: 'pH Tanah' },
  { value: 'prediksi-panen', label: 'Prediksi Panen' }
]
const currentView = ref('cahaya')

// -- Date Picker --
const today = new Date().toISOString().slice(0, 10)
const selectedDateForHistorical = ref(today)

// -- Chart Mock Data (update sesuai API kalau sudah ada) --
const chartEl = ref(null)
const chartInstance = ref(null)
const historicalSensorData = ref({
  suhu: [],
  kelembaban: [],
  cahaya: [],
  ph: [],
})
const historicalChartLabels = ref([])

function generateMockHistoricalSensorData(type) {
  const hours = Array.from({ length: 24 }, (_, i) => `${i < 10 ? '0'+i : i}:00`)
  let baseValue = { suhu: 28, kelembaban: 70, cahaya: 500, ph: 6.5 }[type] || 0
  let dataPoints = hours.map((_, i) => {
    if (type === 'cahaya') {
      return i < 6 || i > 18
        ? (baseValue * 0.1) + (Math.random() * 20)
        : baseValue + (Math.sin(i/3)*200) + (Math.random()*100)
    } else if (type === 'ph') {
      return 6.0 + Math.sin(i/5)*0.5 + Math.random()*0.1
    } else {
      return baseValue + (Math.random() * 5 - 2.5)
    }
  })
  return { labels: hours, data: dataPoints.map(v => +v.toFixed(2)) }
}

function loadChartData() {
  if (currentView.value === 'prediksi-panen') return
  const type = currentView.value
  const mock = generateMockHistoricalSensorData(type)
  historicalSensorData.value[type] = mock.data
  historicalChartLabels.value = mock.labels

  if (chartInstance.value) chartInstance.value.destroy()
  chartInstance.value = new Chart(chartEl.value, {
    type: 'line',
    data: {
      labels: historicalChartLabels.value,
      datasets: [{
        label: navOptions.find(n => n.value === type)?.label || 'Data',
        data: historicalSensorData.value[type],
        borderColor: '#27ae60',
        backgroundColor: '#b7ffd6',
        tension: 0.4,
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  })
}

// -- Chart Title --
const currentHistoricalChartTitle = computed(() =>
  ({
    cahaya: 'Data Intensitas Cahaya',
    suhu: 'Data Suhu',
    kelembaban: 'Data Kelembaban Udara',
    ph: 'Data pH Tanah',
    ['prediksi-panen']: ''
  })[currentView.value] || 'Data Sensor'
)

// -- Date Format --
const formattedSelectedDateForHistorical = computed(() => {
  const d = new Date(selectedDateForHistorical.value)
  return d.toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
})

// -- Averages
const averageSuhuComputed = computed(() => avgArr(historicalSensorData.value.suhu))
const averageKelembabanComputed = computed(() => avgArr(historicalSensorData.value.kelembaban))
const averageCahayaComputed = computed(() => avgArr(historicalSensorData.value.cahaya))
const averagePHComputed = computed(() => avgArr(historicalSensorData.value.ph))
function avgArr(arr) {
  if (!arr.length) return 'N/A'
  const s = arr.reduce((a, b) => a + b, 0)
  return (s/arr.length).toFixed(1)
}

// -- Handle Tab & Date Switch --
function handleNewNavSelection(type) {
  currentView.value = type
  if (type !== 'prediksi-panen') {
    setTimeout(loadChartData, 10)
  }
}
function handleHistoricalDateChange(val) {
  selectedDateForHistorical.value = val
  if (currentView.value !== 'prediksi-panen') loadChartData()
}
onMounted(() => loadChartData())
watch(currentView, val => { if (val !== 'prediksi-panen') loadChartData() })

// -------------------------
// ----- Prediksi Panen ----
// -------------------------
const suhu = ref('')
const kelembapan = ref('')
const cahaya = ref('')
const ph = ref('')

const prediction = ref(null)
const predictionAPI = ref(null)
const predictionError = ref('')
const predictionLoading = ref(false)
let model = null

async function setupModel() {
  model = await tf.loadGraphModel('/model-prediksi/tfjs_model/model.json')
}
onMounted(setupModel)

function normalize(val, min, max) {
  return (val - min) / (max - min)
}
const NORM = {
  suhu: { min: 22, max: 35 },
  kelembapan: { min: 60, max: 85 },
  cahaya: { min: 500, max: 1500 },
  ph: { min: 4.5, max: 7.5 }
}
async function doPredict() {
  predictionLoading.value = true
  predictionError.value = ''
  prediction.value = null
  try {
    if (!model) throw new Error('Model belum dimuat. Silakan tunggu sebentar.')
    const s = parseFloat(suhu.value)
    const k = parseFloat(kelembapan.value)
    const c = parseFloat(cahaya.value)
    const p = parseFloat(ph.value)
    if ([s, k, c, p].some(isNaN)) throw new Error('Semua input harus angka!')
    const vals = [
      normalize(s, NORM.suhu.min, NORM.suhu.max),
      normalize(k, NORM.kelembapan.min, NORM.kelembapan.max),
      normalize(c, NORM.cahaya.min, NORM.cahaya.max),
      normalize(p, NORM.ph.min, NORM.ph.max)
    ]
    const inputTensor = tf.tensor2d([vals], [1, 4])
    const outputTensor = model.predict(inputTensor)
    const outputArray = await outputTensor.data()
    prediction.value = outputArray[0]?.toFixed(2)
    inputTensor.dispose()
    outputTensor.dispose()
  } catch (e) {
    predictionError.value = e.message || e
  } finally {
    predictionLoading.value = false
  }
}
const predictFromAPI = async () => {
  predictionAPI.value = null
  try {
    const response = await fetch('http://localhost:5000/api/prediksi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        suhu: Number(suhu.value),
        kelembaban: Number(kelembapan.value),
        cahaya: Number(cahaya.value),
        ph: Number(ph.value)
      })
    })
    if (!response.ok) throw new Error(`Server error: ${response.status}`)
    const data = await response.json()
    predictionAPI.value = data.prediksi?.toFixed(2) || 'Error'
  } catch (error) {
    predictionAPI.value = 'Gagal memuat prediksi dari server'
  }
}
</script>

<style scoped>
.analisis-page-wrapper {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}
.analysis-header-banner {
  background: linear-gradient(to right, #6EE7B7, #10B981);
  color: white;
  padding: 20px;
  text-align: center;
  font-size: 2.2rem;
  font-weight: bold;
  border-radius: 10px;
  margin-bottom: 25px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}
.analysis-controls-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 25px;
  background-color: #fff;
  padding: 15px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.main-content-area {
  display: flex;
  gap: 25px;
  flex-wrap: wrap;
}
.chart-section, .prediction-section {
  flex: 3;
  min-width: 340px;
  background: #fff;
  border-radius: 14px;
  padding: 35px 28px 25px 28px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  margin-bottom: 16px;
  min-height: 420px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
}
.chart-title, .prediction-section .chart-title {
  text-align: center;
  margin-bottom: 22px;
  font-size: 2rem;
  font-weight: bold;
  color: #113;
}
.chart-canvas-wrapper {
  width: 100%;
  max-width: 720px;
  height: 260px;
  min-height: 180px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  /* Batas tinggi di sini! */
}
.chart-canvas-wrapper canvas {
  width: 100% !important;
  height: 100% !important;
  max-width: 700px;
  max-height: 340px;
  display: block;
  background: #fff;
  border-radius: 10px;
}

/* ------- Prediction Form ------- */
.prediction-form .input-row {
  display: flex;
  gap: 16px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}
.prediction-form input[type="number"] {
  flex: 1;
  padding: 9px 8px;
  border-radius: 8px;
  border: 1px solid #ddd;
  font-size: 1rem;
  background: #fafbfc;
  min-width: 80px;
}
.prediction-form .btn-row {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}
.prediction-form button {
  flex: 1;
  padding: 9px 0;
  background: #10B981;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: background .15s;
  min-width: 120px;
}
.prediction-form button:disabled {
  background: #b8e1d1;
  cursor: not-allowed;
}
.prediction-result {
  margin-top: 18px;
  font-size: 1.13rem;
}
.prediction-result .err {
  color: #f44;
  font-weight: bold;
}

/* ------ Right Sidebar ------ */
.right-sidebar-placeholder {
  background-color: #f8f8f8;
  padding: 15px;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.08);
  flex-basis: 320px;
  flex-grow: 0;
  flex-shrink: 0;
  min-width: 250px;
  max-width: 350px;
  margin-bottom: 16px;
}
.right-sidebar-placeholder h3 {
  color: #333333;
  font-size: 1.3rem;
  text-align: center;
  margin-bottom: 8px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: -1px;
}
.info-card {
  background-color: #ffffff;
  padding: 15px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  margin-bottom: 8px;
  border: 1px solid #e0e0e0;
}
.info-card:last-child { margin-bottom: 0; }
.info-card h4 {
  margin-top: 0;
  color: #333;
  font-size: 1.2rem;
  margin-bottom: 12px;
  border-bottom: 1px solid #eee;
  padding-bottom: 5px;
}
.info-card ul {
  list-style: none;
  padding-left: 0;
  font-size: 1rem;
  color: #444;
  line-height: 1.6;
  margin-bottom: 8px;
}
.info-card ul li { margin-bottom: 5px; }

/* ------ Responsive ------ */
@media (max-width: 1000px) {
  .main-content-area { flex-direction: column; }
  .right-sidebar-placeholder, .chart-section, .prediction-section {
    min-width: unset;
    width: 100%;
    margin-bottom: 16px;
    max-width: unset;
  }
  .chart-canvas-wrapper {
    max-width: 100%;
    height: 210px;
  }
}
@media (max-width: 650px) {
  .analysis-controls-info { flex-direction: column; align-items: stretch; }
  .analysis-header-banner { font-size: 1.1rem; }
  .chart-section, .prediction-section { padding: 15px 3px; }
  .chart-title { font-size: 1.1rem; }
  .chart-canvas-wrapper {
    height: 140px;
    min-height: 110px;
  }
}

</style>
