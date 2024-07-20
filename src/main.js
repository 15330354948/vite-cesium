import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElenmentPlusIconsVue from '@element-plus/icons-vue'

const app = createApp(App)

// for(const [key, val] in Object.entries(ElenmentPlusIconsVue)){
//     app.component(key, val)
// }

app.use(ElementPlus)
app.mount('#app')   
