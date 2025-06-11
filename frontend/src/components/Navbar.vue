<template>
  <header class="navbar" v-if="hasToken">
    <div class="navbar-actions">
      <div class="profile-dropdown" @click="toggleDropdown">
        <img class="avatar" :src="userPhoto" alt="Profil" />
        <span>{{ userName }}</span>
        <i class="icon-caret"></i>
        <div class="dropdown-menu" v-if="showDropdown" @click.stop>
          <div v-for="lahan in lahanList" :key="lahan.id" class="dropdown-item" @click="selectLahan(lahan)">
            <img v-if="lahan.foto" :src="`${apiUrl}/uploads/${lahan.foto}`" width="30" height="30" style="object-fit:cover; border-radius:5px; margin-right:8px;" />
            <span>{{ lahan.nama }}</span>
          </div>
          <div class="dropdown-divider"></div>
          <div class="dropdown-item logout-item" @click.stop="logout" v-if="hasToken">
            <font-awesome-icon icon="right-from-bracket" />
            &emsp; Logout
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const apiUrl = 'http://localhost:5000'
const search = ref('')
const userName = ref('')
const userPhoto = ref('/assets/user-icon.png')
const lahanList = ref([])
const showDropdown = ref(false)
const hasToken = ref(!!localStorage.getItem('token'))

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
}
const selectLahan = (lahan) => {
  localStorage.setItem('lahan_terpilih', JSON.stringify(lahan))
  window.dispatchEvent(new Event('lahan-updated'))   // <--- Tambah ini
  // Tidak perlu reload window.location.href!
  showDropdown.value = false
}
const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  window.location.href = '/login'
}

onMounted(async () => {
  if (!hasToken.value) return

  try {
    const userRaw = localStorage.getItem('user')
    let user = {}
    if (userRaw) {
      user = JSON.parse(userRaw)
    }
    userName.value = user?.name || 'Profil'
    userPhoto.value = user?.photoUrl || '/../assets/user-icon.png'

    const token = localStorage.getItem('token')
    if (!token) return
    const res = await axios.get(`${apiUrl}/api/lahan`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    lahanList.value = res.data
  } catch (e) {
    lahanList.value = []
    if (e.response && e.response.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
  }
})
</script>


<style scoped>
.navbar {
  display: flex;
  align-items: center;
  padding: 18px 32px 18px 24px;
  background: #fff;
  border-bottom: 1px solid #e5e5e5;
  /* Jika mau fixed di atas:
  position: sticky; top: 0; z-index: 999;
  */
}
.navbar-actions {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-left: auto;   /* <- INI YANG MEMBUAT PROFIL DI KANAN */
}
.avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  margin-right: 8px;
  object-fit: cover;
  background: #eee;
}
.profile-dropdown {
  position: relative;
  display: flex;
  align-items: center;
  cursor: pointer;
  gap: 8px;
  user-select: none;
}
.icon-caret::after {
  font-size: 12px;
  margin-left: 6px;
  color: #aaa;
}
.dropdown-menu {
  position: absolute;
  top: 50px;
  right: 0;
  background: #fff;
  border: 1px solid #e5e5e5;
  box-shadow: 0 8px 20px #0001;
  z-index: 99;
  border-radius: 12px;
  min-width: 190px;
  padding: 6px 0;
  animation: fadeIn 0.2s;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px);}
  to   { opacity: 1; transform: none;}
}
.dropdown-item {
  display: flex;
  align-items: center;
  padding: 12px 18px;
  cursor: pointer;
  transition: background 0.1s;
  font-size: 15px;
}
.dropdown-item:hover {
  background: #f4f4f4;
}
.dropdown-divider {
  height: 1px;
  background: #ececec;
  margin: 4px 0;
}
.logout-item {
  color: #d33;
  font-weight: bold;
}
</style>
