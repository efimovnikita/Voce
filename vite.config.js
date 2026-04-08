import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/Voce/', // Ваш путь на GitHub Pages
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt', // или 'autoUpdate'
      manifest: {
        name: 'Voce Mistral Speaker',
        short_name: 'Voce',
        description: 'Text-to-speech reader',
        theme_color: '#0f172a',
        background_color: '#0f172a', // Рекомендуется добавлять для WebAPK
        start_url: '/voce/', // Обязательно для WebAPK
        scope: '/voce/',     // Обязательно для WebAPK
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable' // maskable позволяет Android адаптировать форму иконки
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        share_target: {
          action: '/voce/',
          method: 'GET',
          enctype: 'application/x-www-form-urlencoded',
          params: {
            title: 'title',
            text: 'text',
            url: 'url'
          }
        }
      }
    })
  ]
})