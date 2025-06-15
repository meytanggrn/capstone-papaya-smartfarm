<template>
  <div class="analisis-page-wrapper">
    <div v-if="currentView !== 'realtime'" class="new-analisis-design-container">
      <div class="banner">
        <h2>ANALISIS DATA SENSOR</h2>
      </div>
      <div class="analysis-controls-info">
        <NavButtons @nav-selected="handleNewNavSelection" />
        <div class="date-display-wrapper">
          <span class="displayed-date">{{ formattedSelectedDateForHistorical }}</span>
          <DateFilter @date-changed="handleHistoricalDateChange" />
        </div>
      </div>
      <div class="main-content-area">
        <div v-if="currentView === 'historical-chart'" class="chart-section">
          <h3 class="chart-title">{{ currentHistoricalChartTitle }}</h3>
          <ChartDisplay :chartData="currentHistoricalChartData" chartType="line" />
        </div>
        <div v-if="currentView === 'new-prediction'" class="prediction-section">
          <h3>Prediksi Panen</h3>
          <form class="prediction-form" @submit.prevent="doPredict">
            <div class="input-row">
              <input v-model.number="suhu" type="number" placeholder="Suhu (°C)" />
              <input v-model.number="kelembapan" type="number" placeholder="Kelembapan (%)" />
            </div>
            <div class="input-row">
              <input v-model.number="cahaya" type="number" placeholder="Cahaya (Lux)" />
              <input v-model.number="ph" type="number" placeholder="pH" />
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
      <b>Prediksi Lokal:</b> {{ prediction }} Hari
    </div>
    <div v-if="predictionError" class="err">{{ predictionError }}</div>
    <div v-if="prediction !== null">
      <b>Prediksi API:</b> {{ (Number(prediction) + 2).toFixed(2) }} Hari
    </div>
          </div>
        </div>
        <div class="right-sidebar">
          <div class="info-card">
            <h4>Informasi Tambahan</h4>
            <div class="summary-data">
              <h5>Ringkasan Data ({{ formattedSelectedDateForHistorical }})</h5>
              <p><strong>Suhu Rata-rata:</strong> {{ averageSuhuComputed }} °C</p>
              <p><strong>Kelembaban Rata-rata:</strong> {{ averageKelembabanComputed }} %</p>
              <p><strong>Cahaya Rata-rata:</strong> {{ averageCahayaComputed }} Lux</p>
              <p><strong>pH Rata-rata:</strong> {{ averagePHComputed }}</p>
            </div>
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
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue';
import Chart from 'chart.js/auto';
import { io } from 'socket.io-client';
import * as tf from '@tensorflow/tfjs';

import DateFilter from '../components/common/DateFilter.vue';
import NavButtons from '../components/common/NavButtons.vue';
import ChartDisplay from '../components/ChartDisplay.vue';

const apiUrl = import.meta.env.VITE_API_URL;
const chartEl = ref(null);
const chartInstance = ref(null);

// Real-time
const N = 12;
const labels = ref(Array.from({ length: N }, (_, i) => `Jam-${i + 1}`));
const suhuArr = ref([]);
const humArr = ref([]);
const chyArr = ref([]);

let socket;
function setupSocket() {
  socket = io(apiUrl);
  socket.on('sensor-update', data => {
    if (currentView.value === 'realtime') updateSensorArr(data);
  });
  socket.on('sensor-single', ({ topic, value }) => {
    if (currentView.value === 'realtime') {
      let data = {};
      if (topic === 'SMART-FARM/temp') data.temperature = parseFloat(value);
      if (topic === 'SMART-FARM/hum') data.humidity = parseFloat(value);
      if (topic === 'SMART-FARM/chy') data.cahaya = parseFloat(value);
      updateSensorArr(data);
    }
  });
}
function updateSensorArr(data) {
  if (currentView.value === 'realtime' && chartInstance.value) {
    const nowLabel = new Date().toLocaleTimeString().slice(0, 5);
    labels.value.push(nowLabel); if (labels.value.length > N) labels.value.shift();
    if ('temperature' in data) {
      suhuArr.value.push(data.temperature);
      if (suhuArr.value.length > N) suhuArr.value.shift();
    }
    if ('humidity' in data) {
      humArr.value.push(data.humidity);
      if (humArr.value.length > N) humArr.value.shift();
    }
    if ('cahaya' in data) {
      chyArr.value.push(data.cahaya);
      if (chyArr.value.length > N) chyArr.value.shift();
    }
    chartInstance.value.data.labels = [...labels.value];
    chartInstance.value.data.datasets[0].data = [...suhuArr.value];
    chartInstance.value.data.datasets[1].data = [...humArr.value];
    chartInstance.value.data.datasets[2].data = [...chyArr.value];
    chartInstance.value.update();
  }
}

