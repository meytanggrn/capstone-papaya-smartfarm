<template>
  <div class="about-page-container">
    <!-- Hero Section -->
    <div class="hero-section">
      <div class="hero-content">
        <div class="hero-text">
          <h1 class="hero-title">
            <span class="highlight">🌿 Papaya</span> SmartFarm
          </h1>
          <p class="hero-subtitle">
            Revolusi Digital untuk Perkebunan Pepaya Modern
          </p>
          <p class="hero-description">
            Platform digital berbasis website yang dirancang untuk merevolusi cara petani mengelola perkebunan pepaya. 
            Dengan mengintegrasikan teknologi Internet of Things (IoT), Artificial Intelligence (AI), dan analisis data, 
            platform ini berfungsi sebagai asisten pertanian digital yang menyediakan pemantauan lahan secara real-time, 
            prediksi hasil panen yang akurat, dan deteksi dini penyakit tanaman.
          </p>
          <div class="hero-stats">
            <div class="stat-item">
              <div class="stat-number">95%</div>
              <div class="stat-label">Akurasi Deteksi</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">24/7</div>
              <div class="stat-label">Monitoring</div>
            </div>
          </div>
        </div>
        <div class="hero-visual">
          <div class="floating-cards">
            <div class="feature-card card-1">
              <div class="card-icon">🌡️</div>
              <div class="card-text">Sensor Suhu</div>
            </div>
            <div class="feature-card card-2">
              <div class="card-icon">💧</div>
              <div class="card-text">Kelembaban</div>
            </div>
            <div class="feature-card card-3">
              <div class="card-icon">🔍</div>
              <div class="card-text">AI Detection</div>
            </div>
            <div class="feature-card card-4">
              <div class="card-icon">📊</div>
              <div class="card-text">Analytics</div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import Swal from 'sweetalert2'


// Benefits data
const benefits = ref([
  {
    id: 1,
    icon: '📈',
    title: 'Peningkatan Produktivitas',
    description: 'Optimasi hasil panen melalui monitoring dan analisis data yang akurat',
    metrics: [
      { value: '35%', label: 'Peningkatan Hasil' },
      { value: '25%', label: 'Efisiensi Biaya' }
    ]
  },
  {
    id: 2,
    icon: '🛡️',
    title: 'Deteksi Dini Penyakit',
    description: 'Identifikasi penyakit lebih cepat untuk pencegahan yang efektif',
    metrics: [
      { value: '95%', label: 'Akurasi Deteksi' },
      { value: '50%', label: 'Pengurangan Kerugian' }
    ]
  },
  {
    id: 3,
    icon: '⏰',
    title: 'Efisiensi Waktu',
    description: 'Otomasi monitoring menghemat waktu untuk fokus pada hal penting',
    metrics: [
      { value: '60%', label: 'Penghematan Waktu' },
      { value: '24/7', label: 'Monitoring' }
    ]
  }
])

// Team members
const teamMembers = ref([
  {
    id: 1,
    name: 'Dr. Ahmad Wijaya',
    role: 'Lead Developer & AI Specialist',
    initial: 'AW',
    description: 'Ahli dalam machine learning dan computer vision dengan pengalaman 10+ tahun',
    skills: ['Machine Learning', 'Computer Vision', 'Python', 'TensorFlow']
  },
  {
    id: 2,
    name: 'Sarah Fitri, S.P.',
    role: 'Agricultural Expert',
    initial: 'SF',
    description: 'Pakar pertanian dengan spesialisasi penyakit tanaman dan nutrisi tanaman',
    skills: ['Plant Pathology', 'Crop Management', 'Sustainable Agriculture']
  },
  {
    id: 3,
    name: 'Budi Santoso',
    role: 'IoT Engineer',
    initial: 'BS',
    description: 'Engineer berpengalaman dalam sistem IoT dan sensor networks',
    skills: ['IoT Systems', 'Embedded Systems', 'MQTT', 'Sensor Networks']
  },
  {
    id: 4,
    name: 'Lisa Chen',
    role: 'Frontend Developer',
    initial: 'LC',
    description: 'UI/UX developer dengan fokus pada user experience dan responsive design',
    skills: ['Vue.js', 'UI/UX Design', 'Responsive Web', 'PWA']
  }
])

// Remove submit function as contact form is removed
</script>

<style scoped>
.about-page-container {
  background: #f8f9fa;
  min-height: 100vh;
}

/* Hero Section */
.hero-section {
  background: white;
  padding: 80px 30px;
  color: white;
  position: relative;
  overflow: hidden;
}

.hero-content {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 800;
  margin-bottom: 20px;
  line-height: 1.2;
  color:#27ae60;
}

.highlight {
  background: linear-gradient(45deg, #ffd700, #ffed4e);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 20px;
  opacity: 0.9;
  color:#333;
}

.hero-description {
  color:#333;
  font-size: 1.1rem;
  line-height: 1.8;
  margin-bottom: 40px;
  opacity: 0.85;
}

.hero-stats {
  display: flex;
  gap: 40px;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 800;
  color: #ffd700;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.8;
  margin-top: 5px;
  color:#333;
}

/* Floating Cards */
.floating-cards {
  position: relative;
  height: 400px;
}

.feature-card {
  position: absolute;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 15px;
  padding: 20px;
  text-align: center;
  animation: float 6s ease-in-out infinite;
  color:#333;
}

.card-1 { top: 20px; left: 20px; animation-delay: 0s; }
.card-2 { top: 50px; right: 30px; animation-delay: 1.5s; }
.card-3 { bottom: 80px; left: 40px; animation-delay: 3s; }
.card-4 { bottom: 20px; right: 20px; animation-delay: 4.5s; }

.card-icon {
  font-size: 2rem;
  margin-bottom: 10px;
}

.card-text {
  font-size: 0.9rem;
  font-weight: 600;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}

/* Sections */
.benefits-section,
.team-section {
  padding: 80px 30px;
  max-width: 1200px;
  margin: 0 auto;
}

.section-header {
  text-align: center;
  margin-bottom: 60px;
}

.section-header h2 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 15px;
}

