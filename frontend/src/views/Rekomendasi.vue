<template>
  <div class="rekomendasi-page-container">
<div class="header-section">
  <h1>Rekomendasi Pupuk & Obat</h1>
  <p style="font-size:1.3rem; font-weight:600; margin-bottom:8px;">
    {{ diseaseHeaderMap[detectedDiseaseName] || diseaseHeaderMap['default'] }}
  </p>
  <p style="margin-bottom:6px;">
    <strong>Kondisi tanaman: </strong>
    <span style="color:#f2ffad; font-weight:700">{{ detectedDiseaseName || 'Tidak Terdeteksi' }}</span>
    <template v-if="userLocation">
      &nbsp;|&nbsp;<strong>Wilayah: {{ userLocation }}</strong>
    </template>
  </p>
  <p v-if="diseaseDescMap[detectedDiseaseName]" style="font-size:1.07rem; color:#fffedc;">
    {{ diseaseDescMap[detectedDiseaseName] }}
  </p>
  <p v-else style="color:#f3ffe0;">
    Dapatkan rekomendasi terbaik untuk kesehatan tanaman pepaya Anda, lengkap dengan info harga.
  </p>
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
    nama: "Fungisida Propineb",
    deskripsi: "Gunakan fungisida berbahan aktif Propineb untuk pengendalian penyakit Bercak Daun. Semprotkan sesuai dosis dan petunjuk kemasan.",
    harga_default: 64000,
    harga_daerah: {
      "Jawa Barat": 65000,
      "Jawa Tengah": 62000,
      "Jawa Timur": 63000,
      "Sumatera": 70000,
      "Kalimantan": 72000
    },
    untuk_penyakit: "Bercak Daun"
  },
  {
    id: 2,
    nama: "Fungisida Mancozeb",
    deskripsi: "Fungisida sistemik dan kontak untuk pengendalian Hawar Daun. Semprotkan saat gejala awal muncul, ulangi 7-10 hari jika perlu.",
    harga_default: 67000,
    harga_daerah: {
      "Jawa Barat": 69000,
      "Jawa Tengah": 66000,
      "Jawa Timur": 67000,
      "Sumatera": 74000,
      "Kalimantan": 76000
    },
    untuk_penyakit: "Hawar Daun"
  },
  {
    id: 3,
    nama: "Fungisida Triazol",
    deskripsi: "Untuk pengendalian Karat Daun pada pepaya. Gunakan fungisida dengan bahan aktif triazol secara berkala saat cuaca lembab.",
    harga_default: 82000,
    harga_daerah: {
      "Jawa Barat": 83000,
      "Jawa Tengah": 80000,
      "Jawa Timur": 81000,
      "Sumatera": 87000,
      "Kalimantan": 90000
    },
    untuk_penyakit: "Karat Daun"
  },
  {
    id: 4,
    nama: "Fungisida Tembaga & Perbaikan Drainase",
    deskripsi: "Atasi Busuk Batang dengan fungisida tembaga dan perbaiki drainase. Potong bagian batang yang busuk dan bakar.",
    harga_default: 88000,
    harga_daerah: {
      "Jawa Barat": 90000,
      "Jawa Tengah": 85000,
      "Jawa Timur": 88000,
      "Sumatera": 95000,
      "Kalimantan": 97000
    },
    untuk_penyakit: "Busuk Batang"
  },
  {
    id: 5,
    nama: "Perawatan Rutin & Pemantauan",
    deskripsi: "Tanaman Anda sehat! Lanjutkan pemupukan, penyiraman, dan pengamatan secara berkala untuk menjaga kesehatan tanaman.",
    harga_default: 0,
    harga_daerah: {},
    untuk_penyakit: "Sehat"
  },
  {
    id: 6,
    nama: "Konsultasi Ahli Pertanian",
    deskripsi: "Jika kondisi tanaman tidak terdeteksi atau kompleks, konsultasikan ke penyuluh atau ahli pertanian setempat.",
    harga_default: 0,
    harga_daerah: {},
    untuk_penyakit: "Tidak Terdeteksi"
  }
]);

// --- END: DATA MOCK ---

const rekomendasiItems = ref([]);
const detectedDiseaseName = ref('');
// Judul kondisi berdasarkan penyakit
const diseaseHeaderMap = {
  "Bercak Daun": "Tanaman terkena Bercak Daun, segera lakukan pengendalian!",
  "Hawar Daun": "Hawar Daun terdeteksi, lakukan penanganan secepatnya.",
  "Karat Daun": "Tanaman terkena Karat Daun, berikut solusinya.",
  "Busuk Batang": "Busuk Batang terdeteksi, lakukan tindakan pencegahan!",
  "Sehat": "Tanaman Anda sehat, lanjutkan perawatan terbaik.",
  "Tidak Terdeteksi": "Belum ada gejala penyakit yang terdeteksi.",
  "default": "Dapatkan rekomendasi terbaik untuk kondisi pepaya Anda."
};
const diseaseDescMap = {
  "Bercak Daun": "Pilih fungisida sesuai rekomendasi dan lakukan pemangkasan daun terinfeksi.",
  "Hawar Daun": "Semprotkan fungisida dan hindari penyiraman daun secara langsung.",
  "Karat Daun": "Gunakan fungisida triazol dan buang daun yang parah.",
  "Busuk Batang": "Jaga drainase, potong bagian busuk, dan gunakan fungisida tembaga.",
  "Sehat": "Teruskan pola perawatan, pemupukan, dan monitoring rutin.",
  "Tidak Terdeteksi": "Jika ada gejala baru, lakukan deteksi ulang atau konsultasi ahli.",
  "default": ""
};

// Fungsi utama untuk memfilter/mengambil rekomendasi
// NANTINYA: Fungsi ini akan memanggil API Backend
const fetchRekomendasi = async () => {
  loading.value = true;
  error.value = '';

  const disease = route.query.disease;
  detectedDiseaseName.value = disease || 'Tidak Terdeteksi';

  userLocation.value = selectedLocation.value; 

  await new Promise(resolve => setTimeout(resolve, 350)); // Simulasi loading

  // FILTER UTAMA
  if (disease) {
    const filtered = allRekomendasiItemsMock.value.filter(item =>
      item.untuk_penyakit.toLowerCase() === disease.toLowerCase()
    );
    if (filtered.length > 0) {
      rekomendasiItems.value = filtered;
    } else if (disease.toLowerCase() === 'sehat') {
      rekomendasiItems.value = allRekomendasiItemsMock.value.filter(item => item.untuk_penyakit === 'Sehat');
    } else {
      // Penyakit tidak dikenal atau deteksi gagal
      rekomendasiItems.value = allRekomendasiItemsMock.value.filter(item => item.untuk_penyakit === 'Tidak Terdeteksi');
    }
  } else {
    // Default: tidak terdeteksi
    rekomendasiItems.value = allRekomendasiItemsMock.value.filter(item => item.untuk_penyakit === 'Tidak Terdeteksi');
  }

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
    case 'bercak daun':
      return '#23b05c';
    case 'hawar daun':
      return '#ff993a';
    case 'karat daun':
      return '#a162ef';
    case 'busuk batang':
      return '#de4040';
    case 'sehat':
      return '#28a745';
    default:
      return '#6C757D'; // Tidak terdeteksi
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


/* .rekomendasi-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 25px;
} */
.rekomendasi-list {
  margin-top: 18px;
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