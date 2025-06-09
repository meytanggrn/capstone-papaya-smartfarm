<template>
  <div class="scan-layout">
    <div class="scan-card">
      <input type="file" accept="image/*" @change="onFileChange" capture="environment" />
      <button class="btn-photo" :disabled="!fotoFile || loading" @click="submitDeteksi">
        <span v-if="loading">
          <span class="spinner"></span> Mengupload...
        </span>
        <span v-else>
          Photo <img src="#" width="22" style="margin-left:8px;" />
        </span>
      </button>
      <div v-if="error" style="color:red;margin-top:8px">{{ error }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const apiUrl = 'http://localhost:5000'
const router = useRouter()
const fotoFile = ref(null)
const error = ref('')
const loading = ref(false)

const onFileChange = e => {
  fotoFile.value = e.target.files[0]
}

const submitDeteksi = async () => {
  if (!fotoFile.value) return
  error.value = ''
  loading.value = true
  try {
    const formData = new FormData()
    formData.append('foto', fotoFile.value)
    formData.append('status', 'Terdeteksi')
    formData.append('nama_penyakit', '-')
    formData.append('deskripsi', '-')
    formData.append('catatan', '-')
    const { data } = await axios.post(`${apiUrl}/api/deteksi`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    setTimeout(() => {
      loading.value = false
      router.replace({ path: '/deteksi/detail', query: { id: data.id } })
    }, 400)
  } catch (e) {
    loading.value = false
    error.value = e.response?.data?.error || 'Gagal upload'
  }
}
</script>

<style scoped>
/* ...style lain tetap... */
.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #00b88e;
  border-radius: 50%;
  width: 17px;
  height: 17px;
  display: inline-block;
  margin-right: 10px;
  animation: spin 1s linear infinite;
  vertical-align: middle;
}
@keyframes spin {
  0% { transform: rotate(0deg);}
  100% { transform: rotate(360deg);}
}
.btn-photo[disabled] {
  opacity: 0.7;
  pointer-events: none;
}
</style>
