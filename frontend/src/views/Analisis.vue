<template>
  <div class="analisis-page-wrapper">
    <div v-if="currentView === 'realtime'" class="original-analisis-content">
      <h2>Analisis Sensor & Prediksi Panen (Real-time)</h2>
      <!-- Chart Sensor -->
      <div class="chart-section-original"> <canvas ref="chartEl"></canvas>
      </div>
      <div class="prediction-section-original">
        <h3>Prediksi Panen (Asli)</h3>
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

          <div class="info-card">
            <h4>Saran Cepat</h4>
            <p v-if="averageSuhuComputed > 30 && averageSuhuComputed !== 'N/A'">Suhu cenderung tinggi, pertimbangkan
              peneduh!</p>
            <p v-else-if="averageKelembabanComputed < 60 && averageKelembabanComputed !== 'N/A'">Kelembaban rendah,
              perlu penyiraman ekstra!</p>
            <p v-else-if="averagePHComputed < 6.0 && averagePHComputed !== 'N/A'">pH tanah rendah, perlu penyesuaian!
            </p>
            <p v-else-if="historicalChartLabels.length > 0">Kondisi umum tampak baik untuk pertumbuhan.</p>
            <p v-else>Tidak ada data untuk saran.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import Chart from 'chart.js/auto';
import { io } from 'socket.io-client';
import * as tf from '@tensorflow/tfjs';
import axios from 'axios';

import DateFilter from '../components/common/DateFilter.vue';
import NavButtons from '../components/common/NavButtons.vue';
import ChartDisplay from '../components/ChartDisplay.vue';

const apiUrl = 'http://localhost:5000';

const chartEl = ref(null);
const chartInstance = ref(null);

// Inisialisasi data dummy 12 jam (atau ubah sesuai kebutuhan)
const N = 12
const labels = ref(Array.from({ length: N }, (_, i) => `Jam-${i + 1}`))
const suhuArr = ref([])
const humArr = ref([])
const chyArr = ref([])

// ====== SOCKET.IO (MQTT relay dari backend) =====
let socket
function setupSocket() {
  socket = io(apiUrl);
  // Hanya update array, geser data jika sudah N data
  socket.on('sensor-update', data => {
    if (currentView.value === 'realtime') {
      updateSensorArr(data);
    }
  });
  socket.on('sensor-single', ({ topic, value }) => {
    if (currentView.value === 'realtime') {
      console.log('MQTT update (original):', topic, value);
      let data = {};
      if (topic === 'SMART-FARM/temp') data.temperature = parseFloat(value);
      if (topic === 'SMART-FARM/hum') data.humidity = parseFloat(value);
      if (topic === 'SMART-FARM/chy') data.cahaya = parseFloat(value);
      updateSensorArr(data);
    }
  });
  console.log("Socket.IO client initialized.");
}

function updateSensorArr(data) {
  if (currentView.value === 'realtime' && chartInstance.value) {
    const nowLabel = new Date().toLocaleTimeString().slice(0, 5);
    labels.value.push(nowLabel);
    if (labels.value.length > N) labels.value.shift();

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

    chartInstance.value.data.labels = labels.value;
    chartInstance.value.data.datasets[0].data = suhuArr.value;
    chartInstance.value.data.datasets[1].data = humArr.value;
    chartInstance.value.data.datasets[2].data = chyArr.value;
    chartInstance.value.update();
  }
}

// Untuk prediksi
const inputValue = ref(30)
const prediction = ref(null)
const predictionAPI = ref(null)

