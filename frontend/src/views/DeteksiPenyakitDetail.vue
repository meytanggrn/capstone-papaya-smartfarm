<template>
  <div class="detail-disease-layout">
    <button class="back-btn" @click="goBack"><span class="back-icon">‹</span></button>
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
          <span>{{ diseaseData.title || '-' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

const apiUrl = 'http://localhost:5000'
const route = useRoute()
const router = useRouter()
const diseaseData = ref({})
const loading = ref(true)
const error = ref('')
const diseaseDataFoto = ref('')
const goBack = () => router.back()
onMounted(async () => {
  loading.value = true
  try {
    const res = await axios.get(`${apiUrl}/api/deteksi/${route.params.id}`)
    diseaseData.value = res.data
    diseaseDataFoto.value = res.data.image_url
      ? `${apiUrl}${res.data.image_url}`
      : '/default.png'
    loading.value = false
  } catch (e) {
    error.value = 'Gagal mengambil data'
    loading.value = false
  }
})
</script>
