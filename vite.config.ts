import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Relative base so the built app works at any URL,
  // including GitHub Pages project sites (https://<user>.github.io/<repo>/)
  base: './',
  devtools: {
    // Remove this `apply` property to enable devtools for build as well
    apply: 'serve',
  },
})
