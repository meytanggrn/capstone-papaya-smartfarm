<template>
  <div class="app-layout" v-if="hasToken">
    <Sidebar />
    <div class="main-content">
      <Navbar />
      <router-view />
    </div>
  </div>
  <!-- Optionally, router-view only for routes like /login, /register -->
  <router-view v-else />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Sidebar from './components/Sidebar.vue'
import Navbar from './components/Navbar.vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const hasToken = ref(!!localStorage.getItem('token'))

onMounted(() => {
  // Jika tidak ada token, redirect ke /login (kecuali sudah di /login atau /register)
  if (!hasToken.value) {
    const publicRoutes = ['/login', '/register', '/forgot-password']
    if (!publicRoutes.includes(router.currentRoute.value.path)) {
      router.replace('/login')
    }
  }
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
