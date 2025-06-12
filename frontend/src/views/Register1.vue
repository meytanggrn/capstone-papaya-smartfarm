<template>
  <div class="auth-wrapper">
    <div class="auth-card">
      <!-- Right: Foto -->
      <div class="auth-right">
        <img src="/assets/login-img.png" alt="Papaya Smartfarm" class="auth-image-main" />
      </div>
      <!-- Left: Form -->
      <div class="auth-left">
        <h1 class="auth-title">Sign Up</h1>
        <p class="auth-desc">
          Simplify your workflow and boost your productivity with
          <span class="brand">Papaya Smartfarm</span>. Get started for free.
        </p>
        <form @submit.prevent="register" class="auth-form">
          <input v-model="name" type="text" placeholder="Name" class="input" required />
          <input v-model="email" type="email" placeholder="Email" class="input" required />
          <input v-model="password" type="password" placeholder="Password" class="input" required />
          <button type="submit" class="btn-auth" :disabled="loading">
            {{ loading ? 'Registering...' : 'Register' }}
          </button>
        </form>
        <div class="auth-bottom">
          Already have an account?
          <router-link to="/login" class="link">Login</router-link>
        </div>
        <div v-if="error" class="auth-error">{{ error }}</div>
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
.auth-wrapper {
  min-height: 100vh;
  background: linear-gradient(120deg, #e7ffd4 60%, #eafaea 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-card {
  display: flex;
  flex-direction: row; 
}

.auth-left, .auth-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.auth-left {
  padding: 54px 48px 42px 48px;
  min-width: 340px;
}
.auth-title {
  font-size: 2.1rem;
  font-weight: bold;
  color: #237c35;
  margin-bottom: 13px;
}
.auth-desc {
  color: #646464;
  font-size: 1.07rem;
  margin-bottom: 32px;
}
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 16px;
}
.input {
  background: #f6fff7;
  border: 1.6px solid #b5e7c2;
  border-radius: 10px;
  font-size: 1.04em;
  padding: 13px 16px;
  margin-bottom: 0px;
  transition: box-shadow 0.2s;
}
.input:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px #6ee7b7;
  border-color: #47cf84;
}
.btn-auth {
  width: 100%;
  background: linear-gradient(90deg, #13ce66 60%, #27e08b 100%);
  color: #fff;
  font-size: 1.1em;
  font-weight: 600;
  padding: 13px 0;
  border: none;
  border-radius: 10px;
  margin-top: 4px;
  cursor: pointer;
  transition: filter 0.17s, transform 0.16s;
  box-shadow: 0 3px 18px #13ce6633;
}
.btn-auth:active {
  transform: scale(0.98);
  filter: brightness(0.98);
}
.btn-auth:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.auth-bottom {
  margin-top: 20px;
  font-size: 1.03em;
  color: #505050;
}
.link {
  color: #13ce66;
  text-decoration: none;
  font-weight: 600;
  margin-left: 3px;
  transition: text-decoration 0.1s;
}
.link:hover {
  text-decoration: underline;
}
.auth-error {
  color: #f04444;
  margin-top: 10px;
  animation: shake .17s 2;
  font-weight: 500;
  font-size: 1em;
}
@keyframes shake {
  0% { transform: translateX(0);}
  25% { transform: translateX(7px);}
  50% { transform: translateX(-7px);}
  75% { transform: translateX(3px);}
  100% { transform: translateX(0);}
}
.brand {
  background: linear-gradient(90deg, #13ce66 70%, #3fffac 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 700;
}
.auth-right {
  background: linear-gradient(110deg, #e7ffd4 60%, #eafaea 100%);
  align-items: center;
  justify-content: center;
  padding: 36px 24px;
  position: relative;
}
.auth-image-main {
  max-width: 340px;
  width: 100%;
  margin-bottom: 18px;
  object-fit: contain;
  border-radius: 19px;
  box-shadow: 0 2px 16px #10b98133;
}
.input::placeholder {
  color: #86b985;
  opacity: 1;
  font-style: italic;
}

/* Responsive Layout */
@media (max-width: 900px) {
  .auth-card {
    flex-direction: column-reverse;
    width: 96vw;
    min-width: unset;
    border-radius: 16px;
    box-shadow: 0 4px 18px #13ce6614;
    margin: 18px 0;
  }
  .auth-right,
  .auth-left {
    min-width: unset;
    padding: 28px 6vw !important;
    align-items: center;
  }
  .auth-left {
    padding-top: 22px !important;
  }
  .auth-title,
  .auth-desc,
  .auth-bottom {
    text-align: center;
  }
  .auth-form {
    gap: 10px;
  }
  .btn-auth {
    font-size: 1em;
    padding: 12px 0;
  }
  .auth-image-main{
    max-width: 220px;
    margin: 0 auto 12px auto;
  }
}
@media (max-width: 650px) {
  .auth-card {
    flex-direction: column;  /* mobile: foto di atas, form di bawah */
  }
  .auth-right, .auth-left {
    align-items: center;
    padding: 16px 5vw !important;
  }
  .auth-image-main {
    width: 90vw;
    max-width: 350px;
    height: 120px;
    margin-bottom: 14px;
  }
}
@media (max-width: 430px) {
  .auth-image-main {
    width: 97vw;
    max-width: 99vw;
    height: 105px;
    border-radius: 10px;
    margin-top: 0;
    margin-bottom: 7px;
  }
  .auth-title {
    font-size: 1.13rem;
  }
}
</style>

