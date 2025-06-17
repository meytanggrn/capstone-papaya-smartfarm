# 🌱 PAPAYA SMART FARM
---
![smartfarm-logo](https://github.com/user-attachments/assets/3b51bddd-6724-4af4-ad09-ff55db0c438b)

Papaya Smart Farm adalah solusi pertanian cerdas berbasis IoT, Machine Learning, dan web platform 
yang dirancang untuk memantau dan memprediksi kondisi tanaman pepaya secara real-time. 
Proyek ini dikembangkan sebagai bagian dari ***Capstone Project Dicoding x DBS Indonesia***, dengan tujuan 
untuk membantu petani meningkatkan produktivitas dan efisiensi melalui teknologi yang mudah diakses dan berbasis data.

## ✨ Fitur Utama

* **Autentikasi Pengguna:** Sistem login dan registrasi yang aman untuk pengelolaan data pribadi.
* **Dashboard Interaktif:** Visualisasi data sensor *real-time* (suhu, kelembaban udara, kelembaban tanah) dan status lahan.
* **Input Data Lahan:** Kemampuan untuk menambahkan dan mengelola informasi detail lahan pertanian, termasuk lokasi geografis.
* **Deteksi Penyakit:** Menggunakan model Machine Learning untuk memprediksi dan mengidentifikasi penyakit pada tanaman pepaya berdasarkan gambar, dilengkapi dengan detail penyakit dan persentase prediksi.
* **Analisis Data:** Menyediakan ringkasan data untuk membantu petani dalam pengambilan keputusan.
* **Rekomendasi:** Memberikan rekomendasi penanganan dan perawatan berdasarkan hasil deteksi dan analisis.

## 🚀 Teknologi yang Digunakan

* **Frontend:** Vue.js (dengan Vite)
* **Backend:** Node.js (Express.js)
* **Database:** PostgreSQL
* **Machine Learning:** Python (TensorFlow/PyTorch, scikit-learn - *sebutkan spesifiknya jika ada*)
* **Lain-lain:** Axios, Vue Router, Socket.IO, SweetAlert2, DBeaver (untuk pengelolaan DB), Railway App (untuk deployment), Ngrok (untuk *tunneling* lokal ke publik).

## ⚙️ Cara Instalasi & Menjalankan Proyek Secara Lokal

Untuk menginstal dan menjalankan proyek ini di mesin lokal Anda, ikuti langkah-langkah detail di bawah ini:

### Prasyarat

Pastikan Anda telah menginstal aplikasi dan *tools* berikut di sistem Anda sebelum memulai:

* [Node.js](https://nodejs.org/) (disarankan versi LTS)
* [PostgreSQL](https://www.postgresql.org/)
* [Git](https://git-scm.com/)
* [Ngrok](https://ngrok.com/) (Opsional, untuk *testing* koneksi dengan perangkat IoT dari jaringan publik)
* [PM2](https://pm2.keymetrics.io/) (Opsional, untuk menjalankan server backend secara *background/daemon*)
* DBeaver (Opsional, untuk pengelolaan database GUI)

### Langkah-langkah Instalasi

1.  **Clone Repository:**
    Buka terminal atau Git Bash, lalu jalankan perintah berikut untuk mengunduh proyek:
    ```bash
    git clone [https://github.com/meytanggrn/capstone-papaya-smartfarm.git](https://github.com/meytanggrn/capstone-papaya-smartfarm.git)
    cd capstone-papaya-smartfarm
    ```

2.  **Setup Backend:**
    Masuk ke direktori `backend` dan instal semua dependensi yang diperlukan:
    ```bash
    cd backend
    npm install
    ```
    Selanjutnya, **konfigurasi environment** untuk backend Anda. Buat file `.env` dengan menyalin contohnya:
    ```bash
    cp .env.example .env
    ```
    Buka file `.env` yang baru dibuat dan isi detail koneksi database serta *secret key* untuk JWT. Ganti `yourpassword` dengan *password* PostgreSQL Anda, dan `your_jwt_secret_key` dengan *string* acak yang kuat.
    ```ini
    PORT=3000
    DB_HOST=localhost
    DB_PORT=5432
    DB_USER=postgres
    DB_PASSWORD=yourpassword
    JWT_SECRET=your_jwt_secret_key
    DB_NAME=papaya_db
    ```
    *(**Catatan untuk Database:** Jika proyek backend Anda menggunakan sistem migrasi (misalnya Knex.js, Sequelize, TypeORM), jalankan migrasi database di sini. Contoh: `npx knex migrate:latest`. Jika tidak, pastikan database `papaya_db` telah dibuat dan skema tabel `users`, `lahan`, `deteksi_penyakit` telah diterapkan secara manual.)*

3.  **Jalankan Server Backend:**
    Dari direktori `backend`, jalankan server Node.js:
    ```bash
    npm start
    ```
    * Untuk pengembangan dengan *auto-restart* saat ada perubahan: `npx nodemon index.js`
    * Untuk menjalankan sebagai *daemon* di produksi (membutuhkan PM2): `pm2 start index.js --name papaya-backend`

    Server backend akan berjalan di `http://localhost:3000`.

4.  **Setup Frontend:**
    **Buka terminal baru** (sambil server backend tetap berjalan) dan kembali ke direktori utama proyek, lalu masuk ke direktori `frontend`:
    ```bash
    cd ../frontend
    npm install
    ```
    Kemudian, **konfigurasi environment** untuk frontend. Buat file `.env.local` di dalam direktori `frontend` untuk mengarahkan ke API backend lokal Anda:
    ```ini
    VITE_API_BASE_URL=http://localhost:3000/api
    VITE_WS_BASE_URL=ws://localhost:3000 # Jika menggunakan WebSocket (Socket.IO)
    ```

5.  **Jalankan Aplikasi Frontend:**
    Dari direktori `frontend`, mulai aplikasi Vue.js:
    ```bash
    npm run dev
    ```
    Aplikasi frontend akan berjalan di `http://localhost:5173` (atau port lain yang tersedia) dan akan otomatis membuka di browser Anda.

## 💡 Penggunaan Ngrok (Opsional)

Jika Anda perlu menguji koneksi dari perangkat eksternal (misalnya perangkat IoT atau simulasi API dari luar jaringan lokal) ke backend lokal Anda, Anda bisa menggunakan Ngrok.

1.  Pastikan server backend Anda sudah berjalan (`npm start` di direktori `backend`).
2.  Buka terminal terpisah dan jalankan Ngrok untuk port backend Anda:
    ```bash
    ngrok http 3000
    ```
3.  Ngrok akan memberikan URL publik (misalnya `https://xxxxxx.ngrok-free.app`). Gunakan URL ini sebagai `VITE_API_BASE_URL` dan `VITE_WS_BASE_URL` di file `.env.local` frontend Anda (setelah itu, Anda perlu me-restart frontend), atau langsung di konfigurasi perangkat IoT Anda.

## 🤝 Kontribusi

Kami sangat menyambut kontribusi dari komunitas! Jika Anda ingin berkontribusi pada proyek ini, silakan ikuti langkah-langkah berikut:

1.  *Fork* repositori ini.
2.  Buat *branch* baru: `git checkout -b feature/nama-fitur-baru`.
3.  Lakukan perubahan dan *commit* perubahan Anda: `git commit -m 'feat: tambahkan fitur baru'`.
4.  *Push* ke *branch* Anda: `git push origin feature/nama-fitur-baru`.
5.  Buat *Pull Request* baru.

# 👨‍💻 Tim Pengembang
- Meytanggrn — [GitHub](https://github.com/meytanggrn)
- Nitandy — [GitHub](https://github.com/QonitaNadyaR)
- sal. — [GitHub](https://github.com/sasabiaa)
- Alyazz — [GitHub](https://github.com/alyazzr)
- BenedictusSamuel — [GitHub](https://github.com/BenedictusSamuel)
- Bagus Satrio Wicaksono — [GitHub](https://github.com/Satss101)