// ====== TFJS LOCAL REGRESSION MODEL =====
let model = null
async function setupModel() {
  model = tf.sequential()
  model.add(tf.layers.dense({ inputShape: [1], units: 1 }))
  model.compile({ optimizer: 'sgd', loss: 'meanSquaredError' })
  const xs = tf.tensor1d([28, 29, 30, 31, 32])
  const ys = tf.tensor1d([52, 54, 55, 57, 58])
  await model.fit(xs, ys, { epochs: 120 })
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

const currentView = ref('historical-chart');
const selectedDateForHistorical = ref(new Date().toISOString().slice(0, 10)); // Default ke tanggal hari ini
const currentSensorTypeForHistorical = ref('cahaya');

// Data untuk Chart Historis
const historicalSensorData = ref({
  suhu: [],
  kelembaban: [],
  cahaya: [],
  pH: [],
});
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

const currentHistoricalChartData = computed(() => {
  return {
    labels: historicalChartLabels.value,
    datasets: [
      {
        label: currentHistoricalChartTitle.value,
        data: historicalSensorData.value[currentSensorTypeForHistorical.value],
        borderColor: getHistoricalChartColor(currentSensorTypeForHistorical.value),
        backgroundColor: getHistoricalChartBgColor(currentSensorTypeForHistorical.value),
        tension: 0.4,
        fill: false,
      },
    ],
  };
});

// warna garis chart
function getHistoricalChartColor(type) {
  switch (type) {
    case 'suhu': return 'gradient-cahaya';
    case 'kelembaban': return 'gradient-cahaya';
    case 'cahaya': return 'gradient-cahaya';
    case 'pH': return 'gradient-cahaya';
    default: return 'gradient-cahaya';
  }
}

function getHistoricalChartBgColor(type) {
  switch (type) {
    case 'suhu': return 'rgba(255, 99, 132, 0.2)';
    case 'kelembaban': return 'rgba(54, 162, 235, 0.2)';
    case 'cahaya': return 'rgba(110, 231, 183, 0.2)';
    case 'pH': return 'rgba(75, 192, 192, 0.2)';
    default: return 'rgba(204, 204, 204, 0.2)';
  }
}

const formattedSelectedDateForHistorical = computed(() => {
  if (!selectedDateForHistorical.value) return '';
  const date = new Date(selectedDateForHistorical.value);
  const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  return date.toLocaleDateString('id-ID', options);
});

// --- Computed properties untuk menghitung rata-rata data (Informasi Tambahan) ---
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
// --- Akhir dari computed properties ---

async function fetchHistoricalSensorData(type, date) {
  if (currentView.value !== 'historical-chart' || !date) return;

  console.log(`Fetching historical ${type} data for date: ${date}`);

  try {
    // --- Mock Data untuk sementara (GANTI DENGAN FETCH API NYATA) ---
    const mockHistorical = generateMockHistoricalSensorData(type, date);
    historicalChartLabels.value = mockHistorical.labels;
    historicalSensorData.value[type] = mockHistorical.data;
    console.log('Historical data fetched (mock):', mockHistorical);

  } catch (error) {
    console.error(`Gagal mengambil data historis ${type}:`, error);
    historicalChartLabels.value = [];
    historicalSensorData.value[type] = [];
  }
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

// ===== CHART.JS =====
onMounted(() => {
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
      options: { responsive: true }
    });
  }

  setupSocket();
  setupModel();

  if (currentView.value !== 'realtime') {
    fetchHistoricalSensorData(currentSensorTypeForHistorical.value, selectedDateForHistorical.value);
  }
});

onUnmounted(() => {
  if (chartInstance.value) chartInstance.value.destroy();
  if (socket) socket.disconnect();
});
</script>

<style scoped>
.analisis-page-wrapper {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: 'Arial', sans-serif;
}

.original-analisis-content {
  margin-bottom: 40px;
  background: #fff;
  border-radius: 14px;
  padding: 26px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.chart-section-original {
  background: #fff;
  border-radius: 14px;
  padding: 26px;
  margin-bottom: 20px;
}

.prediction-section-original {
  background: #f8fafb;
  border-radius: 14px;
  padding: 18px 14px;
  margin-top: 18px;
}

.analysis-header-banner {
  background: linear-gradient(to right, #6EE7B7, #10B981);
  color: white;
  padding: 20px;
  text-align: center;
  font-size: 1.8rem;
  font-weight: bold;
  border-radius: 10px;
  margin-bottom: 25px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.date-display-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.displayed-date {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
}

.main-content-area {
  display: flex;
  gap: 25px;
  flex-wrap: wrap;
}

.chart-section {
  flex: 3;
  min-width: 450px;
  background: #fff;
  border-radius: 14px;
  padding: 26px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.chart-title {
  text-align: center;
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 20px;
}

.prediction-section {
  flex: 3;
  min-width: 450px;
  background: #f8fafb;
  border-radius: 14px;
  padding: 18px 14px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.right-sidebar-placeholder h3 {
  color: #333333;
  font-size: 1.3rem;
  text-align: center;
  margin-bottom: 5px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: -1px;
}

.info-card h4 {
  margin-top: 0;
  color: #333;
  font-size: 1.2rem;
  margin-bottom: 12px;
  border-bottom: 1px solid #eee;
  padding-bottom: 5px;
}

.right-sidebar-placeholder {
  background-color: #f8f8f8;
  padding: 15px;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
  flex-basis: 300px;
  flex-grow: 0;
  flex-shrink: 0;
}

.info-card {
  background-color: #ffffff;
  padding: 15px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 5px;
  border: 1px solid #e0e0e0;
}

.info-card:last-child {
  margin-bottom: 0;
}

/* Gaya untuk paragraf dan list di dalam kartu */
.info-card p,
.info-card ul {
  font-size: 1rem;
  /* Ukuran font teks isi sedikit lebih besar agar mudah dibaca */
  color: #444;
  /* Warna teks isi */
  line-height: 1.6;
  /* Jarak antar baris lebih nyaman */
  margin-bottom: 8px;
  /* Jarak antar paragraf/list item */
}

.info-card ul {
  list-style: none;
  /* Hilangkan bullet default */
  padding-left: 0;
  /* Hilangkan padding default */
}

.info-card ul li {
  margin-bottom: 5px;
  /* Jarak antar item list */
}

@media (max-width: 768px) {
  .analysis-controls-info {
    flex-direction: column;
    align-items: stretch;
  }

  .main-content-area {
    flex-direction: column;
  }

  .chart-section,
  .prediction-section,
  .right-sidebar-placeholder,
  .chart-section-original,
  .prediction-section-original {
    min-width: unset;
    width: 100%;
  }
}
</style>