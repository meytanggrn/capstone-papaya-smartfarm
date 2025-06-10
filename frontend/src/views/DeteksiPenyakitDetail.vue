<template>
  <div class="detail-disease-layout">
    <button class="back-btn" @click="goBack">
      <span class="back-icon">‹</span>
    </button>
    <h2 class="detail-title">Detail Deteksi Penyakit</h2>

    <div v-if="loading" class="loading">Memuat data...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    
    <div v-else class="detail-content">
      <div class="detail-image-wrap">
        <img :src="diseaseDataFoto" class="detail-image" alt="Foto Deteksi" />
      </div>
      <div class="detail-info">
        <h3>Keterangan</h3>
        <div class="info-row">
          <span class="info-label">Status Tanaman :</span>
          <span>{{ diseaseData.status || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Nama Penyakit :</span>
          <span :class="{'disease-name-highlight': diseaseData.nama_penyakit && diseaseData.nama_penyakit !== '-' }">
            {{ diseaseData.nama_penyakit || '-' }}
          </span>
        </div>
        <div class="info-row">
          <span class="info-label">Deskripsi :</span>
          <span>{{ diseaseData.deskripsi || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Catatan :</span>
          <span>{{ diseaseData.catatan || '-' }}</span>
        </div>
        
        <div class="action-buttons">
          <button 
            class="rekomendasi-btn" 
            @click="goToRekomendasi" 
            :disabled="!diseaseData.nama_penyakit || diseaseData.nama_penyakit === '-'">
            Lihat Rekomendasi
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'; 
import { useRoute, useRouter } from 'vue-router'; 
import axios from 'axios'; 

const apiUrl = 'http://localhost:5000'; 
const route = useRoute();
const router = useRouter(); 
const diseaseData = ref({});
const loading = ref(true);
const error = ref(''); 
const diseaseDataFoto = ref(''); 
const goBack = () => router.back(); 
// Fungsi untuk navigasi ke halaman rekomendasi
const goToRekomendasi = () => {
  // Memastikan nama penyakit sudah ada dan valid sebelum navigasi
  if (diseaseData.value.nama_penyakit && diseaseData.value.nama_penyakit !== '-') {
    // Navigasi ke rute 'Rekomendasi' dan kirim nama penyakit sebagai query parameter
    router.push({ 
      name: 'Rekomendasi', 
      query: { disease: diseaseData.value.nama_penyakit } 
    });
  } else {
    alert('Nama penyakit belum terdeteksi atau tidak valid untuk rekomendasi.');
  }
};

// Lifecycle hook: dipanggil saat komponen dimuat
onMounted(async () => {
  loading.value = true;
  try {
    const token = localStorage.getItem('token'); // Ambil token dari localStorage jika diperlukan oleh backend
    const res = await axios.get(`${apiUrl}/api/deteksi/${route.query.id}`, { // Mengambil detail deteksi berdasarkan ID dari URL
      headers: { Authorization: `Bearer ${token}` } // Kirim token otorisasi
    });
    diseaseData.value = res.data; // Simpan data yang diterima dari backend
    
    // Bentuk URL lengkap untuk foto, karena backend hanya mengembalikan nama file foto
    diseaseDataFoto.value = res.data.foto 
      ? `${apiUrl}/uploads/${res.data.foto}` // Sesuaikan dengan path server untuk file uploads
      : '/default.png'; // Gambar default jika tidak ada foto
    
    loading.value = false;
  } catch (e) {
    console.error("Error fetching disease detail:", e);
    error.value = 'Gagal mengambil data detail deteksi. Pastikan backend berjalan dan ID deteksi valid.';
    loading.value = false;
  }
});
</script>

<style scoped>
.detail-disease-layout {
  max-height: 100vh;
  margin: 0 auto;
  padding: 0 0 32px 0;
}
.back-btn {
  position: fixed;    /* agar selalu di pojok kiri, dekat sidebar */
  left: 240px;    /* lebar sidebar (misal 220px) + margin 20px */
    top: 90px;
  top: 90px;
  background: #fff;
  border: none;
  border-radius: 8px;
  box-shadow: 0 2px 12px #0001;
  width: 44px;
  height: 44px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
  transition: background 0.2s;
}

.back-btn:hover {
  background: #e3f5ed;
}

.back-icon {
  font-size: 2rem;
  color: #22886f;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail-title {
  text-align: center;
  margin: 50px 0 32px 0;
  font-weight: 700;
  font-size: 1.3rem;
  letter-spacing: 0.5px;
}
.detail-content {
  display: flex;
  gap: 48px;
  justify-content: center;
  align-items: flex-start;
  margin-top: 14px;
}
.detail-image-wrap {
  background: #fdf6e3;
  border-radius: 18px;
  padding: 18px;
  box-shadow: 0 2px 14px #0001;
  min-width: 320px;
  min-height: 320px;
  display: flex; align-items: center; justify-content: center;
}
.detail-image {
  width: 270px; height: 270px;
  object-fit: cover;
  border-radius: 14px;
}
.detail-info {
  flex: 1;
  margin-left: 18px;
}
.detail-info h3 {
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 18px;
}
.info-row {
  display: flex;
  gap: 14px;
  margin-bottom: 14px;
  font-size: 1.09rem;
}
.info-label {
  font-weight: 600;
  min-width: 145px;
}
.loading {
  text-align: center;
  margin: 44px 0;
  font-size: 1.12rem;
  color: #aaa;
}
.error {
  color: #d00;
  text-align: center;
  margin: 44px 0;
  font-size: 1.14rem;
}
.disease-name-highlight { 
  font-weight: bold;
  color: #22886f; 
}

.action-buttons {
  margin-top: 30px;
  text-align: center; 
}

.rekomendasi-btn {
  background-color: #22886f;
  color: white;
  padding: 12px 25px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: bold;
  transition: background-color 0.3s ease;
}

.rekomendasi-btn:hover:not(:disabled) {
  background-color: #1a6b5a;
}

.rekomendasi-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
  opacity: 0.7;
}
</style>