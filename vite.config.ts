import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api/analises-comerciais': {
        target: 'https://localhost:7225',
        changeOrigin: true,
        secure: false,
      },
      '/api/Documentos': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/api/leads': {
        target: 'https://localhost:58507',
        changeOrigin: true,
        secure: false,
      },
      '/api/documentos': {
        target: 'https://localhost:58507',
        changeOrigin: true,
        secure: false,
      },
      '/api/clientes': {
        target: 'https://localhost:58507',
        changeOrigin: true,
        secure: false,
      },
      '/api/pessoas-fisicas': {
        target: 'https://localhost:58507',
        changeOrigin: true,
        secure: false,
      },
      '/api/pessoas-juridicas': {
        target: 'https://localhost:58507',
        changeOrigin: true,
        secure: false,
      },
      '/api/contratos': {
        target: 'https://localhost:58507',
        changeOrigin: true,
        secure: false,
      },
      '/api/scripts': {
        target: 'https://localhost:58507',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
