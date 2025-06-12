<template>
  <div class="analisis-page-wrapper">
    <!-- ===== Realtime (CHART & Prediksi Panen Input Baru) ===== -->
    <div v-if="currentView === 'realtime'" class="original-analisis-content">
      <h2>Analisis Sensor & Prediksi Panen (Real-time)</h2>
      <div class="chart-section-original">
        <canvas ref="chartEl" height="260"></canvas>
      </div>
      <div class="prediksi-container">
        <h2>Prediksi Panen Berdasarkan Data Sensor</h2>
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
            <button class="btn-green" type="submit" :disabled="predictionLoading">
              {{ predictionLoading ? 'Memproses...' : 'Prediksi (Local TFJS)' }}
            </button>
            <button class="btn-green" type="button" @click="predictFromAPI" :disabled="predictionLoading">
              Prediksi via Backend API
            </button>
          </div>

        </form>
        <div class="prediction-result">
          <div v-if="prediction !== null"><b>Prediksi Lokal:</b> {{ prediction }} Hari</div>
          <div v-if="predictionError" class="err">{{ predictionError }}</div>
          <div><b>Prediksi API:</b> {{ predictionAPI }} Hari</div>
        </div>
      </div>
    </div>

    <!-- ===== Historical & Info ===== -->
    <div v-if="currentView !== 'realtime'" class="new-analisis-design-container">
      <div class="analysis-header-banner">
        ANALISIS DATA SENSOR
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
            <div v-if="prediction !== null"><b>Prediksi Lokal:</b> {{ prediction }} kg</div>
            <div v-if="predictionError" class="err">{{ predictionError }}</div>
            <div><b>Prediksi API:</b> {{ predictionAPI }} kg</div>
          </div>
        </div>
        <div class="right-sidebar-placeholder">
          <h3>Informasi Tambahan</h3>
          <div class="info-card">
            <h4>Ringkasan Data ({{ formattedSelectedDateForHistorical }})</h4>
            <p><strong>Suhu Rata-rata:</strong> {{ averageSuhuComputed }} °C</p>
            <p><strong>Kelembaban Rata-rata:</strong> {{ averageKelembabanComputed }} %</p>
            <p><strong>Cahaya Rata-rata:</strong> {{ averageCahayaComputed }} Lux</p>
            <p><strong>pH Rata-rata:</strong> {{ averagePHComputed }}</p>
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

