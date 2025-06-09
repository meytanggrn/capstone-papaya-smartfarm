<template>
  <form @submit.prevent="submitLahan" enctype="multipart/form-data">
    <input v-model="nama" type="text" placeholder="Nama lahan" required />
    <!-- Tampilkan peta -->
    <div id="map" style="height: 300px; margin-bottom:1rem;"></div>
    <input v-model="latitude" type="number" step="any" placeholder="Latitude" readonly required />
    <input v-model="longitude" type="number" step="any" placeholder="Longitude" readonly required />
    <input @change="onFileChange" type="file" accept="image/*" required />
    <button type="submit">Simpan</button>
    <p v-if="error">{{ error }}</p>
    <img v-if="preview" :src="preview" alt="preview" width="150"/>
  </form>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import L from 'leaflet'
import axios from 'axios'

const nama = ref('')
const latitude = ref('')
const longitude = ref('')
const foto = ref(null)
const preview = ref('')
const error = ref('')

const onFileChange = (e) => {
  foto.value = e.target.files[0]
  preview.value = URL.createObjectURL(e.target.files[0])
}

onMounted(() => {
  // Set default center (Indonesia)
  const map = L.map('map').setView([-2.5, 118], 5)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map)

  let marker = null

  map.on('click', function(e) {
    latitude.value = e.latlng.lat
    longitude.value = e.latlng.lng
    // Pasang marker di lokasi klik
    if (marker) {
      marker.setLatLng(e.latlng)
    } else {
      marker = L.marker(e.latlng).addTo(map)
    }
  })
})

const submitLahan = async () => {
  try {
    const formData = new FormData()
    formData.append('nama', nama.value)
    formData.append('latitude', latitude.value)
    formData.append('longitude', longitude.value)
    formData.append('foto', foto.value)

    const token = localStorage.getItem('token')
    await axios.post(
      'http://localhost:5000/api/lahan',
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    )
    nama.value = ''
    latitude.value = ''
    longitude.value = ''
    foto.value = null
    preview.value = ''
    error.value = ''
    alert('Lahan berhasil ditambah!')
  } catch (e) {
    error.value = e.response?.data?.error || 'Gagal input lahan'
  }
}
</script>