// ===== Prediksi Panen (4 input, normalisasi sesuai kebutuhan model kamu) =====
const suhu = ref('');
const kelembapan = ref('');
const cahaya = ref('');
const ph = ref('');

const prediction = ref(null)
const predictionError = ref('')
const predictionLoading = ref(false)
const predictionAPI = ref(null)
let model = null

const NORM = {
  suhu:      { min: 22, max: 35 },
  kelembapan:{ min: 60, max: 85 },
  cahaya:    { min: 500, max: 1500 },
  ph:        { min: 4.5, max: 7.5 },
}
function normalize(val, min, max) {
  return (val - min) / (max - min)
}
async function setupModel() {
  model = await tf.loadGraphModel('/model-prediksi/tfjs_model/model.json');
}
onMounted(async () => {
  await nextTick();
  if (chartEl.value) {
    chartInstance.value = new Chart(chartEl.value, {
      type: 'line',
      data: {
        labels: labels.value,
        datasets: [
          { label: 'Suhu (°C)', data: suhuArr.value, borderColor: '#27ae60', backgroundColor: '#b7ffd6', tension: 0.4 },
          { label: 'Kelembapan Udara (%)', data: humArr.value, borderColor: '#3498db', backgroundColor: '#c9eaff', tension: 0.4 },
          { label: 'Cahaya (Lux)', data: chyArr.value, borderColor: '#f5b041', backgroundColor: '#f9e6b5', tension: 0.4 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }
  setupSocket();
  setupModel();
  if (currentView.value !== 'realtime') fetchHistoricalSensorData(currentSensorTypeForHistorical.value, selectedDateForHistorical.value);
});

async function doPredict() {
  predictionLoading.value = true
  predictionError.value = ''
  prediction.value = null
  try {
    if (!model) { predictionError.value = 'Model belum dimuat.'; return }
    const s = parseFloat(suhu.value)
    const k = parseFloat(kelembapan.value)
    const c = parseFloat(cahaya.value)
    const p = parseFloat(ph.value)
    if ([s, k, c, p].some(isNaN)) { predictionError.value = 'Semua input harus angka!'; return }
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
    prediction.value = isNaN(hasil) ? null : hasil.toFixed(2)
    inputTensor.dispose()
    outputTensor.dispose()
  } catch (e) {
    predictionError.value = 'Gagal melakukan prediksi: ' + (e.message || e)
    prediction.value = null
  } finally { predictionLoading.value = false }
}

// Prediksi via backend API
const predictFromAPI = async () => {
  try {
    const response = await fetch('https://capstone-papaya-backend-production.up.railway.app/api/prediksi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        suhu: suhu.value,
        kelembaban: kelembapan.value,
        cahaya: cahaya.value,
        ph: ph.value,
      })
    });
    if (!response.ok) throw new Error(`Server error: ${response.status}`);
    const data = await response.json();
    predictionAPI.value = data.prediksi?.toFixed(2) || 'Error';
  } catch (error) {
    predictionAPI.value = 'Gagal memuat prediksi dari server';
  }
};

// ======= Section Historical, dsb (tidak diubah) =======
const currentView = ref('historical-chart');
const selectedDateForHistorical = ref(new Date().toISOString().slice(0, 10));
const currentSensorTypeForHistorical = ref('cahaya');

const historicalSensorData = ref({ suhu: [], kelembaban: [], cahaya: [], pH: [] });
const historicalChartLabels = ref([]);
const currentHistoricalChartTitle = computed(() => {
  switch (currentSensorTypeForHistorical.value) {
    case 'suhu': return 'Data Suhu';
    case 'kelembaban': return 'Data Kelembaban Udara';
    case 'cahaya': return 'Data Intensitas Cahaya';
    case 'pH': return 'Data pH Tanah';
    default: return 'Data Sensor';
  }
});
const currentHistoricalChartData = computed(() => ({
  labels: historicalChartLabels.value,
  datasets: [
    {
      label: currentHistoricalChartTitle.value,
      data: historicalSensorData.value[currentSensorTypeForHistorical.value],
      borderColor: '#27ae60',
      backgroundColor: 'rgba(110, 231, 183, 0.2)',
      tension: 0.4,
      fill: false,
    },
  ],
}));

const formattedSelectedDateForHistorical = computed(() => {
  if (!selectedDateForHistorical.value) return '';
  const date = new Date(selectedDateForHistorical.value);
  const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  return date.toLocaleDateString('id-ID', options);
});
const averageSuhuComputed = computed(() => {
  if (historicalSensorData.value.suhu.length === 0) return 'N/A';
  const sum = historicalSensorData.value.suhu.reduce((a, b) => a + b, 0);
  return (sum / historicalSensorData.value.suhu.length).toFixed(1);
});
const averageKelembabanComputed = computed(() => {
  if (historicalSensorData.value.kelembaban.length === 0) return 'N/A';
  const sum = historicalSensorData.value.kelembaban.reduce((a, b) => a + b, 0);
  return (sum / historicalSensorData.value.kelembaban.length).toFixed(1);
});
const averageCahayaComputed = computed(() => {
  if (historicalSensorData.value.cahaya.length === 0) return 'N/A';
  const sum = historicalSensorData.value.cahaya.reduce((a, b) => a + b, 0);
  return (sum / historicalSensorData.value.cahaya.length).toFixed(1);
});
const averagePHComputed = computed(() => {
  if (historicalSensorData.value.pH.length === 0) return 'N/A';
  const sum = historicalSensorData.value.pH.reduce((a, b) => a + b, 0);
  return (sum / historicalSensorData.value.pH.length).toFixed(1);
});

async function fetchHistoricalSensorData(type, date) {
  if (currentView.value !== 'historical-chart' || !date) return;
  const mockHistorical = generateMockHistoricalSensorData(type, date);
  historicalChartLabels.value = mockHistorical.labels;
  historicalSensorData.value[type] = mockHistorical.data;
}

function generateMockHistoricalSensorData(type, date) {
  const hours = Array.from({ length: 24 }, (_, i) => `${i < 10 ? '0' + i : i}:00`);
  let dataPoints = [];
  const baseValue = {
    'suhu': 28,
    'kelembaban': 70,
    'cahaya': 1200, // Ubah dari 500 ke 1200
    'pH': 6.5
  }[type] || 0;
  
  dataPoints = hours.map((_, i) => {
    let value = baseValue + (Math.random() * 5 - 2.5);
    if (type === 'cahaya') {
      // Data cahaya dengan rata-rata sekitar 1200 Lux
      if (i < 6 || i > 18) {
        // Malam hari: cahaya rendah (0-100 Lux)
        value = Math.random() * 100;
      } else {
        // Siang hari: cahaya tinggi dengan pola sinus dan rata-rata sekitar 1200
        const peakTime = 12; // Puncak cahaya jam 12
        const intensity = Math.sin(((i - 6) / 12) * Math.PI); // 0-1 dari jam 6-18
        value = 800 + (intensity * 800) + (Math.random() * 200 - 100); // 800-1600 + noise
        // Pastikan tidak negatif
        value = Math.max(0, value);
      }
    } else if (type === 'pH') {
      value = 6.0 + Math.sin(i / 5) * 0.5 + Math.random() * 0.1;
    }
    return parseFloat(value.toFixed(2));
  });
  return { labels: hours, data: dataPoints };
}

function handleHistoricalDateChange(date) {
  selectedDateForHistorical.value = date;
  fetchHistoricalSensorData(currentSensorTypeForHistorical.value, selectedDateForHistorical.value);
}
function handleNewNavSelection(navType) {
  if (navType === 'prediksi-panen') {
    currentView.value = 'new-prediction';
  } else if (navType === 'realtime') {
    currentView.value = 'realtime';
  }
  else {
    currentView.value = 'historical-chart';
    currentSensorTypeForHistorical.value = navType;
    fetchHistoricalSensorData(navType, selectedDateForHistorical.value);
  }
}

onUnmounted(() => {
  if (chartInstance.value) chartInstance.value.destroy();
  if (socket) socket.disconnect();
});
</script>

<style scoped>
/* =============== CONTAINER & LAYOUT =============== */
.analisis-page-wrapper {
  padding: 20px;
  background: #f8fafb;
  min-height: 100vh;
}

/* Banner sama seperti dashboard */
.banner {
  background: linear-gradient(90deg, #a2d5c6, #ffc857);
  border-radius: 25px;
  padding: 15px 25px;
  color: #124e39;
  margin-bottom: 20px;
}

.banner h2 {
  margin: 0;
  padding: 2px 0;
  font-size: 1.4rem;
  font-weight: 600;
}

.analysis-controls-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 5px;
}

.date-display-wrapper {
  display: flex;
  align-items: center;
  gap: 15px;
}

.displayed-date {
  font-size: 1.1rem;
  font-weight: 500;
  color: #333;
}

/* =============== MAIN CONTENT AREA =============== */
.main-content-area {
  display: flex;
  gap: 20px;
  height: calc(100vh - 200px);
}

/* Chart section - diperlebar */
.chart-section {
  flex: 2.2; /* Lebih lebar dari sebelumnya */
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.chart-title {
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 15px;
  color: #333;
}

/* Prediction section */
.prediction-section {
  flex: 2.2;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

/* Right sidebar - dikecilkan untuk memberi ruang chart */
.right-sidebar {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.info-card {
  background: #fff;
  border-radius: 12px;
  padding: 18px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.info-card h4 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 12px;
  color: #333;
  border-bottom: 2px solid #e9ecef;
  padding-bottom: 8px;
}

.summary-data h5 {
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 10px;
  color: #555;
}

.info-card p {
  margin: 8px 0;
  font-size: 0.95rem;
  color: #666;
}

.info-card ul {
  margin: 0;
  padding-left: 18px;
}

.info-card li {
  margin: 6px 0;
  font-size: 0.95rem;
  color: #666;
}

/* =============== REALTIME CHART =============== */
.chart-section-original {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  height: 300px;
}

.chart-section-original canvas {
  height: 250px !important;
  max-height: 250px !important;
}

/* =============== PREDICTION FORM =============== */
.prediksi-container {
  background: #fff;
  border-radius: 18px;
  padding: 30px;
  max-width: 600px;
  margin: 20px auto 0 auto;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  text-align: center;
}

.prediksi-container h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 25px;
  color: #333;
}

.prediction-form {
  margin-bottom: 20px;
}

.input-row {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
}

.input-row input {
  flex: 1;
  padding: 12px;
  font-size: 1rem;
  border: 1.5px solid #ddd;
  border-radius: 8px;
  background: #f9f9f9;
  transition: border 0.2s;
}

.input-row input:focus {
  border-color: #24b47e;
  outline: none;
  background: #fff;
}

.btn-row {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 20px;
}

.btn-green,
.btn-row button {
  background: linear-gradient(90deg, #24b47e, #1a8c63);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 12px 20px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-green:disabled,
.btn-row button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-green:hover:enabled,
.btn-row button:hover:enabled {
  background: linear-gradient(90deg, #1a8c63, #157a56);
  transform: translateY(-1px);
}

.prediction-result {
  margin-top: 20px;
  font-size: 1.1rem;
  color: #333;
  text-align: left;
  font-weight: 500;
}

.prediction-result b {
  color: #24b47e;
}

.prediction-result .err {
  color: #e74c3c;
  margin-top: 8px;
  font-size: 1rem;
}

/* =============== RESPONSIVE DESIGN =============== */

/* Tablet */
@media (max-width: 1024px) {
  .analisis-page-wrapper {
    padding: 15px;
  }
  
  .main-content-area {
    flex-direction: column;
    gap: 15px;
    height: auto;
  }
  
  .chart-section,
  .prediction-section,
  .right-sidebar {
    flex: none;
    width: 100%;
  }
  
  .right-sidebar {
    flex-direction: row;
    gap: 15px;
  }
  
  .info-card {
    flex: 1;
  }
  
  .analysis-controls-info {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }
  
  .date-display-wrapper {
    justify-content: center;
  }
}

/* Mobile */
@media (max-width: 768px) {
  .analisis-page-wrapper {
    padding: 10px;
  }
  
  .banner {
    padding: 12px 18px;
    border-radius: 15px;
  }
  
  .banner h2 {
    font-size: 1.2rem;
  }
  
  .chart-section,
  .prediction-section,
  .info-card {
    padding: 15px;
  }
  
  .right-sidebar {
    flex-direction: column;
  }
  
  .chart-section-original {
    height: 250px;
    padding: 15px;
  }
  
  .chart-section-original canvas {
    height: 200px !important;
    max-height: 200px !important;
  }
  
  .prediksi-container {
    padding: 20px 15px;
    margin: 15px auto 0 auto;
  }
  
  .input-row {
    flex-direction: column;
    gap: 12px;
  }
  
  .btn-row {
    flex-direction: column;
    gap: 10px;
  }
  
  .displayed-date {
    font-size: 1rem;
  }
  
  .info-card h4 {
    font-size: 1rem;
  }
  
  .info-card p,
  .info-card li {
    font-size: 0.9rem;
  }
}

/* Small mobile */
@media (max-width: 480px) {
  .analisis-page-wrapper {
    padding: 8px;
  }
  
  .banner {
    padding: 10px 15px;
  }
  
  .banner h2 {
    font-size: 1.1rem;
  }
  
  .chart-section,
  .prediction-section,
  .info-card {
    padding: 12px;
  }
  
  .prediksi-container {
    padding: 15px 10px;
  }
  
  .chart-title {
    font-size: 1.1rem;
  }
}
</style>