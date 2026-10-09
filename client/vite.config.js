import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import process from 'node:process'

const apiTarget = process.env.API_PROXY_TARGET || 'http://localhost:5001'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
})
