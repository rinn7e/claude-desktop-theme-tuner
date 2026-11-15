import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// A static site with path routing (/, /legacy): asset paths are absolute
// under the base, so a deep link finds them. The base is the GitHub Pages
// project path in the deploy (VITE_BASE_URL), `/` in development.
export default defineConfig({
  base: process.env.VITE_BASE_URL ?? '/',
  plugins: [react(), tailwindcss()],
})