.section-header p {
  font-size: 1.2rem;
  color: #666;
  max-width: 600px;
  margin: 0 auto;
}

/* Features Grid */
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
}

.feature-item {
  background: white;
  padding: 40px 30px;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  text-align: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.feature-item:hover {
  transform: translateY(-10px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.feature-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  margin: 0 auto 20px;
  color: white;
}

.feature-item h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 15px;
}

.feature-item p {
  color: #666;
  line-height: 1.6;
  margin-bottom: 20px;
}

.feature-benefits {
  list-style: none;
  padding: 0;
  margin: 0;
}

.feature-benefits li {
  padding: 8px 0;
  color: #555;
  border-bottom: 1px solid #f1f1f1;
}

.feature-benefits li:before {
  content: '✓';
  color: #27ae60;
  font-weight: bold;
  margin-right: 10px;
}

/* Responsive Design */
@media (max-width: 968px) {
  .hero-content,
  .footer-content {
    grid-template-columns: 1fr;
    gap: 40px;
  }
  
  .hero-title {
    font-size: 2.5rem;
  }
  
  .hero-stats {
    justify-content: center;
  }
  
  .benefit-metrics {
    justify-content: center;
  }
  
  .footer-links {
    flex-direction: column;
    gap: 30px;
  }
}

@media (max-width: 768px) {
  .benefits-section,
  .team-section {
    padding: 60px 20px;
  }
  
  .hero-section {
    padding: 60px 20px;
  }
  
  .section-header h2 {
    font-size: 2rem;
  }
  
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-subtitle {
    font-size: 1.2rem;
  }
  
  .benefits-grid,
  .team-grid {
    grid-template-columns: 1fr;
  }
  
  .floating-cards {
    height: 300px;
  }
  
  .feature-card {
    position: static;
    margin-bottom: 15px;
    animation: none;
  }
  
  .hero-stats {
    flex-direction: column;
    gap: 20px;
    align-items: center;
  }
}

@media (max-width: 480px) {
  .hero-section,
  .benefits-section,
  .team-section {
    padding: 40px 15px;
  }
  
  .hero-title {
    font-size: 1.8rem;
  }
  
  .section-header h2 {
    font-size: 1.8rem;
  }
  
  .benefit-card,
  .team-member {
    padding: 25px 20px;
  }
  
  .footer-section {
    padding: 40px 15px 15px;
  }
}-links {
    flex-direction: column;
    gap: 30px;
  }


@media (max-width: 768px) {
  .features-section,
  .technology-section,
  .how-it-works-section,
  .benefits-section,
  .team-section {
    padding: 60px 20px;
  }
  
  .hero-section,
  .contact-section {
    padding: 60px 20px;
  }
  
  .section-header h2 {
    font-size: 2rem;
  }
  
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-subtitle {
    font-size: 1.2rem;
  }
  
  .features-grid,
  .tech-grid,
  .benefits-grid,
  .team-grid {
    grid-template-columns: 1fr;
  }
  
  .floating-cards {
    height: 300px;
  }
  
  .feature-card {
    position: static;
    margin-bottom: 15px;
    animation: none;
  }
  
  .hero-stats {
    flex-direction: column;
    gap: 20px;
    align-items: center;
  }
  
  .contact-form {
    padding: 30px 20px;
  }
}

@media (max-width: 480px) {
  .hero-section,
  .contact-section,
  .features-section,
  .technology-section,
  .how-it-works-section,
  .benefits-section,
  .team-section {
    padding: 40px 15px;
  }
  
  .hero-title {
    font-size: 1.8rem;
  }
  
  .section-header h2 {
    font-size: 1.8rem;
  }
  
  .feature-item,
  .tech-category,
  .benefit-card,
  .team-member {
    padding: 25px 20px;
  }
  
  .step-content {
    padding: 25px 15px;
  }
  
  .step-number {
    width: 50px;
    height: 50px;
    font-size: 1.2rem;
  }
  
  .contact-form {
    padding: 25px 15px;
  }
  
  .footer-section {
    padding: 40px 15px 15px;
  }
}

/* Animation delays for staggered effect */
.benefit-card:nth-child(1) { animation-delay: 0.1s; }
.benefit-card:nth-child(2) { animation-delay: 0.2s; }
.benefit-card:nth-child(3) { animation-delay: 0.3s; }

.team-member:nth-child(1) { animation-delay: 0.1s; }
.team-member:nth-child(2) { animation-delay: 0.2s; }
.team-member:nth-child(3) { animation-delay: 0.3s; }
.team-member:nth-child(4) { animation-delay: 0.4s; }

/* Scroll animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.benefit-card,
.team-member {
  animation: fadeInUp 0.6s ease-out both;
}

/* Focus states for accessibility */
.link-group a:focus {
  outline: 2px solid #2ecc71;
  outline-offset: 2px;
  border-radius: 4px;
}

/* Print styles */
@media print {
  .floating-cards,
  .footer-section {
    display: none;
  }
  
  .hero-section {
    background: none;
    color: black;
  }
  
  .section-header h2 {
    color: black;
  }
}
</style>