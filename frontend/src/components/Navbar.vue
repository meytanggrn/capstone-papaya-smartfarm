<template>
  <header class="navbar">
    <input class="search" placeholder="Search" v-model="search"/>
    <div class="navbar-actions">
      <!-- <button class="notif-btn"><i class="fa-regular fa-bell"></i></button> -->
      <div class="profile-dropdown" @click="toggleDropdown">
        <font-awesome-icon icon="user" /><span> {{ userName }}</span>
        <i class="icon-caret"></i>
        <div class="dropdown-menu" v-if="showDropdown">
          <div v-for="lahan in lahanList" :key="lahan.id" class="dropdown-item" @click="selectLahan(lahan)">
            <img v-if="lahan.foto" :src="`${apiUrl}/uploads/${lahan.foto}`" width="30" height="30" style="object-fit:cover; border-radius:5px; margin-right:8px;"/>
            <span>{{ lahan.nama }}</span>
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
const userPhoto = ref('/../assets/user-icon.png')
const lahanList = ref([])
const showDropdown = ref(false)

const toggleDropdown = () => { showDropdown.value = !showDropdown.value }
const selectLahan = (lahan) => {
  localStorage.setItem('lahan_terpilih', JSON.stringify(lahan))
  window.location.href = '/dashboard'// reload dashboard dengan lahan terpilih
}

onMounted(async () => {
  try {
    const userRaw = localStorage.getItem('user')
    let user = {}
    if (userRaw) {
      user = JSON.parse(userRaw)
    }
    userName.value = user?.name || 'Profil'
    userPhoto.value = user?.photoUrl || '/../assets/user-icon.png'


    // ambil semua lahan user
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
}
.search {
  flex: 1;
  padding: 10px;
  border-radius: 15px;
  border: 1px solid #ececec;
  margin-right: 36px;
}
.navbar-actions { display: flex; align-items: center; gap: 20px; }
.avatar {
  width: 38px; height: 38px; border-radius: 50%; margin-right: 8px;
}
.profile-dropdown {
  position: relative;
  display: flex; align-items: center; cursor: pointer;
}
.dropdown-menu {
  position: absolute; top: 45px; right: 0; background: #fff; border: 1px solid #e5e5e5; box-shadow: 0 8px 20px #0001; z-index: 99; border-radius: 12px; min-width: 180px;
}
.dropdown-item {
  display: flex; align-items: center; padding: 12px 16px; cursor: pointer;
}
.dropdown-item:hover { background: #f4f4f4; }
</style>
