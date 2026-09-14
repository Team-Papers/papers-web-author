/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': '/src' } },
  // Les tests reutilisent la meme resolution d'alias que l'application : un
  // second endroit ou la declarer finirait par diverger.
  test: {
    environment: 'jsdom',
    // La machine de dev partage ses coeurs avec des dizaines de conteneurs :
    // un test qui rend une page peut depasser 5 s sans rien prouver.
    testTimeout: 15000,
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
    proxy: {
      '/api': {
        target: 'https://api-papers.seed-innov.com',
        changeOrigin: true,
        secure: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.removeHeader('origin');
            proxyReq.removeHeader('referer');
          });
        },
      },
    },
  },
})
