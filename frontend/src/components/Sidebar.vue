<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <img src="/images/smartfarm-logo1.png" alt="SmartFarm Logo" class="app-logo" />
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
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'
const router = useRouter()
const route = useRoute()
const goto = (path) => router.push(path)
const isActive = (path) => route.path === path
</script>

<style scoped>
.sidebar {
  width: 220px;
  min-height: 100vh;
  background: #186146;
  color: #fff;
  padding: -5px 0 18px 0;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 14px #0001;
}
.sidebar-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: 5px;
  margin-bottom: -40px;
}

.app-logo { 
  width: 200px; 
  height: 200px;
  object-fit: contain;
  display: block;
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
