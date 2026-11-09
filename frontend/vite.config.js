import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    historyApiFallback: true,
    proxy: {
      '/api': { target: 'http://127.0.0.1:3460', changeOrigin: true },
      '/socket.io': { target: 'http://127.0.0.1:3460', ws: true, changeOrigin: true },
    },
  },
})
