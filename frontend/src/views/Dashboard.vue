<template>
  <div class="dashboard-layout">
    <Navbar />
    <main class="dashboard-main">
      <!-- Welcome screen jika belum input lahan -->
      <div v-if="isWelcome" class="welcome-box">
        <h3>DASHBOARD</h3>
        <h1>Papaya SmartFarm</h1>
        <p>
          Website monitoring dan Prediksi Tanaman Papaya berbasis IoT dan ML.
        </p>
        <button @click="goToInputLahan" class="welcome-btn">
          Pelajari Selengkapnya
        </button>
      </div>

      <!-- Dashboard utama jika sudah ada lahan -->
      <template v-else>
        <!-- Banner -->
        <div class="banner">
          <h2>Halo, {{ userName }}! 👋</h2>
          <p>Mari cek tanaman Anda!</p>
        </div>

        <!-- Preview Foto Lahan -->
        <div v-if="lahan" class="lahan-preview">
          <div
            class="lahan-foto-bg"
            :style="{ backgroundImage: `url(${apiUrl}/uploads/${lahan.foto})` }"
          >
            <div class="lahan-overlay">
              <div class="lahan-title">{{ lahan.nama }}</div>
              <div class="lahan-lokasi">{{ lahan.lokasi || `(${lahan.latitude}, ${lahan.longitude})` }}</div>
            </div>
            <div class="lahan-badge">
              <span class="badge-icon">🌞</span>
              <span class="badge-value">{{ sensor.temperature ?? '-' }}°C</span>
            </div>
          </div>
        </div>
        <div v-else class="lahan-preview-empty">
          <p>Silakan pilih lahan dari profil di pojok kanan atas!</p>
          <router-link to="/input-lahan">
            <button>+ Tambah Lahan</button>
          </router-link>
        </div>
        
        <!-- Error message dengan styling yang lebih baik -->
        <div v-if="error" class="error-message">
          <span>⚠️ {{ error }}</span>
          <button @click="clearError" class="error-close">×</button>
        </div>

        <!-- Baris Dashboard: Sensor dan Penyakit -->
        <div class="dashboard-row">
          <!-- Sensor Section -->
          <section class="sensor-section">
            <h2>Data Sensor Realtime</h2>
            <div class="sensor-grid">
              <div class="sensor-card">
                <div class="sensor-title">Cahaya <font-awesome-icon icon="sun" size="lg" style="color: #edd535;" /> </div>
                <div class="sensor-value">{{ sensor.cahaya ?? '-' }} <span>Lux</span></div>
              </div>
              <div class="sensor-card">
                <div class="sensor-title">Suhu <font-awesome-icon icon="temperature-three-quarters" size="lg" style="color: #de4917;" /></div>
                <div class="sensor-value">{{ sensor.temperature ?? '-' }} <span>°C</span></div>
              </div>
              <div class="sensor-card">
                <div class="sensor-title">Kelembapan Udara</div>
                <div class="sensor-value">{{ sensor.humidity ?? '-' }} <span>%</span></div>
              </div>
              <div class="sensor-card">
                <div class="sensor-title">Kelembaban Tanah</div>
                <div class="sensor-value">{{ sensor.kelembaban_tanah ?? '-' }} <span>%</span></div>
              </div>
            </div>
          </section>

          <!-- Deteksi Penyakit -->
          <section class="disease-section">
            <h2>Deteksi Penyakit</h2>
            <div class="disease-list-container">
              <div class="disease-list">
                <template v-if="diseaseList.length > 0">
                  <div
                    class="disease-card"
                    v-for="d in diseaseList"
                    :key="d.id"
                    @click="goToDetail(d.id)"
                    style="cursor: pointer"
                  >
                  <img :src="apiUrl + d.image_url" width="38" alt="deteksi" />
                  <div>
                    <div class="disease-title">{{ d.title }}</div>
                    <div class="disease-status">{{ d.status }}</div>
                    <div class="disease-date">{{ d.created_at ? (new Date(d.created_at)).toLocaleString() : '-' }}</div>
                  </div>
                    <span class="disease-arrow">›</span>
                  </div>
                </template>
                <template v-else>
                  <div class="disease-empty-message">
                    Tidak ada data deteksi penyakit
                  </div>
                </template>
              </div>
            </div>
            <button class="camera-btn" @click="goToScan">
              <div class="camera-icon"><font-awesome-icon icon="camera" size="2xl" /></div>
            </button>
          </section>
        </div>
      </template>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { io } from 'socket.io-client'
