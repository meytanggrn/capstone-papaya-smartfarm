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
    { path: '/', redirect: '/dashboard' },
    { path: '/login', component: Login },
    { path: '/register', component: Register },
    {
        path: '/dashboard',
        component: Dashboard,
        meta: { requiresAuth: true } // Ditambahkan untuk autentikasi
    },
    {
        path: '/input-lahan',
        component: InputLahan,
        meta: { requiresAuth: true } // Ditambahkan untuk autentikasi
    },
    {
        path: '/deteksi/scan',
        component: DeteksiScan,
        meta: { requiresAuth: true } // Ditambahkan untuk autentikasi
    },
    {
        path: '/deteksi/:id',
        component: DeteksiDetail,
        meta: { requiresAuth: true } // Ditambahkan untuk autentikasi
    },
    {
        path: '/analisis',
        component: Analisis,
        meta: { requiresAuth: true } // Ditambahkan untuk autentikasi
    },
    {
        path: '/rekomendasi',
        component: Rekomendasi,
        meta: { requiresAuth: true } // Ditambahkan untuk autentikasi
    },
    { path: '/about', component: About }, // Umumnya tidak butuh autentikasi, biarkan tanpa meta
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

// Global Navigation Guard
router.beforeEach((to, from, next) => {
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth); // Mengecek apakah rute memerlukan autentikasi
    const token = localStorage.getItem('token'); // Mengambil token dari localStorage

    if (requiresAuth && !token) {
        // Jika rute memerlukan autentikasi TAPI tidak ada token, arahkan ke login
        next('/login');
    } else if (to.path === '/login' && token) {
        // Jika sudah login (ada token) TAPI mencoba mengakses halaman login, arahkan ke dashboard
        next('/dashboard');
    } else {
        // Jika tidak ada kondisi di atas, lanjutkan ke rute yang diminta
        next();
    }
});

export default router;