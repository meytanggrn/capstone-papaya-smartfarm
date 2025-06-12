🌱 PAPAYA SMART FARM
---
![smartfarm-logo](https://github.com/user-attachments/assets/3b51bddd-6724-4af4-ad09-ff55db0c438b)

Papaya Smart Farm adalah solusi pertanian cerdas berbasis IoT, Machine Learning, dan web platform 
yang dirancang untuk memantau dan memprediksi kondisi tanaman pepaya secara real-time. 
Proyek ini dikembangkan sebagai bagian dari **Capstone Project Dicoding x DBS Indonesia**, dengan tujuan 
untuk membantu petani meningkatkan produktivitas dan efisiensi melalui teknologi yang mudah diakses dan berbasis data.

## 📊 Fitur Utama
* Dashboard Monitoring 
* Analisis Prediksi Panen
* Deteksi Penyakit Dini
* Rekomendasi Penanganan Tanaman

## ⚙️ Cara Instalasi
Untuk menginstal dan menjalankan proyek ini secara lokal, ikuti langkah-langkah berikut:

Prasyarat Pastikan kamu telah menginstal:
- [Node.js](https://nodejs.org/)  
- [PostgreSQL](https://www.postgresql.org/)  
- [Git](https://git-scm.com/)  
- [Vue CLI](https://cli.vuejs.org/) *(opsional, untuk pengembangan frontend)*  
- [PM2](https://pm2.keymetrics.io/) *(opsional, untuk menjalankan server secara background/daemon)*

---

# 1. Clone repository
    git clone https://github.com/meytanggrn/capstone-papaya-smartfarm.git
    cd capstone-papaya-smartfarm

# 2. Setup backend
    cd backend
    npm install

2a. Buat file .env

    cp .env.example .env

2b. Edit file .env dengan isi seperti berikut (gunakan editor favoritmu)

    PORT=3000
    DB_HOST=localhost
    DB_PORT=5432
    DB_USER=postgres
    DB_PASSWORD=yourpassword
    DB_NAME=papaya_db

2c. Jalankan server backend

    npm start
    # atau jika menggunakan nodemon:
    npx nodemon index.js

# ⚠️ Buka terminal baru untuk lanjut frontend

# 3. Setup frontend
    cd ../frontend
    npm install
    npm run dev

# 4. Setup database PostgreSQL
Masuk ke PostgreSQL dan jalankan perintah berikut:

    CREATE DATABASE papaya_db;

Jika tersedia file schema.sql:

    psql -U postgres -d papaya_db -f schema.sql

# 5. (Opsional) Jalankan sistem sensor IoT
Jalankan script Python atau program yang membaca data dari sensor<br>
dan kirimkan ke endpoint backend menggunakan HTTP atau MQTT

# 6. Akses aplikasi
Frontend: buka di browser 

    http://localhost:5173/
    
Backend/API: akses di

    http://localhost:3000/

## Penggunaan

Setelah instalasi selesai, Anda bisa menjalankan proyek dengan perintah berikut:
Contoh: Untuk menjalankan aplikasi web

    npm install
    npm run build
    npm run dev
  atau 
    
    npx serve dist

## 📡 Akses
Website dapat diakses melalui tautan ..................

## 🤝 Kontribusi
Kontribusi sangat terbuka! Silakan buat issue atau pull request.

## 👨‍💻 Tim Pengembang
- Meytanggrn — [GitHub](https://github.com/meytanggrn)
- Nitandy — [GitHub](https://github.com/QonitaNadyaR)
- sal. — [GitHub](https://github.com/sasabiaa)
- Alyazz — [GitHub](https://github.com/alyazzr)
- BenedictusSamuel — [GitHub](https://github.com/BenedictusSamuel)
- Satrio
