import { createRouter, createWebHistory } from 'vue-router';
import Login from '../views/Login.vue';
import Register from '../views/Register.vue';
import InputLahan from '../views/InputLahan.vue'
import Dashboard from '../views/Dashboard.vue'
import DeteksiScan from '../views/DeteksiScan.vue';
import DeteksiDetail from '../views/DeteksiPenyakitDetail.vue';
import Analisis from '../views/Analisis.vue';
import Rekomendasi from '../views/Rekomendasi.vue';
import About from '../views/About.vue';

const routes = [
    { path: '/login', component: Login },
    { path: '/register', component: Register },
    { path: '/dashboard', component: Dashboard},
    { path: '/input-lahan', component: InputLahan },
    { path: '/deteksi/scan', component: DeteksiScan },
    { path: '/deteksi/:id', component: DeteksiDetail },
    { path: '/analisis', component: Analisis },
    { path: '/rekomendasi', component: Rekomendasi},
    { path: '/about', component: About},
];

export default createRouter({
    history: createWebHistory(),
    routes,
});
