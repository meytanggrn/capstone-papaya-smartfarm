<template>
  <div class="rekomendasi-page-container">
    <div class="header-section">
      <h1>Rekomendasi Pupuk & Obat</h1>
      <p>Untuk kondisi tanaman: <strong>{{ detectedDiseaseName || 'Tidak Terdeteksi' }}</strong></p> 
      <p v-if="userLocation">Harga disesuaikan untuk wilayah: <strong>{{ userLocation }}</strong></p>
      <p>Dapatkan rekomendasi terbaik untuk kesehatan tanaman pepaya Anda, lengkap dengan informasi harga.</p>
    </div>

    <div class="location-selector">
      <label for="location-select">Simulasikan Lokasi:</label>
      <select id="location-select" v-model="selectedLocation">
        <option value="Jawa Barat">Jawa Barat</option>
        <option value="Jawa Tengah">Jawa Tengah</option>
        <option value="Jawa Timur">Jawa Timur</option>
        <option value="Sumatera">Sumatera</option>
        <option value="Kalimantan">Kalimantan</option>
      </select>
    </div>

    <div class="rekomendasi-list">
      <div v-if="loading" class="loading-message">Memuat rekomendasi...</div>
      <div v-else-if="error" class="error-message">{{ error }}</div>
      
      <div v-else>
        <div v-if="rekomendasiItems.length === 0" class="no-data">
          <p>Tidak ada rekomendasi spesifik untuk kondisi ini atau data belum tersedia.</p>
          <p>Mohon pastikan deteksi penyakit telah dilakukan atau hubungi administrator.</p>
        </div>

        <div v-for="item in rekomendasiItems" :key="item.id" class="rekomendasi-card">
          <div class="card-header">
            <h2>{{ item.nama }}</h2>
            <span class="purpose-tag" :style="{ backgroundColor: getPurposeColor(item.untuk_penyakit) }">{{ item.untuk_penyakit }}</span>
          </div>
          <p class="description">{{ item.deskripsi }}</p>
          <div class="price-info">
            <h3>Harga: <span>{{ formatRupiah(item.harga_daerah[selectedLocation] || item.harga_default) }}</span></h3>
            </div>
          <div class="location-general-info">
            <h4>Ketersediaan Umum:</h4>
            <p>Tersedia di toko pertanian terdekat atau marketplace online.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

// --- START: BAGIAN YANG AKAN BERINTERAKSI DENGAN BACKEND NANTINYA ---
// Variabel untuk menyimpan lokasi pengguna yang sebenarnya (atau disimulasikan)
// NANTINYA: userLocation akan didapat dari hasil Geolocation API kemudian dikonversi oleh backend
const userLocation = ref('Jawa Tengah'); // Default lokasi mock

// Ini adalah variabel untuk dropdown simulasi lokasi, akan dihilangkan di produksi
const selectedLocation = ref('Jawa Tengah'); // Default lokasi untuk selector

const loading = ref(false); // Status loading untuk request ke backend
const error = ref(''); // Pesan error jika ada masalah fetching data
// --- END: BAGIAN YANG AKAN BERINTERAKSI DENGAN BACKEND NANTINYA ---

// --- START: DATA MOCK (AKAN DIGANTI DENGAN FETCH DARI BACKEND) ---
const allRekomendasiItemsMock = ref([
  {
    id: 1,
    nama: "Pupuk Organik Kompos Super",
    deskripsi: "Pupuk organik kaya nutrisi, cocok untuk meningkatkan kesuburan tanah dan ketahanan tanaman terhadap penyakit.",
    harga_default: 75000,
    harga_daerah: {
      "Jawa Barat": 78000,
      "Jawa Tengah": 73000,
      "Jawa Timur": 76000,
      "Sumatera": 85000,
      "Kalimantan": 90000
    },
    untuk_penyakit: "Busuk Batang",
  },
  {
    id: 2,
    nama: "Fungisida Azoxystrobin",
    deskripsi: "Fungisida sistemik untuk mengendalikan penyakit jamur, efektif terhadap penyakit Antraknosa.",
    harga_default: 120000,
    harga_daerah: {
      "Jawa Barat": 125000,
      "Jawa Tengah": 118000,
      "Jawa Timur": 122000,
      "Sumatera": 135000,
      "Kalimantan": 140000
    },
    untuk_penyakit: "Antraknosa",
  },
  {
    id: 3,
    nama: "Pupuk Daun NPK Cair",
    deskripsi: "Pupuk daun lengkap untuk pertumbuhan vegetatif, membantu pemulihan dari kekurangan nutrisi akibat Cercospora.",
    harga_default: 50000,
    harga_daerah: {
      "Jawa Barat": 52000,
      "Jawa Tengah": 48000,
      "Jawa Timur": 51000,
      "Sumatera": 58000,
      "Kalimantan": 60000
    },
    untuk_penyakit: "Cercospora",
  },
  {
    id: 4,
    nama: "Perawatan Rutin & Pemantauan",
    deskripsi: "Tanaman Anda dalam kondisi sehat. Lanjutkan perawatan rutin, jaga kebersihan lingkungan, dan pantau terus kondisi daun.",
    harga_default: 0,
    harga_daerah: {},
    untuk_penyakit: "Sehat",
  },
  {
    id: 5,
    nama: "Konsultasi Ahli Pertanian",
    deskripsi: "Untuk kondisi yang tidak terdeteksi atau kompleks, disarankan berkonsultasi dengan ahli pertanian lokal.",
    harga_default: 0,
    harga_daerah: {},
    untuk_penyakit: "Tidak Terdeteksi",
  }
]);
// --- END: DATA MOCK ---

