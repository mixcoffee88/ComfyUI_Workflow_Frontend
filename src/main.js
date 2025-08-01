import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './assets/styles/element-plus-custom.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const app = createApp(App)

// Element Plus 아이콘 등록
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(store)
app.use(router)
app.use(ElementPlus)

app.mount('#app') 