const apiUrl = 'http://localhost:5000';
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
    const response = await fetch('http://localhost:5000/api/prediksi', {
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
    'cahaya': 500,
    'pH': 6.5
  }[type] || 0;
  dataPoints = hours.map((_, i) => {
    let value = baseValue + (Math.random() * 5 - 2.5);
    if (type === 'cahaya') {
      if (i < 6 || i > 18) value = (baseValue * 0.1) + (Math.random() * 20);
      else value = baseValue + (Math.sin(i / 3) * 200) + (Math.random() * 100);
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
/* =============== DESKTOP =============== */

.analisis-page-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}
.main-content-area {
  display: flex;
  gap: 24px;
}
.chart-section,
.prediction-section,
.right-sidebar-placeholder,
.chart-section-original,
.prediction-section-original {
  background: #fff;
  border-radius: 12px;
  padding: 22px 18px;
  margin-bottom: 22px;
}
.chart-section-original {
  min-height: 180px;
  max-height: 220px;
  padding: 18px 10px;
}
.chart-section-original canvas {
  height: 130px !important;
  max-height: 130px !important;
}
.analysis-header-banner {
  font-size: 1.35rem;
  padding: 22px 16px;
  background: #f2f8fb;
  border-radius: 10px;
  font-weight: 600;
  margin-bottom: 18px;
}
.displayed-date{

  font-size: 20px;
  font-weight: 500;
}

.prediksi-container {
  background: #fff;
  border-radius: 18px;
  padding: 36px 28px 30px 28px;
  max-width: 500px;
  margin: 40px auto 0 auto;
  box-shadow: 0 4px 18px rgba(110, 168, 191, 0.13), 0 1.5px 5px #b5c4d8;
  text-align: center;
}
.prediksi-container h2 {
  font-size: 1.6rem;
  font-weight: bold;
  margin-bottom: 26px;
  color: #18394e;
  letter-spacing: 0.01em;
}
.prediction-form {
  margin-bottom: 18px;
}
.input-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}
.input-row input {
  flex: 1;
  padding: 12px;
  font-size: 1.07rem;
  border: 1.5px solid #c7e0dd;
  border-radius: 8px;
  background: #f9fcff;
  transition: border 0.2s;
}
.input-row input:focus {
  border-color: #00c98d;
  outline: none;
}
.btn-row {
  display: flex;
  gap: 18px;
  justify-content: center;
  margin-top: 6px;
}
.btn-green {
  background: linear-gradient(90deg, #22b573, #12b37e 80%);
  color: #fff;
  border: none;
  border-radius: 9px;
  padding: 13px 22px;
  font-size: 1.15rem;
  font-weight: 500;
  box-shadow: 0 2px 12px #b4edd2b0;
  cursor: pointer;
  transition: background 0.18s, box-shadow 0.18s;
}
.btn-green:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-green:hover:enabled {
  background: linear-gradient(90deg, #10a96c, #10b65e 80%);
  box-shadow: 0 3px 17px #b4edd2e0;
}
.prediction-result {
  margin-top: 20px;
  font-size: 1.18rem;
  color: #193c55;
  text-align: left;
  font-weight: 500;
}
.prediction-result b {
  color: #214e34;
}
.prediction-result .err {
  color: #f43f5e;
  margin-top: 8px;
  font-size: 1.05rem;
}

/* Desktop-to-tablet */
@media (max-width: 1200px) {
  .analisis-page-wrapper { max-width: 1000px; }
}
@media (max-width: 1024px) {
  .analisis-page-wrapper { padding: 10px; max-width: 100vw; }
  .main-content-area { flex-direction: column; gap: 0; }
  .chart-section,
  .prediction-section,
  .right-sidebar-placeholder,
  .chart-section-original,
  .prediction-section-original {
    width: 100%;
    min-width: unset;
    margin-bottom: 18px;
    max-height: unset;
  }
  .chart-section-original {
    padding: 12px 6px;
    min-height: 140px;
    max-height: 180px;
  }
  .chart-section-original canvas {
    height: 90px !important;
    max-height: 90px !important;
  }
  .analysis-header-banner { font-size: 1.2rem; padding: 18px 7px; }
  .analysis-controls-info {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    margin-bottom: 18px;
    padding: 10px;
  }
}

/* Tablet-to-mobile */
@media (max-width: 900px) {
  .main-content-area { flex-direction: column; gap: 12px; }
  .chart-section, .prediction-section, .right-sidebar-placeholder {
    width: 100%;
    min-width: unset;
    margin-bottom: 16px;
    padding: 18px 8px;
  }
  .analysis-controls-info { flex-direction: column; align-items: stretch; gap: 14px; }
}

/* Tablet portrait */
@media (max-width: 700px) {
  .analisis-page-wrapper { padding: 4px; }
  .analysis-header-banner { font-size: 1.15rem; padding: 12px; margin-bottom: 12px; }
  .chart-section,
  .prediction-section,
  .right-sidebar-placeholder {
    padding: 10px 3px;
    border-radius: 7px;
    min-height: unset;
  }
  .info-card h4 { font-size: 1rem; margin-bottom: 7px; padding-bottom: 2px; }
  .info-card { padding: 10px; }
  /* Prediksi container style */
  .prediksi-container {
    padding: 20px 8px 16px 8px;
    max-width: 98vw;
  }
  .input-row {
    flex-direction: column;
    gap: 10px;
  }
  .btn-row {
    flex-direction: column;
    gap: 10px;
  }
  .prediction-result { font-size: 1.04rem; }
}

/* Small mobile */
@media (max-width: 500px) {
  .main-content-area { gap: 6px; }
  .chart-section, .prediction-section, .right-sidebar-placeholder {
    margin-bottom: 8px;
    padding: 6px 1px;
  }
  .chart-title { font-size: 1rem; margin-bottom: 9px; }
}
</style>