<template>
  <div class="rekomendasi-page-container">
    <div class="header-section">
      <h1>🌿 Rekomendasi Penanganan Tanaman</h1>
      <p style="font-size:1.3rem; font-weight:600; margin-bottom:8px;">
        {{ getHeaderText() }}
      </p>
      <p style="margin-bottom:6px;">
        <strong>Kondisi saat ini: </strong>
        <span style="color:#f2ffad; font-weight:700">
          {{ selectedDetection ? selectedDetection.className : 'Pilih hasil deteksi' }}
        </span>
        <template v-if="selectedDetection">
          &nbsp;|&nbsp;<strong>Kepercayaan: {{ (selectedDetection.probability * 100).toFixed(1) }}%</strong>
        </template>
      </p>
      <p style="font-size:1.07rem; color:#fffedc;">
        {{ getDescriptionText() }}
      </p>
    </div>

    <!-- Detection History Selector -->
    <div class="detection-selector">
      <div class="selector-card">
        <h3>📊 Pilih Hasil Deteksi</h3>
        <div v-if="detectionHistory.length === 0" class="no-history">
          <p>Belum ada riwayat deteksi penyakit.</p>
          <router-link to="/deteksi/scan" class="scan-link">
            📸 Lakukan Deteksi Sekarang
          </router-link>
        </div>
        
        <div v-else class="history-dropdown">
          <label for="detection-select">Pilih riwayat deteksi:</label>
          <select id="detection-select" v-model="selectedDetectionIndex" @change="updateRecommendations">
            <option value="" disabled>-- Pilih hasil deteksi --</option>
            <option 
              v-for="(detection, index) in detectionHistory" 
              :key="index" 
              :value="index"
            >
              {{ detection.className }} - {{ formatTime(detection.timestamp) }} 
              ({{ (detection.probability * 100).toFixed(1) }}%)
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Recommendations List -->
    <div class="rekomendasi-list">
      <div v-if="loading" class="loading-message">
        <div class="loading-spinner"></div>
        Memuat rekomendasi...
      </div>
      
      <div v-else-if="!selectedDetection" class="no-selection">
        <div class="no-selection-card">
          <div class="no-selection-icon">🔍</div>
          <h3>Pilih Hasil Deteksi</h3>
          <p>Silakan pilih salah satu hasil deteksi dari dropdown di atas untuk melihat rekomendasi penanganan yang sesuai.</p>
        </div>
      </div>

      <div v-else class="recommendations-grid">
        <div 
          v-for="recommendation in currentRecommendations" 
          :key="recommendation.id" 
          class="rekomendasi-card"
          :class="getCardClass(recommendation.type)"
        >
          <div class="card-header">
            <div class="card-title">
              <span class="card-icon">{{ recommendation.icon }}</span>
              <h2>{{ recommendation.title }}</h2>
            </div>
            <span class="purpose-tag" :style="{ backgroundColor: getPurposeColor(selectedDetection.className) }">
              {{ recommendation.category }}
            </span>
          </div>
          
          <div class="card-content">
            <p class="description">{{ recommendation.description }}</p>
            
            <div v-if="recommendation.steps" class="steps-section">
              <h4>📋 Langkah-langkah:</h4>
              <ol class="steps-list">
                <li v-for="step in recommendation.steps" :key="step">{{ step }}</li>
              </ol>
            </div>

            <div v-if="recommendation.tips" class="tips-section">
              <h4>💡 Tips Tambahan:</h4>
              <ul class="tips-list">
                <li v-for="tip in recommendation.tips" :key="tip">{{ tip }}</li>
              </ul>
            </div>

            <div v-if="recommendation.warning" class="warning-section">
              <h4>⚠️ Perhatian:</h4>
              <p class="warning-text">{{ recommendation.warning }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div v-if="selectedDetection" class="quick-actions">
      <h3>🚀 Aksi Cepat</h3>
      <div class="action-buttons">
        <button @click="exportRecommendations" class="action-btn export-btn">
          📥 Export Rekomendasi
        </button>
        <button @click="shareRecommendations" class="action-btn share-btn">
          📤 Bagikan
        </button>
        <router-link to="/deteksi/scan" class="action-btn scan-btn">
          🔄 Deteksi Ulang
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import Swal from 'sweetalert2'

// Reactive data
const detectionHistory = ref([])
const selectedDetectionIndex = ref('')
const selectedDetection = ref(null)
const currentRecommendations = ref([])
const loading = ref(false)

// Load detection history from localStorage
function loadDetectionHistory() {
  const saved = localStorage.getItem('detectionHistory')
  if (saved) {
    try {
      detectionHistory.value = JSON.parse(saved)
    } catch (e) {
      console.error('Failed to load detection history:', e)
      detectionHistory.value = []
    }
  }
}

// Format time utility
function formatTime(timestamp) {
  const date = new Date(timestamp)
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Get header text based on selected detection
function getHeaderText() {
  if (!selectedDetection.value) {
    return "Pilih hasil deteksi untuk mendapatkan rekomendasi penanganan"
  }
  
  const disease = selectedDetection.value.className
  const headerMap = {
    "Bercak Daun": "Penanganan Bercak Daun - Segera lakukan tindakan!",
    "Hawar Daun": "Penanganan Hawar Daun - Atasi sebelum menyebar!",
    "Karat Daun": "Penanganan Karat Daun - Lindungi tanaman Anda!",
    "Busuk Batang": "Penanganan Busuk Batang - Tindakan segera diperlukan!",
    "Sehat": "Tanaman Sehat - Tingkatkan kualitas buah!"
  }
  
  return headerMap[disease] || "Rekomendasi penanganan tanaman pepaya"
}

// Get description text based on selected detection
function getDescriptionText() {
  if (!selectedDetection.value) {
    return "Dapatkan rekomendasi penanganan yang tepat berdasarkan hasil deteksi penyakit tanaman pepaya Anda."
  }
  
  const disease = selectedDetection.value.className
  const descMap = {
    "Bercak Daun": "Ikuti panduan lengkap untuk mengatasi bercak daun dan mencegah penyebarannya.",
    "Hawar Daun": "Terapkan langkah-langkah pengendalian hawar daun yang efektif dan aman.",
    "Karat Daun": "Lakukan penanganan karat daun dengan metode yang terbukti ampuh.",
    "Busuk Batang": "Selamatkan tanaman dengan penanganan busuk batang yang tepat sasaran.",
    "Sehat": "Optimalkan kesehatan tanaman dan tingkatkan kualitas serta kuantitas buah pepaya."
  }
  
  return descMap[disease] || "Ikuti rekomendasi terbaik untuk kesehatan tanaman pepaya Anda."
}

// Get purpose color for tag
function getPurposeColor(disease) {
  const colorMap = {
    'Bercak Daun': '#ff6b35',
    'Hawar Daun': '#f7931e',
    'Karat Daun': '#9b59b6',
    'Busuk Batang': '#e74c3c',
    'Sehat': '#27ae60'
  }
  return colorMap[disease] || '#6c757d'
}

// Get card class based on recommendation type
function getCardClass(type) {
  return {
    'treatment-card': type === 'treatment',
    'prevention-card': type === 'prevention',
    'maintenance-card': type === 'maintenance'
  }
}

// Recommendations data based on disease type
const recommendationsData = {
  "Bercak Daun": [
    {
      id: 1,
      type: 'treatment',
      category: 'Pengobatan',
      icon: '💊',
      title: 'Aplikasi Fungisida',
      description: 'Gunakan fungisida berbahan aktif Propineb atau Mankozeb untuk mengendalikan bercak daun secara efektif.',
      steps: [
        'Campurkan fungisida sesuai dosis pada kemasan (biasanya 2-3 gram per liter air)',
        'Semprotkan pada seluruh bagian daun, terutama bagian bawah daun',
        'Lakukan penyemprotan pada pagi atau sore hari',
        'Ulangi aplikasi setiap 7-10 hari selama 3-4 kali'
      ],
      tips: [
        'Aplikasi saat cuaca tidak hujan untuk hasil optimal',
        'Gunakan APD (masker, sarung tangan) saat menyemprot',
        'Rotasi fungisida untuk mencegah resistensi'
      ]
    },
    {
      id: 2,
      type: 'prevention',
      category: 'Pencegahan',
      icon: '🛡️',
      title: 'Sanitasi Kebun',
      description: 'Lakukan pembersihan dan sanitasi kebun untuk mencegah penyebaran penyakit bercak daun.',
      steps: [
        'Buang dan musnahkan daun yang terinfeksi',
        'Pangkas cabang yang terlalu rapat untuk sirkulasi udara',
        'Bersihkan gulma di sekitar tanaman',
        'Atur jarak tanam yang cukup (minimal 3-4 meter)'
      ],
      tips: [
        'Bakar daun terinfeksi, jangan dikompos',
        'Sterilkan alat pangkas dengan alkohol 70%',
        'Lakukan sanitasi rutin setiap minggu'
      ]
    },
    {
      id: 3,
      type: 'maintenance',
      category: 'Perawatan',
      icon: '🌱',
      title: 'Perbaikan Kondisi Tanaman',
      description: 'Tingkatkan daya tahan tanaman melalui pemupukan dan perawatan yang tepat.',
      steps: [
        'Berikan pupuk NPK dengan perbandingan seimbang',
        'Tambahkan pupuk organic untuk memperbaiki struktur tanah',
        'Atur penyiraman agar tidak berlebihan',
        'Mulsa di sekitar batang untuk menjaga kelembaban'
      ],

      warning: 'Hindari pemupukan berlebihan yang dapat melemahkan daya tahan tanaman.'
    }
  ],
  
  "Hawar Daun": [
    {
      id: 4,
      type: 'treatment',
      category: 'Pengobatan',
      icon: '🩹',
      title: 'Pengendalian Hawar Daun',
      description: 'Aplikasi fungisida sistemik untuk mengendalikan hawar daun yang sudah menyerang.',
      steps: [
        'Gunakan fungisida sistemik berbahan aktif Metalaxyl atau Fosetyl-Al',
        'Semprotkan dengan konsentrasi 2-3 ml per liter air',
        'Fokus pada daun yang menunjukkan gejala awal',
        'Aplikasi setiap 5-7 hari hingga gejala terkendali'
      ],
      warning: 'Jangan aplikasi saat cuaca hujan atau angin kencang.'
    },
    {
      id: 5,
      type: 'prevention',
      category: 'Pencegahan',
      icon: '💧',
      title: 'Manajemen Air',
      description: 'Atur sistem penyiraman dan drainase untuk mencegah kondisi lembab berlebihan.',
      steps: [
        'Hindari penyiraman pada daun, siram hanya pada pangkal batang',
        'Pastikan drainase kebun berfungsi baik',
        'Kurangi frekuensi penyiraman saat musim hujan',
        'Gunakan sistem irigasi tetes jika memungkinkan'
      ],
      tips: [
        'Siram pada pagi hari agar tanaman kering saat malam',
        'Buat parit drainase di kebun yang sering tergenang',
        'Pantau kelembaban tanah dengan alat ukur'
      ]
    }
  ],
  
  "Karat Daun": [
    {
      id: 6,
      type: 'treatment',
      category: 'Pengobatan',
      icon: '🔬',
      title: 'Fungisida Anti-Karat',
      description: 'Penggunaan fungisida khusus untuk mengatasi penyakit karat daun pada pepaya.',
      steps: [
        'Pilih fungisida berbahan aktif Triazol (Propiconazole/Tebuconazole)',
        'Campurkan 1-2 ml per liter air',
        'Semprotkan hingga membasahi seluruh permukaan daun',
        'Ulangi setiap 10-14 hari sebanyak 3-4 kali'
      ],

      tips: [
        'Aplikasi saat kelembaban tinggi (pagi/sore)',
        'Perhatikan periode panen (PHI) sebelum aplikasi',
        'Rotasi dengan fungisida berbeda untuk mencegah resistensi'
      ]
    },
    {
      id: 7,
      type: 'prevention',
      category: 'Pencegahan',
      icon: '🌬️',
      title: 'Peningkatan Sirkulasi Udara',
      description: 'Perbaiki sirkulasi udara untuk mencegah kondisi yang mendukung perkembangan karat daun.',
      steps: [
        'Pangkas cabang dan daun yang terlalu rapat',
        'Atur jarak tanam minimal 4-5 meter antar pohon',
        'Buang tunas air dan cabang yang tidak produktif',
        'Kontrol gulma tinggi di sekitar tanaman'
      ]
    }
  ],
  
  "Busuk Batang": [
    {
      id: 8,
      type: 'treatment',
      category: 'Darurat',
      icon: '🚨',
      title: 'Penanganan Darurat Busuk Batang',
      description: 'Tindakan segera untuk menyelamatkan tanaman dari busuk batang yang parah.',
      steps: [
        'Potong bagian batang yang busuk hingga jaringan sehat',
        'Oleskan pasta fungisida tembaga pada luka potong',
        'Aplikasikan fungisida sistemik pada seluruh tanaman',
        'Perbaiki drainase di sekitar tanaman'
      ],

      warning: 'Sterilkan alat potong dengan alkohol 70% sebelum dan sesudah digunakan.'
    },
    {
      id: 9,
      type: 'prevention',
      category: 'Drainase',
      icon: '🏗️',
      title: 'Perbaikan Sistem Drainase',
      description: 'Perbaiki sistem drainase untuk mencegah genangan air yang memicu busuk batang.',
      steps: [
        'Buat saluran drainase di sekitar kebun',
        'Tinggikan bedengan tanaman pepaya',
        'Tambahkan bahan organik untuk memperbaiki porositas tanah',
        'Pasang mulsa untuk mengatur kelembaban tanah'
      ],

    }
  ],
  
  "Sehat": [
    {
      id: 10,
      type: 'maintenance',
      category: 'Optimalisasi',
      icon: '🏆',
      title: 'Peningkatan Kualitas Buah',
      description: 'Program perawatan untuk mengoptimalkan kualitas dan kuantitas buah pepaya yang sehat.',
      steps: [
        'Berikan pupuk khusus pembungaan dan pembuahan',
        'Lakukan pemangkasan cabang non-produktif',
        'Atur pengairan yang konsisten',
        'Aplikasi pupuk mikro untuk kualitas buah'
      ],

      tips: [
        'Pupuk kalium tinggi saat fase pembungaan',
        'Pangkas buah berlebihan untuk meningkatkan ukuran',
        'Panen buah pada tingkat kematangan optimal'
      ]
    },
    {
      id: 11,
      type: 'prevention',
      category: 'Pencegahan',
      icon: '🛡️',
      title: 'Program Pencegahan Penyakit',
      description: 'Tindakan pencegahan untuk mempertahankan kesehatan tanaman pepaya.',
      steps: [
        'Monitoring rutin setiap minggu',
        'Aplikasi fungisida preventif sebulan sekali',
        'Sanitasi kebun secara berkala',
        'Rotasi dengan tanaman penutup tanah'
      ],

    }
  ]
}

// Update recommendations based on selected detection
function updateRecommendations() {
  if (selectedDetectionIndex.value === '') {
    selectedDetection.value = null
    currentRecommendations.value = []
    return
  }
  
  loading.value = true
  
  // Simulate loading time
  setTimeout(() => {
    selectedDetection.value = detectionHistory.value[selectedDetectionIndex.value]
    const disease = selectedDetection.value.className
    currentRecommendations.value = recommendationsData[disease] || []
    loading.value = false
  }, 500)
}

// Export recommendations
function exportRecommendations() {
  if (!selectedDetection.value || currentRecommendations.value.length === 0) return
  
  const disease = selectedDetection.value.className
  const confidence = (selectedDetection.value.probability * 100).toFixed(1)
  const timestamp = new Date().toLocaleString('id-ID')
  
  let exportText = `REKOMENDASI PENANGANAN TANAMAN PEPAYA\n`
  exportText += `================================================\n\n`
  exportText += `Kondisi: ${disease}\n`
  exportText += `Tingkat Kepercayaan: ${confidence}%\n`
  exportText += `Tanggal Export: ${timestamp}\n\n`
  
  currentRecommendations.value.forEach((rec, index) => {
    exportText += `${index + 1}. ${rec.title}\n`
    exportText += `Kategori: ${rec.category}\n`
    exportText += `Deskripsi: ${rec.description}\n`
    
    if (rec.steps) {
      exportText += `Langkah-langkah:\n`
      rec.steps.forEach((step, i) => {
        exportText += `   ${i + 1}. ${step}\n`
      })
    }
  
    if (rec.tips) {
      exportText += `Tips:\n`
      rec.tips.forEach(tip => {
        exportText += `   - ${tip}\n`
      })
    }
    
    if (rec.warning) {
      exportText += `⚠️ Perhatian: ${rec.warning}\n`
    }
    
    exportText += `\n`
  })
  
  const blob = new Blob([exportText], { type: 'text/plain;charset=utf-8' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `rekomendasi-${disease}-${new Date().toISOString().split('T')[0]}.txt`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  Swal.fire({
    icon: 'success',
    title: 'Export Berhasil!',
    text: 'File rekomendasi telah diunduh',
    timer: 2000,
    showConfirmButton: false
  })
}

// Share recommendations
function shareRecommendations() {
  if (!selectedDetection.value) return
  
  const disease = selectedDetection.value.className
  const confidence = (selectedDetection.value.probability * 100).toFixed(1)
  
  const shareText = `🌿 REKOMENDASI PENANGANAN PEPAYA\n\nKondisi: ${disease}\nTingkat Kepercayaan: ${confidence}%\n\nDapatkan rekomendasi lengkap di aplikasi Smart Farm!`
  
  if (navigator.share) {
    navigator.share({
      title: 'Rekomendasi Penanganan Tanaman Pepaya',
      text: shareText
    }).then(() => {
      console.log('Shared successfully')
    }).catch((error) => {
      console.error('Error sharing:', error)
      fallbackShare(shareText)
    })
  } else {
    fallbackShare(shareText)
  }
}

function fallbackShare(text) {
  navigator.clipboard.writeText(text).then(() => {
    Swal.fire({
      icon: 'success',
      title: 'Disalin!',
      text: 'Teks rekomendasi telah disalin ke clipboard',
      timer: 2000,
      showConfirmButton: false
    })
  }).catch(() => {
    Swal.fire({
      icon: 'info',
      title: 'Share Manual',
      html: `<textarea readonly style="width:100%;height:150px;resize:none;">${text}</textarea>`,
      confirmButtonText: 'OK'
    })
  })
}

// Lifecycle
onMounted(() => {
  loadDetectionHistory()
})
</script>

<style scoped>
.rekomendasi-page-container {
  padding: 20px;
  background-color: #f0f2f5;
  min-height: calc(100vh - 60px);
  max-width: 1200px;
  margin: 0 auto;
}

.header-section {
  text-align: center;
  margin-bottom: 30px;
  background: linear-gradient(135deg, #27ae60, #2ecc71);
  padding: 30px 20px;
  border-radius: 20px;
  box-shadow: 0 8px 25px rgba(39, 174, 96, 0.3);
  color: white;
}

.header-section h1 {
  font-size: 2.5rem;
  margin-bottom: 15px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.header-section p {
  font-size: 1.1rem;
  margin: 8px 0;
  opacity: 0.95;
}

/* Detection Selector */
.detection-selector {
  margin-bottom: 30px;
}

.selector-card {
  background: white;
  padding: 25px;
  border-radius: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.selector-card h3 {
  color: #333;
  margin-bottom: 20px;
  font-size: 1.3rem;
}

.no-history {
  text-align: center;
  padding: 30px;
  color: #666;
}

.scan-link {
  display: inline-block;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  text-decoration: none;
  padding: 12px 25px;
  border-radius: 10px;
  margin-top: 15px;
  font-weight: 600;
  transition: transform 0.2s ease;
}

.scan-link:hover {
  transform: translateY(-2px);
}

.history-dropdown {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.history-dropdown label {
  font-weight: 600;
  color: #333;
  min-width: 150px;
}

.history-dropdown select {
  flex: 1;
  min-width: 300px;
  padding: 12px 15px;
  border: 2px solid #e9ecef;
  border-radius: 10px;
  font-size: 1rem;
  background: white;
  cursor: pointer;
  transition: border-color 0.3s ease;
}

.history-dropdown select:focus {
  outline: none;
  border-color: #27ae60;
  box-shadow: 0 0 0 3px rgba(39, 174, 96, 0.1);
}

/* Loading */
.loading-message {
  text-align: center;
  padding: 50px;
  color: #666;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
}

.loading-spinner {
  width: 30px;
  height: 30px;
  border: 3px solid #e9ecef;
  border-top-color: #27ae60;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* No Selection */
.no-selection {
  text-align: center;
  padding: 50px;
}

.no-selection-card {
  background: white;
  padding: 40px;
  border-radius: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  margin: 0 auto;
}

.no-selection-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.no-selection-card h3 {
  color: #333;
  margin-bottom: 15px;
  font-size: 1.5rem;
}

.no-selection-card p {
  color: #666;
  line-height: 1.6;
}

/* Recommendations Grid */
.recommendations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 25px;
}

.rekomendasi-card {
  background: white;
  border-radius: 20px;
  padding: 25px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.rekomendasi-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.treatment-card {
  border-left: 5px solid #e74c3c;
}

.prevention-card {
  border-left: 5px solid #f39c12;
}

.maintenance-card {
  border-left: 5px solid #27ae60;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f8f9fa;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.card-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.card-header h2 {
  color: #333;
  font-size: 1.4rem;
  margin: 0;
  line-height: 1.3;
}

.purpose-tag {
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

.card-content {
  color: #555;
}

.description {
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 20px;
  color: #666;
}

/* Sections */
.steps-section,
.ingredients-section,
.tips-section,
.warning-section {
  margin-bottom: 20px;
}

.steps-section h4,
.ingredients-section h4,
.tips-section h4,
.warning-section h4 {
  color: #333;
  font-size: 1.1rem;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.steps-list {
  padding-left: 20px;
  margin: 0;
}

.steps-list li {
  margin-bottom: 8px;
  line-height: 1.5;
  color: #555;
  text-align: left;
}

.ingredients-list,
.tips-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.ingredients-list li,
.tips-list li {
  padding: 8px 0;
  border-bottom: 1px solid #f1f1f1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ingredients-list li:last-child,
.tips-list li:last-child {
  border-bottom: none;
}

.ingredient-price {
  color: #27ae60;
  font-weight: 600;
  font-size: 0.9rem;
}

.warning-section {
  background: #fff3cd;
  padding: 15px;
  border-radius: 10px;
  border-left: 4px solid #ffc107;
}

.warning-text {
  margin: 0;
  color: #856404;
  font-weight: 500;
}

/* Quick Actions */
.quick-actions {
  margin-top: 40px;
  background: white;
  padding: 25px;
  border-radius: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.quick-actions h3 {
  color: #333;
  margin-bottom: 20px;
  font-size: 1.3rem;
}

.action-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
}

.action-btn {
  padding: 12px 25px;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 150px;
  justify-content: center;
}

.export-btn {
  background: linear-gradient(135deg, #17a2b8, #138496);
  color: white;
}

.share-btn {
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
}

.scan-btn {
  background: linear-gradient(135deg, #6f42c1, #5a32a3);
  color: white;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

/* Responsive Design */
@media (max-width: 768px) {
  .rekomendasi-page-container {
    padding: 15px;
  }
  
  .header-section {
    padding: 20px 15px;
  }
  
  .header-section h1 {
    font-size: 2rem;
  }
  
  .selector-card {
    padding: 20px;
  }
  
  .history-dropdown {
    flex-direction: column;
    align-items: stretch;
  }
  
  .history-dropdown label {
    min-width: auto;
    margin-bottom: 8px;
  }
  
  .history-dropdown select {
    min-width: auto;
    width: 100%;
  }
  
  .recommendations-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .rekomendasi-card {
    padding: 20px;
  }
  
  .card-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
  
  .card-title {
    width: 100%;
  }
  
  .purpose-tag {
    align-self: flex-start;
  }
  
  .action-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .action-btn {
    width: 100%;
    max-width: 250px;
  }
}

@media (max-width: 480px) {
  .header-section h1 {
    font-size: 1.8rem;
  }
  
  .header-section p {
    font-size: 1rem;
  }
  
  .card-icon {
    font-size: 1.5rem;
  }
  
  .card-header h2 {
    font-size: 1.2rem;
  }
  
  .no-selection-icon {
    font-size: 3rem;
  }
  
  .no-selection-card {
    padding: 30px 20px;
  }
  
  .steps-list {
    padding-left: 15px;
  }
  
  .ingredients-list li,
  .tips-list li {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
  
  .ingredient-price {
    align-self: flex-end;
  }
}

/* Animation for cards */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.rekomendasi-card {
  animation: fadeInUp 0.5s ease-out;
}

.rekomendasi-card:nth-child(1) { animation-delay: 0.1s; }
.rekomendasi-card:nth-child(2) { animation-delay: 0.2s; }
.rekomendasi-card:nth-child(3) { animation-delay: 0.3s; }
.rekomendasi-card:nth-child(4) { animation-delay: 0.4s; }

/* Focus states for accessibility */
.history-dropdown select:focus,
.action-btn:focus {
  outline: 3px solid rgba(39, 174, 96, 0.3);
  outline-offset: 2px;
}

/* Print styles */
@media print {
  .quick-actions,
  .detection-selector {
    display: none;
  }
  
  .rekomendasi-card {
    break-inside: avoid;
    box-shadow: none;
    border: 1px solid #ddd;
  }
  
  .recommendations-grid {
    grid-template-columns: 1fr;
  }
}
</style>