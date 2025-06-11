import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import 'leaflet/dist/leaflet.css'
import '@tensorflow/tfjs-backend-webgl'
import '@tensorflow/tfjs-backend-cpu'
import * as tf from '@tensorflow/tfjs'
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faSun, faTemperatureThreeQuarters, faTint, faSeedling, faCamera, faUser, faBell, faRightFromBracket } from '@fortawesome/free-solid-svg-icons'

library.add(faSun, faTemperatureThreeQuarters, faTint, faSeedling, faCamera, faUser, faBell, faRightFromBracket)



const app = createApp(App)

app.component('font-awesome-icon', FontAwesomeIcon)

app.use(router) 

app.mount('#app')