import axios from 'axios'

const router = useRouter()
const apiUrl = 'https://backend-papaya-production.up.railway.app';

// State
const userName = ref('')
const lahan = ref(null)
const error = ref('')
const isLoading = ref(false)
const sensor = ref({
  humidity: null,
  temperature: null,
  cahaya: null,
  kelembaban_tanah: null
})
const diseaseList = ref([])

let socket = null

// Otomatis true jika lahan null/kosong
const isWelcome = computed(() => !lahan.value)

function goToScan() {
  router.push('/deteksi/scan')
}

function goToInputLahan() {
  router.push('/input-lahan')
}

function goToDetail(id) { 
  router.push(`/deteksi/${id}`) 
}

function clearError() {
  error.value = ''
}

// Ambil lahan terpilih dari localStorage
function updateLahan() {
  try {
    const lahanRaw = localStorage.getItem('lahan_terpilih')
    lahan.value = lahanRaw ? JSON.parse(lahanRaw) : null
  } catch (e) {
    console.error('Error parsing lahan data:', e)
    lahan.value = null
    localStorage.removeItem('lahan_terpilih')
  }
}

// Fetch list deteksi penyakit
async function fetchDiseaseList() {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    const res = await axios.get(`${apiUrl}/api/deteksi`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    diseaseList.value = res.data || []
  } catch (e) {
    console.error('Error fetching disease list:', e)
    diseaseList.value = []
    
    // Jika unauthorized, redirect ke login
    if (e.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('lahan_terpilih')
      router.push('/login')
    }
  }
}

// Fetch data lahan dari backend
async function fetchLahanData() {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    isLoading.value = true
    const res = await axios.get(`${apiUrl}/api/lahan`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    // Jika belum ada lahan terpilih, ambil yang pertama
    if (!localStorage.getItem('lahan_terpilih')) {
      if (res.data && res.data.length > 0) {
        localStorage.setItem('lahan_terpilih', JSON.stringify(res.data[0]))
        updateLahan()
      }
    }
    
    // Clear error jika berhasil
    error.value = ''
    
  } catch (e) {
    console.error('Error fetching lahan data:', e)
    
    // Hanya tampilkan error jika bukan masalah autentikasi
    if (e.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('lahan_terpilih')
      router.push('/login')
    } else {
      // Jangan tampilkan error jika sudah ada data lahan
      if (!lahan.value) {
        error.value = 'Gagal memuat data lahan'
      }
    }
  } finally {
    isLoading.value = false
  }
}

// Setup socket connection
function setupSocket() {
  try {
    socket = io(apiUrl)
    
    socket.on('connect', () => {
      console.log('Socket connected')
    })
    
    socket.on('disconnect', () => {
      console.log('Socket disconnected')
    })
    
    socket.on('sensor-update', data => {
      Object.assign(sensor.value, data)
    })
    
    socket.on('sensor-single', ({ topic, value }) => {
      const v = parseFloat(value)
      if (topic === 'SMART-FARM/hum') sensor.value.humidity = v
      if (topic === 'SMART-FARM/temp') sensor.value.temperature = v
      if (topic === 'SMART-FARM/chy') sensor.value.cahaya = v
      if (topic === 'SMART-FARM/kbtn') sensor.value.kelembaban_tanah = v
    })
    
    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err)
    })
    
  } catch (e) {
    console.error('Error setting up socket:', e)
  }
}

// Cleanup socket
function cleanupSocket() {
  if (socket) {
    socket.off('sensor-update')
    socket.off('sensor-single')
    socket.off('connect')
    socket.off('disconnect')
    socket.off('connect_error')
    socket.disconnect()
    socket = null
  }
}

