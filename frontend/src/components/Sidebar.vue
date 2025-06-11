<template>
  <div>
    <!-- HAMBURGER BUTTON (muncul hanya di tablet/mobile) -->
    <button
      class="sidebar-toggle"
      @click="sidebarOpen = true"
      aria-label="Open sidebar"
    >
      ☰
    </button>

    <!-- SIDEBAR -->
    <aside class="sidebar" :class="{ open: sidebarOpen }">
      <div class="sidebar-header">
        <span class="logo">🌱</span>
        <h2 class="app-title">SmartFarm</h2>
      </div>
      <nav>
        <ul>
          <li :class="{active: isActive('/dashboard')}" @click="goto('/dashboard')">
            <span>📊 Dashboard</span>
          </li>
          <li :class="{active: isActive('/analisis')}" @click="goto('/analisis')">
            <span>📈 Analisis</span>
          </li>
          <li :class="{active: isActive('/rekomendasi')}" @click="goto('/rekomendasi')">
            <span>🔎 Rekomendasi</span>
          </li>
          <li :class="{active: isActive('/history')}" @click="goto('/history')">
            <span>🕑 History</span>
          </li>
        </ul>
      </nav>
    </aside>

    <!-- OVERLAY, klik tutup sidebar -->
    <div
      v-if="sidebarOpen"
      class="sidebar-overlay"
      @click="sidebarOpen = false"
    ></div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const sidebarOpen = ref(false)
const router = useRouter()
const route = useRoute()

function goto(path) {
  router.push(path)
  sidebarOpen.value = false // auto close after click
}
function isActive(path) {
  return route.path.startsWith(path)
}
</script>

<style scoped>
.sidebar-toggle {
  display: none;
  position: fixed;
  top: 20px;
  left: 18px;
  z-index: 2001;
  background: #186146;
  color: #fff;
  border: none;
  font-size: 2.1rem;
  border-radius: 7px;
  padding: 2px 14px 2px 10px;
  cursor: pointer;
  transition: background 0.18s;
}
.sidebar-toggle:active,
.sidebar-toggle:focus {
  background: #125536;
}

@media (max-width: 1024px) {
  .sidebar-toggle {
    display: block;
  }
}
@media (min-width: 1025px) {
  .sidebar-toggle {
    display: none !important;
  }
}

/* Tambahkan responsive sidebar & overlay dari jawaban sebelumnya */
.sidebar {
  width: 220px;
  min-height: 150vh;
  background: #186146;
  color: #fff;
  padding: 28px 0 18px 0;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 14px #0001;
  transition: width 0.2s, left 0.25s, transform 0.26s cubic-bezier(0.65,0,0.35,1);
}

@media (max-width: 1024px) {
  .sidebar {
    width: 140px;
    padding: 18px 0 10px 0;
  }
}
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    width: 88vw;
    max-width: 310px;
    min-width: 150px;
    height: 100vh;
    z-index: 1200;
    box-shadow: 3px 0 20px #0002;
    padding-top: 16px;
    transform: translateX(-105%);
    transition: transform 0.26s cubic-bezier(0.65,0,0.35,1);
  }
  .sidebar.open {
    transform: translateX(0);
  }
}

/* Overlay */
.sidebar-overlay {
  position: fixed;
  z-index: 1199;
  inset: 0;
  background: #0006;
}

/* Sidebar-header, nav, list, dsb sesuai style kamu sebelumnya */
.sidebar-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: 24px;
  margin-bottom: 36px;
}
.logo {
  font-size: 2.3rem;
}
.app-title {
  font-size: 1.4rem;
  font-weight: bold;
  letter-spacing: 0.5px;
}
nav ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
nav li {
  padding: 15px 32px 15px 32px;
  border-radius: 9px 0 0 9px;
  margin: 0 0 8px 0;
  font-size: 1.13rem;
  cursor: pointer;
  transition: background 0.15s;
  display: flex;
  align-items: center;
  gap: 12px;
}
nav li.active,
nav li:hover {
  background: #155b3f;
  color: #fff;
}
</style>
