<template>
  <div class="app-layout" v-if="isLoggedIn">
    <Sidebar />
    <div class="main-content">
      <Navbar />
      <router-view />
    </div>
  </div>
  <router-view v-else />
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'; // Import 'watch'
import Sidebar from './components/Sidebar.vue';
import Navbar from './components/Navbar.vue';
import { useRouter, useRoute } from 'vue-router'; // Import useRoute juga

const router = useRouter();
const route = useRoute(); // Inisialisasi useRoute

// Menggunakan nama yang lebih deskriptif: isLoggedIn
const isLoggedIn = ref(false);

// Fungsi untuk memeriksa status login (melalui token di localStorage)
const checkLoginStatus = () => {
  isLoggedIn.value = !!localStorage.getItem('token');
};

// Panggil checkLoginStatus saat komponen di-mount pertama kali
onMounted(() => {
  checkLoginStatus();

  // Tambahkan event listener untuk event 'storage'
  // Event ini akan terpicu jika ada perubahan pada localStorage dari tab/window lain
  // atau saat localStorage dihapus/ditambah dari kode kita sendiri.
  window.addEventListener('storage', checkLoginStatus);

  // Jika Anda memancarkan event kustom 'token-changed' dari komponen lain (misalnya Navbar)
  // maka listener ini akan menangkapnya.
  window.addEventListener('token-changed', checkLoginStatus);

  // Logika untuk redirect saat pertama kali masuk atau refresh
  const publicRoutes = ['/login', '/register', '/forgot-password'];
  if (!isLoggedIn.value && !publicRoutes.includes(route.path)) {
    router.replace('/login');
  } else if (isLoggedIn.value && publicRoutes.includes(route.path)) {
    router.replace('/dashboard');
  }
});

// Watcher untuk memantau perubahan pada rute
// Ini penting agar `isLoggedIn` diperbarui saat navigasi router terjadi
watch(route, (newRoute) => {
  checkLoginStatus(); // Perbarui status login setiap kali rute berubah

  // Logika route guard di sisi client-side setelah navigasi
  const publicRoutes = ['/login', '/register', '/forgot-password'];
  if (!isLoggedIn.value && !publicRoutes.includes(newRoute.path)) {
    router.replace('/login');
  } else if (isLoggedIn.value && publicRoutes.includes(newRoute.path)) {
    router.replace('/dashboard');
  }
});

// Bersihkan event listener saat komponen di-unmount
onUnmounted(() => {
  window.removeEventListener('storage', checkLoginStatus);
  window.removeEventListener('token-changed', checkLoginStatus);
});
</script>

<style>
/* CSS Anda yang sudah ada */
.app-layout {
  display: flex;
  min-height: 100vh;
  width: 100vw;
  padding: 0 !important;
  margin: 0 !important;
}

.main-content {
  flex: 1;
  min-width: 0;
  background: #f8fafb;
  display: flex;
  flex-direction: column;
  padding: 0 !important;
  margin: 0 !important;
}
</style>