import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // ОБЯЗАТЕЛЬНО: Регистр должен совпадать с именем репозитория на GitHub
  base: '/Voce/', 
  plugins: [
    react(),
    VitePWA({
      manifest: {
        name: 'Voce Mistral Speaker',
        short_name: 'Voce',
        theme_color: '#0f172a', // Цвет фона slate-900
        background_color: '#0f172a', // Цвет заставки при запуске
        display: 'standalone',
        scope: '/Voce/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ],
        share_target: {
          // Здесь тоже меняем на большую букву
          action: '/Voce/', 
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