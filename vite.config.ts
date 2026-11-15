import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { configDefaults, defineConfig } from 'vitest/config'

// A static site: relative asset paths, so it works from any folder or
// GitHub Pages project path
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  // The mod's own tests run in Claude's engine (`claude plugin test mod`)
  test: { exclude: [...configDefaults.exclude, 'mod/**'] },
})
