import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// A static site: relative asset paths, so it works from any folder or
// GitHub Pages project path
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
