import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// IMPORTANT: Change 'smartcare' below to your exact GitHub repository name
export default defineConfig({
  plugins: [react()],
  base: '/-smartcare-/',
})
