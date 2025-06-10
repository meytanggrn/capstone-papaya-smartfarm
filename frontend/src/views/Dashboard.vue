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
        <div v-if="error" style="color:red; margin-top: 24px;">{{ error }}</div>

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
              <div class="disease-list">
                <div
                  class="disease-card"
                  v-for="d in diseaseList"
                  :key="d.id"
                  @click="goToDetail(d.id)"
                  style="cursor: pointer"
                >
                  <img :src="d.imageUrl || '/default.png'" width="38" alt="deteksi" />
                  <div>
                    <div class="disease-title">{{ d.title }}</div>
                    <div class="disease-devices">{{ d.devices }} DEVICES</div>
                    <div class="disease-desc">{{ d.deskripsi }}</div>
                  </div>
                  <span class="disease-arrow">›</span>
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
  import { ref, onMounted, onUnmounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { io } from 'socket.io-client'
  import axios from 'axios'

  const router = useRouter()
  const goToScan = () => router.push('/deteksi/scan')
  const goToInputLahan = () => router.push('/input-lahan')
  const apiUrl = 'http://localhost:5000'

  const userName = ref('')
  const lahan = ref(null)
  const isWelcome = ref(false)
  const error = ref('')
  const sensor = ref({
    humidity: null,
    temperature: null,
    cahaya: null,
    kelembaban_tanah: null
  })
  const diseaseList = ref([])

  
  function goToDetail(id) {
    router.push(`/deteksi/${id}`)
  }
  const fetchDiseaseList = async () => {
    try {
      const token = localStorage.getItem('token')
      // Ambil data deteksi penyakit, misal hanya milik user yang sedang login
      const res = await axios.get(`${apiUrl}/api/deteksi`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      diseaseList.value = res.data // data array dari backend
    } catch (e) {
      diseaseList.value = []
    }
  }

  const socket = io(apiUrl)
  onMounted(async () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    userName.value = user.name || 'User'
    await fetchDiseaseList()
    const token = localStorage.getItem('token')
    try {
      const res = await axios.get(`${apiUrl}/api/lahan`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.data || res.data.length === 0) {
        isWelcome.value = true
      } else {
        lahan.value = res.data[0]
        localStorage.setItem('lahan_terpilih', JSON.stringify(res.data[0]))
        isWelcome.value = false
      }
    } catch (e) {
      isWelcome.value = true
    }
    // Realtime sensor
    // ===== Realtime sensor dari Socket.IO =====
    socket.on('sensor-update', data => {
      // Data sensor format banyak field (misal {humidity, temperature, ...})
      Object.assign(sensor.value, data)
      console.log('sensor-update', data)
    })
    socket.on('sensor-single', ({ topic, value }) => {
      const v = parseFloat(value)
      if (topic === 'SMART-FARM/hum') sensor.value.humidity = v
      if (topic === 'SMART-FARM/temp') sensor.value.temperature = v
      if (topic === 'SMART-FARM/chy') sensor.value.cahaya = v
      if (topic === 'SMART-FARM/kbtn') sensor.value.kelembaban_tanah = v
      console.log('sensor-single', topic, v)
    })

  })
  onUnmounted(() => {
    socket.off('sensor-update')
    socket.off('sensor-single')
  })

</script>

<style scoped>
  .dashboard-layout {
    display: flex;
    min-height: 100vh;
    background: #f8fafb;
    margin: 0;   
    padding: 20px;  
    box-sizing: border-box;
  }

  .dashboard-main {
    flex: 1;
    padding: 0;
  }
  .banner {
    background: linear-gradient(90deg, #a2d5c6, #ffc857);
    border-radius: 14px;
    padding: 5px;
    color: #124e39;
    margin-bottom: 36px;
  }

  /* Foto Lahan */
  .lahan-preview {
    margin-bottom: 28px;
  }
  .lahan-foto-bg {
    width: 100%;
    max-width: 900px;
    height: 320px;
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
  }

  /* Dashboard Row */
  .dashboard-row {
    display: flex;
    gap: 48px;
    margin-top: 32px;
  }

  .sensor-section {
    width: 100%;
    max-width: 400px; 
  }

  .sensor-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px 18px;
    margin-top: 18px;
  }

  .sensor-card {
    background: #fff;
    border-radius: 14px;
    box-shadow: 0 2px 12px #0001;
    padding: 18px 20px;
    min-width: 120px;
    min-height: 70px;
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
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
    /* flex: 1; */
    position: relative;
  }
  .disease-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
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
  }
  .disease-title {
    font-weight: 600;
  }
  .disease-devices {
    font-size: 0.9rem;
    color: #777;
  }
  .disease-arrow {
    margin-left: auto;
    font-size: 2rem;
    color: #bbb;
  }
  .camera-btn {
    position: absolute;
    right: 36px;
    bottom: 36px;
    background: #f2f3f4;
    border: none;
    border-radius: 50%;
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 10px #0002;
    cursor: pointer;
  }
  .camera-btn:hover {
    background: #e2eeea;
  }
  .sensor-row { display: flex; gap: 22px; margin-top: 18px; }
  .sensor-card { background: #fff; border-radius: 14px; box-shadow: 0 2px 12px #0001; padding: 18px 32px; min-width: 140px; text-align: center; }
  .sensor-title { font-weight: 600; }
  .sensor-value { font-size: 1.7rem; font-weight: bold; color: #24b47e; }
</style>
