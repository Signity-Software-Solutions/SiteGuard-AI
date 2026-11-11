import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { loadReferenceData } from './data/reference'
import './styles/main.css'

function showStartupError(err: unknown) {
  const root = document.getElementById('app')
  if (!root) return
  const msg = err instanceof Error ? err.message : String(err)
  root.innerHTML = ''
  const box = document.createElement('div')
  box.style.cssText = 'max-width:32rem;margin:4rem auto;padding:1.5rem;font-family:system-ui,sans-serif;line-height:1.5'
  const h = document.createElement('h1')
  h.textContent = 'Backend unavailable'
  h.style.cssText = 'font-size:1.25rem;font-weight:600;margin-bottom:.5rem'
  const p = document.createElement('p')
  p.textContent = `${msg}. Start it with "npm run dev:backend" (from the repository root) and reload.`
  box.append(h, p)
  root.append(box)
}

// All site / zone / camera / policy / history data is served by the backend - load it before mounting.
loadReferenceData()
  .then(() => createApp(App).use(createPinia()).use(router).mount('#app'))
  .catch(showStartupError)
