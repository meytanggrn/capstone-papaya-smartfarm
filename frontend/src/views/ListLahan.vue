<template>
  <div>
    <h3>Daftar Lahan</h3>
    <ul>
      <li v-for="lahan in dataLahan" :key="lahan.id">
        {{ lahan.nama }} ({{ lahan.longitude }}, {{ lahan.latitude }})
        <img v-if="lahan.foto" :src="`http://localhost:5000/uploads/${lahan.foto}`" width="100" />
      </li>
    </ul>
    <p v-if="error">{{ error }}</p>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const dataLahan = ref([])
const error = ref('')

onMounted(async () => {
  try {
    const token = localStorage.getItem('token')
    const res = await axios.get('http://localhost:5000/api/lahan', {
      headers: { Authorization: `Bearer ${token}` }
    })
    dataLahan.value = res.data
  } catch (e) {
    error.value = e.response?.data?.error || 'Gagal ambil data'
  }
})
</script>
