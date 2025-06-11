<template>
  <form @submit.prevent="register">
    <input v-model="name" type="text" placeholder="Nama" required />
    <input v-model="email" type="email" placeholder="Email" required />
    <input v-model="password" type="password" placeholder="Password" required />
    <button type="submit">Register</button>
    <p>Sudah memiliki akun?<a href="Login.vue"></a></p>
    <p v-if="error">{{ error }}</p>
  </form>
</template>
<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const name = ref('');
const email = ref('');
const password = ref('');
const error = ref('');
const router = useRouter();

const register = async () => {
  try {
    await axios.post('http://localhost:5000/api/auth/register', { name: name.value, email: email.value, password: password.value });
    router.push('/login');
  } catch (e) {
    error.value = e.response?.data?.error || 'Gagal register';
  }
};
</script>
