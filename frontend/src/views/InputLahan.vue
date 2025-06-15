<template>
  <h2>Input Data Lahan</h2>
  <form @submit.prevent="submitLahan" enctype="multipart/form-data">
    <div class="form-grid">
      <!-- KIRI -->
      <div class="form-left">
        <label>Nama Lahan</label>
        <input v-model="nama" type="text" placeholder="Nama lahan" required />
        <label>Latitude</label>
        <input v-model="latitude" type="number" step="any" placeholder="Latitude" readonly required />
        <label>Longitude</label>
        <input v-model="longitude" type="number" step="any" placeholder="Longitude" readonly required />
        <label>Foto Lahan</label>
        <input @change="onFileChange" type="file" accept="image/*" required />
      </div>
      <!-- KANAN -->
      <div class="form-right">
        <label>Pilih Titik Lokasi di Peta</label>
        <div id="map"></div>
        <img v-if="preview" :src="preview" alt="preview" />
      </div>
    </div>
    <button type="submit">Simpan</button>
    <p v-if="error">{{ error }}</p>
  </form>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import L from 'leaflet'
import axios from 'axios'
import Swal from 'sweetalert2'

const nama = ref('')
const latitude = ref('')
const longitude = ref('')
const foto = ref(null)
const preview = ref('')
const error = ref('')
const router = useRouter()

const onFileChange = (e) => {
  foto.value = e.target.files[0]
  preview.value = URL.createObjectURL(e.target.files[0])
}

onMounted(() => {
  const blotongan = { lat: -7.323768, lng: 110.501556 };
  const map = L.map('map').setView([blotongan.lat, blotongan.lng], 15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  let marker = L.marker([blotongan.lat, blotongan.lng]).addTo(map);
  marker.bindPopup("Blotongan, Salatiga").openPopup();

  latitude.value = blotongan.lat;
  longitude.value = blotongan.lng;

  map.on('click', function(e) {
    latitude.value = e.latlng.lat;
    longitude.value = e.latlng.lng;
    marker.setLatLng(e.latlng);
    marker.closePopup();
  });
});

const submitLahan = async () => {
  error.value = ''
  try {
    const formData = new FormData()
    formData.append('nama', nama.value)
    formData.append('latitude', latitude.value)
    formData.append('longitude', longitude.value)
    formData.append('foto', foto.value)

    const token = localStorage.getItem('token')
    const response = await axios.post(
      'https://backend-papaya-production.up.railway.app/api/lahan',
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


    Swal.fire({
      icon: 'success',
      title: 'Lahan berhasil ditambahkan!',
      showConfirmButton: false,
      timer: 1400,
      timerProgressBar: true,
      willClose: () => {
        router.push('/dashboard')
      }
    })
  } catch (e) {
    console.error('Error submit lahan:', e)
    error.value = e.response?.data?.error || 'Gagal input lahan'
  }
}
</script>


<style scoped>
form {
  background: #fff;
  border-radius: 18px;
  max-width: 670px;
  margin: 48px auto 0 auto;
  padding: 36px 38px 28px 38px;
  box-shadow: 0 4px 22px #b4edd249, 0 1.5px 9px #b5c4d820;
  display: flex;
  flex-direction: column;
  gap: 22px;
}

h2 {
  text-align: center;
  font-size: 2rem;
  margin-bottom: 20px;
  color: #12b37e;
  letter-spacing: 0.7px;
}

.form-grid {
  display: flex;
  gap: 22px;
}

.form-left,
.form-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 17px;
}

form input[type="text"],
form input[type="number"],
form input[type="file"] {
  border: 1.5px solid #bfe6de;
  padding: 13px 14px;
  border-radius: 8px;
  font-size: 1rem;
  background: #f8fcfc;
  outline: none;
  transition: border 0.22s;
  margin-bottom: 6px;
}

form input[type="text"]:focus,
form input[type="number"]:focus {
  border-color: #22b573;
}

form label {
  font-size: 1.03rem;
  color: #2a3b38;
  margin-bottom: 2px;
  font-weight: 500;
}

form button {
  background: linear-gradient(90deg, #22b573, #12b37e 80%);
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 15px 0;
  font-size: 1.17rem;
  font-weight: 600;
  box-shadow: 0 2px 13px #b4edd2b0;
  cursor: pointer;
  transition: background 0.18s, transform 0.14s;
  margin-top: 10px;
  letter-spacing: 0.4px;
}
form button:active { background: #10a96c; transform: scale(0.97); }

form p {
  color: #ef4444;
  font-size: 0.97rem;
  margin-top: -8px;
  text-align: center;
}

#map {
  width: 300px;
  height: 400px;
  border-radius: 12px;
  box-shadow: 0 2px 14px #b4edd277;
  margin-bottom: 8px;
  margin-top: 5px;
}

form img[alt="preview"] {
  margin-top: 9px;
  border-radius: 12px;
  box-shadow: 0 2px 10px #b4edd2b7;
  max-width: 96%;
  display: block;
  margin-left: auto;
  margin-right: auto;
  border: 1.5px solid #d2f5ee;
}

/* Responsive: mobile, kolom jadi satu */
@media (max-width: 700px) {
  form {
    padding: 14px 3vw;
    max-width: 99vw;
    box-shadow: 0 1px 8px #b4edd2b0;
    gap: 13px;
  }
  .form-grid {
    flex-direction: column;
    gap: 10px;
  }
  h2 { font-size: 1.33rem; }
}


</style>