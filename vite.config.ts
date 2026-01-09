import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // For GitHub Pages, base must match your repo name: /repo-name/
  // Change this to '/' only if using a custom domain
  base: '/athlete-hub-global-main/',
})
