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
        // ... (здесь ваши настройки иконок, не удаляйте их) ...

        // ВОТ ЭТОТ БЛОК НУЖНО ДОБАВИТЬ:
        share_target: {
          // action ОБЯЗАТЕЛЬНО должен совпадать с вашим base (включая слеши)
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