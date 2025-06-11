<template>
  <div class="app-layout" v-if="hasToken">
    <Sidebar />
    <div class="main-content">
      <Navbar />
      <router-view />
    </div>
  </div>
  <router-view v-else />
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import Sidebar from './components/Sidebar.vue'
import Navbar from './components/Navbar.vue'
import { useRouter } from 'vue-router'

const router = useRouter()
// State token yang reaktif
const hasToken = ref(!!localStorage.getItem('token'))

// Fungsi untuk update state saat login/logout
function updateToken() {
  hasToken.value = !!localStorage.getItem('token')
}

onMounted(() => {
  // Event listener saat login/logout, agar hasToken reaktif
  window.addEventListener('token-updated', updateToken)

  // Jika belum login, redirect ke /login (kecuali sudah di /login atau /register)
  if (!hasToken.value) {
    const publicRoutes = ['/login', '/register', '/forgot-password']
    if (!publicRoutes.includes(router.currentRoute.value.path)) {
      router.replace('/login')
    }
  }
})

onUnmounted(() => {
  window.removeEventListener('token-updated', updateToken)
})
</script>

<style>
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
