import { createRouter, createWebHistory } from 'vue-router';
import Login from '../views/Login.vue';
import Register from '../views/Register.vue';
import InputLahan from '../views/InputLahan.vue'
import Dashboard from '../views/Dashboard.vue'
import DeteksiScan from '../views/DeteksiScan.vue';
import DeteksiDetail from '../views/DeteksiPenyakitDetail.vue';
import Analisis from '../views/Analisis.vue';
import Rekomendasi from '../views/Rekomendasi.vue';

const routes = [
    { path: '/login', component: Login, name: 'Login' },
    { path: '/register', component: Register, name: 'Register' },
    { path: '/dashboard', component: Dashboard, name: 'Dashboard' },
    { path: '/input-lahan', component: InputLahan, name: 'InputLahan' },
    { path: '/deteksi/scan', component: DeteksiScan, name: 'DeteksiScan' },
    { path: '/deteksi/:id', component: DeteksiDetail, name: 'DeteksiDetail' },
    { path: '/analisis', component: Analisis, name: 'Analisis' },
    { path: '/rekomendasi', component: Rekomendasi, name: 'Rekomendasi' },
    { path: '/', redirect: '/dashboard' },
];

export default createRouter({
    history: createWebHistory(),
    routes,
});