<template>
  <nav class="navbar">
    <div class="navbar-left">
      <router-link to="/dashboard" class="logo-link">
        <img src="../assets/logo-papaya.png" alt="Logo Papaya SmartFarm" class="logo" />
      </router-link>
    </div>
    <div class="navbar-right">
      <div class="profile-dropdown" @click="toggleDropdown">
        <div class="profile-info">
          <span>{{ userName }}</span>
          <img :src="profileImage" alt="Profile" class="profile-pic" />
        </div>
        <div v-if="isDropdownOpen" class="dropdown-menu">
          <router-link v-if="!hasLahan" to="/input-lahan" class="dropdown-item">
            + Tambah Lahan
          </router-link>
          <div v-else class="dropdown-lahan-list">
            <div
              v-for="l in allLahans"
              :key="l.id"
              :class="['dropdown-lahan-item', { 'is-selected': selectedLahan && selectedLahan.id === l.id }]"
              @click.stop="selectLahan(l)"
            >
              {{ l.nama }}
            </div>
            <router-link to="/input-lahan" class="dropdown-item add-lahan-btn">+ Tambah Lahan</router-link>
          </div>
          <div class="dropdown-item logout-btn" @click="logout">Keluar</div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router'; // Ini sudah benar
import axios from 'axios';

const router = useRouter(); // Ini sudah benar
const userName = ref('User');
const profileImage = ref('/default-profile.png'); // Ganti dengan path default jika tidak ada
const isDropdownOpen = ref(false);
const allLahans = ref([]);
const selectedLahan = ref(null);
const hasLahan = ref(false); // New state to check if user has any land

const apiUrl = 'http://localhost:5000'; // Pastikan ini benar

// Function to open/close dropdown
const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

// Function to select lahan and save to localStorage
const selectLahan = (lahan) => {
  selectedLahan.value = lahan;
  localStorage.setItem('lahan_terpilih', JSON.stringify(lahan));
  isDropdownOpen.value = false; // Close dropdown after selection
  // Trigger event for Dashboard to update
  window.dispatchEvent(new CustomEvent('lahan-updated'));
};

// Function to fetch all user's lahans
const fetchLahans = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No token found, cannot fetch lahan data.'); // Ini yang Anda lihat
      allLahans.value = [];
      hasLahan.value = false;
      return; // Penting: keluar dari fungsi jika tidak ada token
    }
    const response = await axios.get(`${apiUrl}/api/lahan`, {
      headers: {
        Authorization: `Bearer ${token}` // Pastikan ini ada
      }
    });
    allLahans.value = response.data;
    hasLahan.value = allLahans.value.length > 0;

    // Set initial selected lahan if exists in localStorage, otherwise use first one
    const storedLahan = localStorage.getItem('lahan_terpilih');
    if (storedLahan) {
      selectedLahan.value = JSON.parse(storedLahan);
    } else if (allLahans.value.length > 0) {
      selectedLahan.value = allLahans.value[0];
      localStorage.setItem('lahan_terpilih', JSON.stringify(allLahans.value[0]));
    } else {
      selectedLahan.value = null;
    }
    // Dispatch event to notify other components (e.g., Dashboard)
    window.dispatchEvent(new CustomEvent('lahan-updated'));

  } catch (error) {
    console.error('Error fetching lahan data:', error);
    // Handle error, e.g., show a message to the user
  }
};

// Logout function
const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('lahan_terpilih');

  // !!! TAMBAHKAN BARIS INI !!!
  window.dispatchEvent(new CustomEvent('token-changed'));

  router.push('/login');
};

// Close dropdown if clicked outside
const handleClickOutside = (event) => {
  if (isDropdownOpen.value && !event.target.closest('.profile-dropdown')) {
    isDropdownOpen.value = false;
  }
};

onMounted(() => {
  // Load user data
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (user && user.name) {
    userName.value = user.name;
    // Set profile image if available from user data
    // profileImage.value = user.profile_image_url || '/default-profile.png';
  }

  fetchLahans(); // Fetch lahan data on mount
  window.addEventListener('click', handleClickOutside);
  // Listen for custom event from InputLahan.vue when new lahan is added
  window.addEventListener('lahan-added', fetchLahans);
});

onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside);
  window.removeEventListener('lahan-added', fetchLahans);
});
</script>

<style scoped>
/* Pastikan Anda memiliki CSS untuk Navbar Anda di sini */
/* ... (CSS Anda yang sudah ada) ... */

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background-color: #eaf7f2;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  border-radius: 12px; /* Slight rounded corners */
  margin-bottom: 20px; /* Space below navbar */
}

.logo-link {
  display: flex;
  align-items: center;
}

.logo {
  height: 40px; /* Adjust as needed */
}

.navbar-right {
  position: relative; /* For dropdown positioning */
}

.profile-dropdown {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 20px;
  background-color: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: background-color 0.2s ease;
}

.profile-dropdown:hover {
  background-color: #f0f0f0;
}

.profile-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.profile-info span {
  font-weight: 500;
  color: #333;
}

.profile-pic {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #24b47e;
}

.dropdown-menu {
  position: absolute;
  top: 100%; /* Position below the profile dropdown */
  right: 0;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  min-width: 180px;
  z-index: 1000;
  overflow: hidden; /* For rounded corners */
  margin-top: 10px;
}

.dropdown-item {
  padding: 12px 18px;
  cursor: pointer;
  color: #555;
  text-decoration: none;
  display: block; /* Make the whole area clickable */
  transition: background-color 0.2s ease;
}

.dropdown-item:hover {
  background-color: #f2f2f2;
}

.dropdown-lahan-list {
  border-bottom: 1px solid #eee; /* Separator for lahan list */
  padding-bottom: 5px;
  margin-bottom: 5px;
}

.dropdown-lahan-item {
  padding: 10px 18px;
  cursor: pointer;
  color: #333;
  transition: background-color 0.2s ease;
}

.dropdown-lahan-item:hover {
  background-color: #e6f7f0; /* Lighter green hover for lahan items */
}

.dropdown-lahan-item.is-selected {
  background-color: #24b47e;
  color: #fff;
  font-weight: bold;
}

.add-lahan-btn {
  color: #24b47e; /* Green for add lahan button */
  font-weight: 600;
  text-align: center;
  border-top: 1px solid #eee;
  padding-top: 10px;
  margin-top: 5px;
}

.logout-btn {
  color: #e74c3c; /* Red for logout button */
  font-weight: 600;
}


/* Responsive styles */
@media (max-width: 768px) {
  .navbar {
    padding: 8px 15px;
    margin-bottom: 15px;
  }
  .logo {
    height: 35px;
  }
  .profile-info span {
    display: none; /* Hide name on small screens */
  }
  .profile-pic {
    width: 30px;
    height: 30px;
  }
  .dropdown-menu {
    min-width: 150px;
  }
  .dropdown-item {
    padding: 10px 15px;
  }
}
</style>