const rekomendasiItems = ref([]);
const detectedDiseaseName = ref('');

// Fungsi utama untuk memfilter/mengambil rekomendasi
// NANTINYA: Fungsi ini akan memanggil API Backend
const fetchRekomendasi = async () => {
  loading.value = true;
  error.value = '';

  const disease = route.query.disease;
  detectedDiseaseName.value = disease || 'Tidak Terdeteksi';

  // --- PENTING: Perbarui userLocation agar tampilan header ikut berubah ---
  userLocation.value = selectedLocation.value; 

  // --- START: LOGIKA PENGGUNAAN DATA MOCK (AKAN DIGANTI DENGAN AXIOS.GET DARI BACKEND) ---
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulasi loading

  if (disease) {
    const filtered = allRekomendasiItemsMock.value.filter(item =>
      item.untuk_penyakit && item.untuk_penyakit.toLowerCase() === disease.toLowerCase()
    );
    if (filtered.length === 0) {
      if (disease.toLowerCase() === 'sehat' || disease.toLowerCase() === 'healthy') {
        rekomendasiItems.value = allRekomendasiItemsMock.value.filter(item => item.untuk_penyakit === 'Sehat');
      } else {
        rekomendasiItems.value = allRekomendasiItemsMock.value.filter(item => item.untuk_penyakit === 'Tidak Terdeteksi');
      }
    } else {
      rekomendasiItems.value = filtered;
    }
  } else {
    rekomendasiItems.value = allRekomendasiItemsMock.value.filter(item => item.untuk_penyakit === 'Tidak Terdeteksi');
  }
  // --- END: LOGIKA PENGGUNAAN DATA MOCK ---

  // --- START: BAGAIMANA NANTINYA KETIKA MENGGUNAKAN BACKEND ---
  /*
  import axios from 'axios'; // Pastikan axios diimpor di bagian atas <script setup>
  const apiUrl = 'http://localhost:5000'; // Sesuaikan dengan URL backend kamu

  try {
    // 1. Dapatkan lokasi pengguna yang akurat (jika belum ada)
    //    Ini bisa dilakukan sekali saat aplikasi dimuat atau per halaman.
    //    Misal: kamu punya fungsi `getActualUserLocation()` yang mengembalikan nama daerah.
    //    const actualUserRegion = await getActualUserLocation(); 
    //    userLocation.value = actualUserRegion; // Update UI dengan lokasi asli
    //    const locationToSendToBackend = actualUserRegion; 

    // 2. Lakukan request ke backend untuk mendapatkan rekomendasi berdasarkan penyakit dan lokasi
    //    Ganti `selectedLocation.value` dengan `locationToSendToBackend` jika sudah menggunakan Geolocation
    const response = await axios.get(`${apiUrl}/api/rekomendasi`, {
      params: {
        disease: detectedDiseaseName.value,
        location: selectedLocation.value // Saat ini masih pakai selectedLocation dari dropdown
      }
    });
    rekomendasiItems.value = response.data; // Backend akan mengembalikan data yang sudah difilter dan diatur harganya
  } catch (err) {
    console.error("Error fetching recommendations:", err);
    error.value = 'Gagal memuat rekomendasi. Coba lagi nanti.';
    rekomendasiItems.value = []; // Kosongkan rekomendasi jika ada error
  }
  */
  // --- END: BAGAIMANA NANTINYA KETIKA MENGGUNAKAN BACKEND ---

  loading.value = false;
};

// Lifecycle hook: Panggil fetchRekomendasi saat komponen dimuat pertama kali
onMounted(() => {
  fetchRekomendasi();
});

