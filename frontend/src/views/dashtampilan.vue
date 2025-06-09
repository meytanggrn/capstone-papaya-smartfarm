<template>
  <div class="dashboard-layout">
    <Navbar />
    <main class="dashboard-main">
      <div class="banner">
        <h2>Halo, {{ userName }}! 👋</h2>
        <p>Mari cek tanaman Anda!</p>
      </div>

      <!-- Section Foto Lahan dengan Overlay -->
      <div v-if="lahan" class="lahan-preview">
        <div
          class="lahan-foto-bg"
          :style="{
            backgroundImage: `url(${apiUrl}/uploads/${lahan.foto})`
          }"
        >
          <!-- Overlay box kiri bawah -->
          <div class="lahan-overlay">
            <div class="lahan-title">{{ lahan.nama }}</div>
            <div class="lahan-lokasi">{{ lahan.lokasi || `(${lahan.latitude}, ${lahan.longitude})` }}</div>
          </div>
          <!-- Badge suhu kanan atas -->
          <div class="lahan-badge">
            <span class="badge-icon">🌞</span>
            <span class="badge-value">{{ suhu }}°C</span>
          </div>
        </div>
      </div>
      <div v-if="!lahan" class="lahan-preview-empty">
        <p>Silakan pilih lahan dari profil di pojok kanan atas!</p>
        <router-link to="/input-lahan">
          <button>+ Tambah Lahan</button>
        </router-link>
      </div>
      <div v-if="error" style="color:red; margin-top: 24px;">{{ error }}</div>

            <!-- BARIS DASHBOARD: DATA SENSOR & DETEKSI PENYAKIT -->
      <div class="dashboard-row">
        <!-- Data Sensor -->
        <section class="sensor-section">
          <h2>Data Sensor</h2>
          <div class="sensor-grid">
            <div class="sensor-card" v-for="item in sensorList" :key="item.label">
              <div class="sensor-icon" :style="{color: item.color}">{{ item.icon }}</div>
              <div class="sensor-title">{{ item.label }}</div>
              <div class="sensor-value" :style="{color: item.valueColor}">
                {{ item.value }} <span class="sensor-unit">{{ item.unit }}</span>
              </div>
              <div class="sensor-date">{{ item.time }}</div>
            </div>
          </div>
        </section>
        <!-- Deteksi Penyakit -->
<!-- Di section disease/Deteksi Penyakit -->
<section class="disease-section">
  <h2>Deteksi Penyakit</h2>
  <div class="disease-list">
    <div class="disease-card" v-for="d in diseaseList" :key="d.id">
      <img src="#" width="38" alt="deteksi" />
      <div>
        <div class="disease-title">{{ d.title }}</div>
        <div class="disease-devices">{{ d.devices }} DEVICES</div>
      </div>
      <span class="disease-arrow">›</span>
    </div>
  </div>
  <!-- Tombol Kamera -->
  <button class="camera-btn" @click="goToScan">
    <img src="#" width="32" />
  </button>
</section>

      </div>
       
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()
const goToScan = () => router.push('/deteksi/scan')
const apiUrl = 'http://localhost:5000'
const userName = ref('')
const lahan = ref(null)
const error = ref('')
const suhu = ref(32) // dummy, ganti dengan data sensor aslinya nanti

onMounted(() => {
  // Ambil nama user dari localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  userName.value = user.name || 'User'
  // Ambil lahan terpilih dari localStorage (dari dropdown profil/navbar)
  let lahanTerpilih = localStorage.getItem('lahan_terpilih')
  if (lahanTerpilih) {
    lahan.value = JSON.parse(lahanTerpilih)
  } else {
    lahan.value = null
  }
  // TODO: Fetch suhu sensor dari backend jika sudah ada
})
// Dummy sensor
const sensorList = ref([
  {
    icon: "☀️", label: "Intensitas Cahaya", value: 22, unit: "Lux",
    valueColor: "#e74c3c", color: "#e67e22", time: "12/08/2020 - 9:41"
  },
  {
    icon: "🌡️", label: "Suhu", value: 32, unit: "°C",
    valueColor: "#27ae60", color: "#27ae60", time: "12/08/2020 - 9:41"
  },
  {
    icon: "💧", label: "Kelembapan Udara", value: 70, unit: "%",
    valueColor: "#e74c3c", color: "#3498db", time: "12/08/2020 - 9:41"
  },
  {
    icon: "💧", label: "Kelembapan Tanah", value: 80, unit: "%",
    valueColor: "#27ae60", color: "#27ae60", time: "12/08/2020 - 9:41"
  },
])

// Dummy disease
const diseaseList = ref([
  { id: 1, title: "Cultivo 1", devices: 4 },
  { id: 2, title: "Cultivo 2", devices: 4 }
])
</script>

<style scoped>
.dashboard-layout {
  display: flex;
  min-height: 100vh;
  background: #f8fafb;
}
.dashboard-main {
  flex: 1;
  padding: 38px 32px 38px 32px; 
}
.banner {
  background: linear-gradient(90deg, #a2d5c6, #ffc857);
  border-radius: 14px;
  padding: 5px;
  color: #124e39;
  margin-bottom: 36px;
}
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
  overflow: hidden;
}
.lahan-overlay {
  position: absolute;
  left: 0; bottom: 0;
  margin: 0 0 24px 24px;
  color: #fff;
  padding: 16px 28px 14px 20px;
  background: linear-gradient(90deg, #000b 80%, #0000 100%);
  border-radius: 10px;
  box-shadow: 0 4px 14px #0001;
}
.lahan-title {
  font-weight: bold;
  font-size: 1.35rem;
  margin-bottom: 4px;
  letter-spacing: 0.5px;
}
.lahan-lokasi {
  font-size: 1rem;
  opacity: 0.86;
}
.lahan-badge {
  position: absolute;
  top: 18px; right: 32px;
  background: #fff;
  color: #555;
  padding: 7px 18px 7px 12px;
  border-radius: 22px;
  box-shadow: 0 2px 10px #0001;
  display: flex; align-items: center;
  font-weight: 500;
  font-size: 1.08rem;
  letter-spacing: 0.2px;
}
.badge-icon {
  font-size: 1.25rem;
  margin-right: 8px;
}
.lahan-preview-empty {
  margin: 38px 0 0 0;
}
.dashboard-row {
  display: flex;
  gap: 48px;
  margin-top: 32px;
  align-items: flex-start;
}
.sensor-section {
  width: 330px;
}
.sensor-section h2, .disease-section h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 10px;
}
.sensor-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.sensor-card {
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 2px 14px #0001;
  padding: 18px 14px 14px 14px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}
.sensor-icon {
  font-size: 1.5rem;
}
.sensor-title {
  font-weight: 500;
  margin-top: 5px;
}
.sensor-value {
  font-size: 1.7rem;
  font-weight: bold;
  margin: 6px 0 0 0;
}
.sensor-unit {
  font-size: 1.15rem;
  font-weight: 400;
}
.sensor-date {
  font-size: 0.88rem;
  color: #aaa;
  margin-top: 6px;
}

.disease-section {
  flex: 1;
  margin-left: 44px;
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
  font-weight: 300;
}
.camera-btn {
  position: absolute;
  right: 36px; bottom: 36px;
  background: #f2f3f4;
  border: none;
  border-radius: 50%;
  width: 60px; height: 60px;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 10px #0002;
  cursor: pointer;
  transition: background 0.18s;
  z-index: 10;
}
.camera-btn:hover { background: #e2eeea; }
.disease-section { position: relative; }

</style>

<!-- dash tampilan dummy -->