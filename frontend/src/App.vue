<template>
  <div class="app-layout">
    <Sidebar />
    <div class="main-content">
      <Navbar />
      <router-view />
    </div>
  </div>
</template>
<script setup>
import Sidebar from './components/Sidebar.vue'
import Navbar from './components/Navbar.vue'
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
