import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import path from 'path'

const backend = process.env.VITE_BACKEND_URL ?? 'http://localhost:8083'

export default defineConfig({
  plugins: [vue()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  server: { proxy: { '/api': { target: backend, changeOrigin: true } } },
  test: { include: ['tests/**/*.test.ts'], environment: 'node', setupFiles: ['tests/setup.ts'] },
})