// Watcher: Memantau perubahan pada query parameter 'disease' di URL
// Ini penting jika pengguna menavigasi ke halaman Rekomendasi lagi dengan penyakit yang berbeda tanpa memuat ulang halaman penuh
watch(() => route.query.disease, (newDisease) => {
  fetchRekomendasi();
});

// --- PENTING: Tambahkan watcher ini untuk selectedLocation ---
// Ini akan memicu fetchRekomendasi setiap kali nilai dropdown selectedLocation berubah
watch(selectedLocation, (newValue) => {
  fetchRekomendasi();
});


// Fungsi utilitas untuk memformat angka menjadi format Rupiah
const formatRupiah = (angka) => {
  if (angka === 0) return "Gratis";
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(angka);
};

// Fungsi untuk memberikan warna pada tag penyakit berdasarkan jenis penyakit
const getPurposeColor = (penyakit) => {
  switch (penyakit.toLowerCase()) {
    case 'busuk batang':
      return '#DC3545';
    case 'antraknosa':
      return '#FFC107';
    case 'cercospora':
      return '#17A2B8';
    case 'sehat':
    case 'healthy':
      return '#28a745';
    default:
      return '#6C757D';
  }
};
</script>

<style scoped>
.rekomendasi-page-container {
  padding: 30px;
  background-color: #f0f2f5;
  min-height: calc(100vh - 60px);
  border-radius: 10px;
}

.header-section {
  text-align: center;
  margin-bottom: 30px; 
  background: linear-gradient(90deg, #CFC33F, #4A7374);
  padding: 25px 20px;
  border-radius: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.header-section h1 {
  color: #fff;
  font-size: 2.5rem;
  margin-bottom: 10px;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.2);
}

.header-section p {
  color: #eee;
  font-size: 1.1rem;
  max-width: 700px;
  margin: 0 auto;
}

.header-section p strong {
    color: #fff;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

.location-selector {
  display: flex;
  justify-content: center; 
  align-items: center;
  margin-bottom: 30px;
  padding: 15px;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
  gap: 15px; 
}

.location-selector label {
  font-size: 1.1rem;
  color: #333;
  /* margin-right: 15px; // Hapus atau kurangi jika pakai gap */
  font-weight: 600;
}

.location-selector select {
  padding: 10px 15px;
  border-radius: 8px;
  border: 1px solid #ccc;
  font-size: 1rem;
  min-width: 150px;
  cursor: pointer;
  background-color: #0f610f;
  appearance: none; /* Hapus gaya default select box */
  background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%20viewBox%3D%220%200%20292.4%20292.4%22%3E%3Cpath%20fill%3D%22%23000%22%20d%3D%22M287%20197.9c-3.7-3.7-9.8-3.7-13.5%200L146.2%2034.4c-3.7-3.7-9.8-3.7-13.5%200l-127.3%20127.3c-3.7%203.7-3.7%209.8%200%2013.5l13.5%2013.5c3.7%203.7%209.8%203.7%2013.5%200L146.2%2093.4l109.8%20109.8c3.7%203.7%209.8%203.7%2013.5%200l13.5-13.5c3.7-3.7%203.7-9.8%200-13.5z%22%2F%3E%3C%2Fsvg%3E'); /* Tambahkan ikon panah custom */
  background-repeat: no-repeat;
  background-position: right 10px top 50%;
  background-size: 12px auto;
}

.location-selector select:focus {
  outline: none;
  border-color: #4A7374;
  box-shadow: 0 0 0 3px rgba(6, 95, 33, 0.2);
}


.rekomendasi-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 25px;
}

.no-data {
  grid-column: 1 / -1;
  text-align: center;
  padding: 50px;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  color: #666;
  font-size: 1.1rem;
}

.loading-message, .error-message {
  grid-column: 1 / -1;
  text-align: center;
  padding: 30px;
  font-size: 1.2rem;
  color: #666;
}

.error-message {
  color: #dc3545;
}

.rekomendasi-card {
  background-color: #ffffff;
  padding: 25px;
  border-radius: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.rekomendasi-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.card-header h2 {
  font-size: 1.5rem;
  color: #333;
  margin: 0;
}

.purpose-tag {
  color: #fff;
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: bold;
}

.description {
  font-size: 0.95rem;
  color: #555;
  margin-bottom: 20px;
  line-height: 1.6;
}

.price-info {
  margin-top: auto;
  margin-bottom: 15px;
}

.price-info h3 {
  font-size: 1.3rem;
  color: #28a745;
  margin: 0;
}

.price-info span {
  font-weight: bold;
}

.location-general-info {
  border-top: 1px solid #eee;
  padding-top: 15px;
}

.location-general-info h4 {
  font-size: 1rem;
  color: #4A7374;
  margin-top: 0;
  margin-bottom: 8px;
}

.location-general-info p {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 5px;
}
</style>