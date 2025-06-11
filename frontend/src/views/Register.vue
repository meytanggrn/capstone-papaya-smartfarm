<template>
  <div class="register-wrapper">
    <div class="register-card">
      <div class="register-left">
        <h1 class="register-title">Sign Up</h1>
        <p class="register-desc">
          Daftarkan akun baru untuk mulai memonitor pertanianmu<br>
          bersama <span class="brand">Papaya Smartfarm</span>
        </p>
        <form @submit.prevent="register" class="register-form">
          <input v-model="name" type="text" placeholder="Nama" class="input" required />
          <input v-model="email" type="email" placeholder="Email" class="input" required />
          <input v-model="password" type="password" placeholder="Password" class="input" required />
          <button type="submit" class="btn-register">{{ loading ? 'Registering...' : 'Register' }}</button>
        </form>
        <div class="register-bottom">
          Sudah memiliki akun?
          <router-link to="/login">Login</router-link>
        </div>
        <div v-if="error" class="register-error">{{ error }}</div>
      </div>
      <div class="register-right">
        <img src="/assets/login-img.png" alt="Papaya Smartfarm" class="illustration" />
        <div class="right-desc">
          Jadikan pertanian lebih mudah, modern,<br> dan produktif dengan <span class="brand">Papaya Smartfarm</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const name = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const router = useRouter()

const register = async () => {
  loading.value = true
  error.value = ''
  try {
    await axios.post('http://localhost:5000/api/auth/register', {
      name: name.value,
      email: email.value,
      password: password.value
    })
    router.push('/login')
  } catch (e) {
    error.value = e.response?.data?.error || 'Gagal register'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-wrapper {
  min-height: 100vh;
  background: linear-gradient(120deg, #e7ffd4 60%, #eafaea 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}
.register-card {
  background: #fff;
  border-radius: 32px;
  box-shadow: 0 8px 32px #0001;
  display: flex;
  width: 950px;
  max-width: 98vw;
  min-height: 520px;
  overflow: hidden;
}
.register-left, .register-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.register-left {
  padding: 54px 48px 42px 48px;
  min-width: 340px;
}
.register-title {
  font-size: 2.1rem;
  font-weight: bold;
  color: #237c35;
  margin-bottom: 13px;
}
.register-desc {
  color: #646464;
  font-size: 1.03rem;
}
.register-card {
  animation: popIn 0.75s cubic-bezier(.32,1.56,.63,1);
}

@keyframes popIn {
  0% {
    transform: scale(.96) translateY(22px);
    opacity: 0;
  }
  100% {
    transform: none;
    opacity: 1;
  }
}

.btn-register:active {
  transform: scale(0.97);
}
/* Animasi pop-in card */
.register-card, .login-card {
  animation: popIn 0.7s cubic-bezier(.32,1.56,.63,1) 1;
}

@keyframes popIn {
  0% {
    transform: scale(.96) translateY(22px);
    opacity: 0;
  }
  100% {
    transform: none;
    opacity: 1;
  }
}

/* Tombol active animasi */
.btn-register:active, .btn-login:active {
  transform: scale(0.98);
  filter: brightness(0.97);
}

/* Efek hover dan fokus input */
.input:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px #82e5b5;
}

/* Responsive tweaks untuk layar sangat kecil */
@media (max-width: 430px) {
  .register-card, .login-card {
    padding: 0;
    border-radius: 10px;
  }
  .register-left, .register-right,
  .login-left, .login-right {
    padding: 12px 2vw;
  }
  .register-title, .login-title {
    font-size: 1.05rem;
  }
  .register-desc, .right-desc,
  .login-desc {
    font-size: 0.92rem;
  }
}

/* Brand highlight */
.brand {
  background: linear-gradient(90deg, #10B981 60%, #3fffac 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 700;
}

/* Placeholder styling (biar input lebih modern) */
.input::placeholder {
  color: #86b985;
  opacity: 1;
  font-size: 1.01em;
  font-style: italic;
}

/* Pesan error animasi */
.register-error, .login-error {
  animation: shake .18s 2;
}

@keyframes shake {
  0% { transform: translateX(0px);}
  25% { transform: translateX(6px);}
  50% { transform: translateX(-6px);}
  75% { transform: translateX(4px);}
  100% { transform: translateX(0px);}
}

/* Scrollbar agar tetap rapih di mobile */
.register-wrapper, .login-wrapper {
  scrollbar-width: thin;
  scrollbar-color: #b8efce #eafaea;
}
.register-wrapper::-webkit-scrollbar, .login-wrapper::-webkit-scrollbar {
  width: 8px;
  background: #eafaea;
}
.register-wrapper::-webkit-scrollbar-thumb, .login-wrapper::-webkit-scrollbar-thumb {
  background: #b8efce;
  border-radius: 12px;
}
</style>