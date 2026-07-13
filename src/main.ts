import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/main.css'

const app = createApp(App)

if (import.meta.env.DEV) {
  app.config.errorHandler = (err, instance, info) => {
    console.error('[Vue error]', err)
    console.error('[Vue error info]', info)
    console.error('[Vue error instance]', instance)
  }
}

app.use(router).mount('#app')
