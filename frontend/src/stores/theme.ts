import { defineStore } from 'pinia'
import { ref } from 'vue'

const KEY = 'cs-demo-theme'

function read(): 'dark' | 'light' {
  try {
    return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export const useThemeStore = defineStore('theme', () => {
  const mode = ref<'dark' | 'light'>(read())
  function apply() {
    document.documentElement.classList.toggle('dark', mode.value === 'dark')
  }
  function toggle() {
    mode.value = mode.value === 'dark' ? 'light' : 'dark'
    try {
      localStorage.setItem(KEY, mode.value)
    } catch {
      /* storage unavailable - non-fatal */
    }
    apply()
  }
  return { mode, apply, toggle }
})