// Initial setup
onMounted(async () => {
  try {
    // Check if user is authenticated
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    // Event listener untuk update lahan
    window.addEventListener('lahan-updated', updateLahan)
    
    // Update lahan dari localStorage
    updateLahan()

    // Ambil nama user
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    userName.value = user.name || 'User'

    // Fetch data
    await Promise.all([
      fetchDiseaseList(),
      fetchLahanData()
    ])

    // Setup socket connection
    setupSocket()
    
  } catch (e) {
    console.error('Error in onMounted:', e)
    error.value = 'Terjadi kesalahan saat memuat dashboard'
  }
})

onUnmounted(() => {
  cleanupSocket()
  window.removeEventListener('lahan-updated', updateLahan)
})
</script>

<style scoped>
.dashboard-layout {
  display: flex;
  height: 100vh;
  background: #f8fafb;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  overflow: hidden;
}

.dashboard-main {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  height: 100vh;
  box-sizing: border-box;
}

.banner {
  background: linear-gradient(90deg, #a2d5c6, #ffc857);
  border-radius: 25px;
  padding: 15px 25px;
  color: #124e39;
  margin-bottom: 15px;
}

.banner h2,
.banner p {
  margin: 0;
  padding: 2px 0;
}

/* Error message styling */
.error-message {
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 8px;
  padding: 12px 16px;
  margin: 16px 0;
  color: #c33;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.error-close {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #c33;
  cursor: pointer;
  padding: 0;
  margin-left: 12px;
}

.error-close:hover {
  color: #a00;
}

/* Welcome box styling */
.welcome-box {
  text-align: center;
  padding: 60px 20px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  margin: 40px auto;
  max-width: 600px;
}

.welcome-box h3 {
  color: #888;
  font-size: 1rem;
  margin-bottom: 10px;
}

.welcome-box h1 {
  color: #24b47e;
  font-size: 2.5rem;
  margin-bottom: 20px;
}

.welcome-box p {
  color: #666;
  font-size: 1.1rem;
  margin-bottom: 30px;
  line-height: 1.6;
}

.welcome-btn {
  background: #24b47e;
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 25px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.3s;
}

.welcome-btn:hover {
  background: #1a8c63;
}

/* Foto Lahan */
.lahan-preview {
  margin-bottom: 15px;
  display: flex;
  justify-content: center; 
  width: 100%;
}

.lahan-foto-bg {
  max-width: 100%;
  width: 100%;
  height: 200px;
  border-radius: 18px;
  background-size: cover;
  background-position: center;
  position: relative;
  box-shadow: 0 8px 32px #0003;
  display: flex;
  align-items: flex-end;
}

.lahan-overlay {
  position: absolute;
  left: 0;
  bottom: 0;
  margin: 0 0 24px 24px;
  color: #fff;
  padding: 16px 28px 14px 20px;
  background: linear-gradient(90deg, #000b 80%, #0000 100%);
  border-radius: 10px;
}

.lahan-title {
  font-weight: bold;
  font-size: 1.35rem;
}

.lahan-lokasi {
  font-size: 1rem;
  opacity: 0.86;
}

.lahan-badge {
  position: absolute;
  top: 18px;
  right: 32px;
  background: #fff;
  color: #555;
  padding: 7px 18px;
  border-radius: 22px;
  box-shadow: 0 2px 10px #0001;
  display: flex;
  align-items: center;
  font-weight: 500;
}

.badge-icon {
  font-size: 1.25rem;
  margin-right: 8px;
}

.lahan-preview-empty {
  margin: 38px 0 0 0;
  text-align: center;
  padding: 40px 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.lahan-preview-empty button {
  background: #24b47e;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 20px;
  cursor: pointer;
  margin-top: 10px;
}

/* Dashboard Row */
.dashboard-row {
  display: flex;
  gap: 20px;
  margin-top: 20px;
  height: calc(100vh - 420px);
  min-height: 350px;
}

.sensor-section {
  flex: 1;
  max-width: 45%;
}

.sensor-section h2 {
  margin-bottom: 15px;
  font-size: 1.3rem;
  color: #333;
}

.disease-section {
  flex: 1;
  max-width: 55%;
  position: relative;
  display: flex;
  flex-direction: column;
}

.disease-section h2 {
  margin-bottom: 15px;
  font-size: 1.3rem;
  color: #333;
}

.sensor-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px 15px;
  margin-top: 18px;
}

.sensor-card {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 2px 12px #0001;
  padding: 15px 20px;
  min-width: 120px;
  min-height: 80px;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.sensor-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.sensor-title {
  font-weight: 600;
  margin-bottom: 6px;
}

.sensor-value {
  font-size: 1.7rem;
  font-weight: bold;
  color: #24b47e;
}

.sensor-value span {
  font-size: 1.2rem;
  font-weight: 600;
  margin-left: 2px;
}

.disease-section {
  position: relative;
  max-width: 440px;
}

.disease-list-container {
  flex: 1;
  width: 100%;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 2px 12px #0001;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  min-height: 250px;
}

.disease-list {
  width: 100%;
}

.disease-empty-message {
  color: #bbb;
  font-size: 1.11rem;
  font-style: italic;
  text-align: center;
  width: 100%;
  padding: 32px 8px;
  letter-spacing: 0.2px;
}

.disease-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 14px #0001;
  padding: 15px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  margin-bottom: 10px;
  transition: transform 0.2s ease;
}

.disease-card:hover {
  transform: translateY(-2px);
}

.disease-title {
  font-weight: 600;
}

.disease-status {
  font-size: 0.9rem;
  color: #777;
}

.disease-date {
  font-size: 0.8rem;
  color: #999;
}

.disease-arrow {
  margin-left: auto;
  font-size: 2rem;
  color: #bbb;
}

.camera-btn {
  position: absolute;
  right: 20px;
  bottom: 20px;
  background: #24b47e;
  border: none;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(36, 180, 126, 0.3);
  cursor: pointer;
  transition: all 0.3s ease;
  color: white;
}

.camera-btn:hover {
  background: #1a8c63;
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(36, 180, 126, 0.4);
}

/* ---------------------- */
/*      RESPONSIVE        */
/* ---------------------- */

/* Tablet */
@media (max-width: 1024px) {
  .dashboard-layout {
    height: 100vh;
    overflow: hidden;
  }
  
  .dashboard-main {
    padding: 15px;
  }
  
  .dashboard-row {
    flex-direction: column;
    gap: 20px;
    height: auto;
  }
  
  .sensor-section, .disease-section {
    max-width: 100%;
  }
  
  .lahan-foto-bg {
    height: 180px;
  }
  
  .banner {
    margin-bottom: 15px;
    padding: 12px 20px;
  }
  
  .disease-list-container {
    min-height: 200px;
  }
}

/* Mobile */
@media (max-width: 768px) {
  .dashboard-layout {
    height: 100vh;
    overflow: hidden;
  }
  
  .dashboard-main {
    padding: 10px;
  }
  
  .banner {
    font-size: 0.9rem;
    margin-bottom: 12px;
    padding: 10px 15px;
    border-radius: 15px;
  }
  
  .lahan-foto-bg {
    height: 150px;
    border-radius: 12px;
  }
  
  .lahan-overlay {
    margin: 0 0 10px 10px;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 0.9rem;
  }
  
  .lahan-badge {
    top: 8px;
    right: 12px;
    padding: 4px 10px;
    font-size: 0.85rem;
    border-radius: 12px;
  }
  
  .dashboard-row {
    flex-direction: column;
    gap: 15px;
    margin-top: 15px;
    height: auto;
  }
  
  .sensor-section, .disease-section {
    max-width: 100%;
  }
  
  .sensor-grid {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  
  .sensor-card {
    min-height: 70px;
    padding: 12px;
    border-radius: 10px;
    font-size: 0.9rem;
  }
  
  .sensor-value {
    font-size: 1.4rem;
  }
  
  .sensor-value span {
    font-size: 1rem;
  }
  
  .disease-list-container {
    min-height: 180px;
    padding: 15px;
  }
  
  .disease-card {
    border-radius: 10px;
    padding: 12px 16px;
    gap: 12px;
    font-size: 0.9rem;
  }
  
  .disease-arrow {
    font-size: 1.3rem;
  }
  
  .camera-btn {
    right: 15px;
    bottom: 15px;
    width: 50px;
    height: 50px;
  }
  
  .welcome-box {
    margin: 15px 0;
    padding: 30px 15px;
  }
  
  .welcome-box h1 {
    font-size: 1.8rem;
  }
  
  .lahan-preview-empty {
    margin: 20px 0;
    padding: 30px 15px;
  }
}
</style>