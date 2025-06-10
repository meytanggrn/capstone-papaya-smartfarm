<template>
  <div class="scan-layout">
    <div class="scan-card">
      <h1>Unggah Foto Daun Pepaya</h1>
      <p>Pilih foto dari galeri atau ambil langsung dengan kamera untuk mendeteksi kemungkinan penyakit.</p>
      
      <input type="file" accept="image/*" @change="onFileChange" /> 
      
      <div v-if="fotoFile" class="image-preview-container">
        <h4>Foto terpilih:</h4>
        <img :src="imagePreviewUrl" alt="Foto Daun Pepaya" class="image-preview" />
        <p class="file-name">{{ fotoFile.name }}</p>
      </div>

      <button class="btn-photo" :disabled="!fotoFile || loading" @click="submitDeteksi">
        <span v-if="loading">
          <span class="spinner"></span> Mengupload...
        </span>
        <span v-else>
          Photo 
          </span>
      </button>
      <div v-if="error" class="error-message">{{ error }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'; 
import { useRouter } from 'vue-router'; 
import axios from 'axios'; 

const apiUrl = 'http://localhost:5000'; 
const router = useRouter(); 
const fotoFile = ref(null); 
const imagePreviewUrl = ref(null); // Variabel reaktif untuk URL preview gambar
const error = ref(''); 
const loading = ref(false); 

const onFileChange = e => {
  const file = e.target.files[0]; 
  if (file) {
    fotoFile.value = file; 
    error.value = ''; 

    // Membuat URL sementara untuk preview gambar di browser
    const reader = new FileReader();
    reader.onload = (event) => {
      imagePreviewUrl.value = event.target.result; // Set URL preview
    };
    reader.readAsDataURL(file); // Baca file sebagai URL data
  } else {
    // Jika tidak ada file yang dipilih, reset semua
    fotoFile.value = null;
    imagePreviewUrl.value = null;
  }
};

const submitDeteksi = async () => {
  if (!fotoFile.value) {
    error.value = 'Mohon pilih foto terlebih dahulu.';
    return;
  }

  error.value = ''; 
  loading.value = true; 

  try {
    const formData = new FormData(); 
    formData.append('foto', fotoFile.value); 

    // Mengirim placeholder data awal ke backend.
    // 'nama_penyakit', 'deskripsi', 'catatan' akan diupdate oleh backend setelah proses ML
    formData.append('status', 'Terdeteksi'); 
    formData.append('nama_penyakit', '-'); 
    formData.append('deskripsi', '-');
    formData.append('catatan', '-');

    // Mengirim request POST ke API backend untuk menyimpan data deteksi awal
    const { data } = await axios.post(`${apiUrl}/api/deteksi`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' } // Penting untuk pengiriman file
    });
    
    setTimeout(() => {
      loading.value = false; 
      // Mengarahkan user ke halaman detail deteksi dengan ID yang diterima dari backend
      router.replace({ path: '/deteksi/detail', query: { id: data.id } });
    }, 400); // Delay 400ms

  } catch (e) {
    loading.value = false; 
    console.error('Error saat upload deteksi:', e);
    error.value = e.response?.data?.error || 'Gagal mengupload foto. Mohon coba lagi.';
  }
};
</script>

<style scoped>
.scan-layout {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 60px); 
  background-color: #f0f2f5;
  padding: 20px;
}

.scan-card {
  background-color: #ffffff;
  padding: 40px;
  border-radius: 15px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1); 
  text-align: center;
  max-width: 500px;
  width: 100%;
}

h1 {
  color: #333;
  margin-bottom: 15px;
  font-size: 2rem;
}

p {
  color: #666;
  margin-bottom: 30px;
  font-size: 1.1rem;
}

input[type="file"] {
  display: block;
  margin: 0 auto 25px auto;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
  width: calc(100% - 24px); 
  cursor: pointer;
  font-size: 1rem;
}

.image-preview-container {
  margin-bottom: 25px;
  border: 1px dashed #ccc; 
  border-radius: 10px;
  background-color: #fcfcfc;
}

.image-preview-container h4 {
  color: #555;
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 1.1rem;
}

.image-preview {
  max-width: 100%;
  max-height: 250px;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 10px;
}

.file-name {
  font-size: 0.9rem;
  color: #777;
  word-break: break-all;
}

.btn-photo {
  background-color: #4A7374; 
  color: white;
  padding: 12px 30px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: bold;
  transition: background-color 0.3s ease; 
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-photo:hover:not(:disabled) {
  background-color: #3e606a;
}

.btn-photo[disabled] {
  background-color: #cccccc;
  cursor: not-allowed;
  opacity: 0.7;
}

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

.error-message {
  color: #dc3545; 
  margin-top: 15px;
  font-weight: bold;
}
</style>