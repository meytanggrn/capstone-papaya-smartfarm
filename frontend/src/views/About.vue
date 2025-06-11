<template>
  <div class="rekomendasi-page-container">
    <div class="header-section">
      <h1>Papaya SmartFarm</h1>
        <p>Platform digital berbasis website yang dirancang untuk merevolusi cara petani mengelola perkebunan pepaya. Dengan mengintegrasikan teknologi Internet of Things (IoT), Artificial Intelligence (AI), dan analisis data, platform ini berfungsi sebagai asisten pertanian digital yang menyediakan pemantauan lahan secara real-time, prediksi hasil panen yang akurat, dan deteksi dini penyakit tanaman.</p> 
  
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

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