<template>
  <div class="register-wrapper">
    <div class="register-card">
      <div class="register-left">
        <h1 class="register-title">Daftar Akun</h1>
        <p class="register-desc">
          Tingkatkan Produktivitas, Optimalkan Hasil Panen<br />
          dengan <span class="brand">Papaya Smartfarm</span>.
        </p>
        <form @submit.prevent="register" class="register-form">
          <input v-model="name" type="text" placeholder="Name" class="input" required />
          <input v-model="email" type="email" placeholder="Email" class="input" required />
          <input v-model="password" type="password" placeholder="Password" class="input" required />
          <button type="submit" class="btn-register" :disabled="loading">
            {{ loading ? 'Menyimpan data...' : 'Daftar Akun' }}
          </button>
        </form>
        <div class="register-bottom">
          Sudah memiliki akun? <router-link to="/login">Login</router-link>
        </div>
        <div v-if="error" class="register-error">{{ error }}</div>
      </div>
      <div class="register-right">
        <img src="/assets/login-img.png" alt="Papaya Smartfarm" class="illustration" />
        <div class="right-desc">
          <span class="brand">Papaya Smartfarm</span> <br />
          Pertanian Presisi di Genggaman Anda.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'

const name = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const router = useRouter()
const apiUrl = 'https://backend-papaya-production.up.railway.app' 

const register = async () => {
  loading.value = true
  error.value = ''

  Swal.fire({
    title: 'Processing...',
    html: 'Registering your account...',
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    willOpen: () => {
      Swal.showLoading()
    }
  })

  try {
    // Register akun
    await axios.post(`${apiUrl}/api/auth/register`, {
      name: name.value,
      email: email.value,
      password: password.value
    })

    // Login otomatis setelah register
    const loginRes = await axios.post(`${apiUrl}/api/auth/login`, {
      email: email.value,
      password: password.value
    })

    // Simpan token dan user ke localStorage
    localStorage.setItem('token', loginRes.data.token)
    localStorage.setItem('user', JSON.stringify(loginRes.data.user))
    window.dispatchEvent(new Event('token-updated'))

    Swal.fire({
      icon: 'success',
      title: 'Registrasi Berhasil!',
      text: 'Selamat datang di Papaya Smartfarm!',
      showConfirmButton: false,
      timer: 1600,
      timerProgressBar: true,
      willClose: () => {
        router.push('/dashboard')
      }
    })
  } catch (e) {
    Swal.close()
    console.error('Register Error:', e)
    error.value = e.response?.data?.error || 'Gagal register'
  } finally {
    loading.value = false
  }
}
</script>


<style scoped>
.register-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
.register-card {
  background: #0A6847;
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
  color: #F6E9B2;
  margin-bottom: 13px;
}
.register-desc {
  color: #ffffff;
  font-size: 1.03rem;
  margin-bottom: 26px;
}
.brand {
  font-weight: 600;
  color: #F6E9B2;
}
.register-form {
  margin-bottom: 12px;
}
.input {
  width: 90%;
  padding: 13px 18px;
  border-radius: 10px;
  border: 1px solid #e2efd4;
  margin-bottom: 12px;
  font-size: 1.07rem;
  background: #f9fef9;
  transition: border 0.18s;
}
.input:focus { border-color: #10B981; }
.opsi-row {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

.btn-register {
  width: 100%;
  padding: 13px 0;
  border: none;
  border-radius: 10px;
  background: linear-gradient(90deg, #30b86a, #10B981 70%);
  color: #fff;
  font-size: 1.07rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 3px;
  margin-bottom: 8px;
  transition: background 0.2s, opacity 0.2s;
}
.btn-register:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.btn-register:hover:not(:disabled) {
  background: linear-gradient(90deg, #237c35, #10B981 85%);
}

.or-divider {
  text-align: center;
  color: #aaa;
  margin: 16px 0 8px;
  position: relative;
  font-size: 0.98rem;
}
.or-divider span {
  background: #fff;
  padding: 0 10px;
  position: relative;
  z-index: 2;
}
.or-divider:before {
  content: "";
  display: block;
  width: 100%;
  height: 1px;
  background: #ececec;
  position: absolute;
  top: 50%;
  left: 0;
  z-index: 1;
}

.register-bottom {
  text-align: center;
  font-size: 1.02rem;
  color: #ffffff;
  margin-top: 18px;
}
.register-bottom a {
  color: #F6E9B2;
  font-weight: 500;
  text-decoration: none;
}
.register-bottom a:hover {
  text-decoration: underline;
  color: #F6E9B2;
}

.register-error {
  color: #d82323;
  background: #fff0f1;
  border-radius: 7px;
  padding: 9px 14px;
  margin-top: 14px;
  text-align: center;
  font-size: 0.98rem;
  border: 1px solid #ffd5d5;
}

.register-right {
  background: linear-gradient(160deg, #eafff3 70%, #e7ffd4 100%);
  align-items: center;
  justify-content: center;
  display: flex;
  flex-direction: column;
  position: relative;
  padding: 32px;
}
.illustration {
  max-width: 340px;
  width: 100%;
  margin-bottom: 18px;
  object-fit: contain;
  border-radius: 19px;
  box-shadow: 0 2px 16px #10b98133;
}
.right-desc {
  color: #237c35;
  text-align: center;
  font-weight: 500;
  font-size: 1.07rem;
  margin-top: 3px;
}
.brand {
  color: #10B981;
  font-weight: 600;
}

/* Responsive styles */
@media (max-width: 900px) {
  .register-card {
    flex-direction: column-reverse;
    min-width: 320px;
    width: 98vw;
    max-width: 500px;
    min-height: unset;
    box-shadow: 0 8px 32px #00000022;
  }
  .register-right {
    padding: 22px 20px 8px 20px;
    min-height: 200px;
  }
  .register-left {
    padding: 36px 24px 24px 24px;
    min-width: unset;
  }
  .illustration {
    max-width: 220px;
    margin: 0 auto 12px auto;
  }
}
@media (max-width: 600px) {
  .register-card {
    box-shadow: 0 2px 16px #00000018;
    border-radius: 18px;
  }
  .register-wrapper {
    padding: 12px;
    min-height: 100dvh;
  }
}
</style>

