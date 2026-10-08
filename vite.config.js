import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), VitePWA({
    registerType: 'prompt',
    injectRegister: false,
    manifest: {
      id: '/', name: 'Fala Livre', short_name: 'Fala Livre',
      description: 'Comunicar, Aprender e Conectar.', lang: 'pt-BR', dir: 'ltr',
      display: 'standalone', start_url: '/#/', scope: '/',
      theme_color: '#315F8C', background_color: '#F7F8F4',
      icons: [
        { src: '/pwa/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/pwa/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/pwa/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,png,svg,webmanifest,md}'],
      globIgnores: ['**/favicon.svg'],
      cleanupOutdatedCaches: true,
      maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      navigateFallback: 'index.html',
      navigateFallbackAllowlist: [/^\/$/, /^\/index\.html$/],
      // Only build assets are precached. APIs, auth and payments are not cached.
      runtimeCaching: [],
    },
  })],
})
