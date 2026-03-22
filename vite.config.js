import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'FlowDay – Smart Student Scheduler',
        short_name: 'FlowDay',
        description: 'AI-powered daily scheduler for engineering students',
        theme_color: '#0a0a0f',
        background_color: '#0a0a0f',
        display: 'standalone',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          }
        ]
      }
    })
  ],

  server: {
    proxy: {
      // Dev proxy: /api/chat → Gemini API
      // Mirrors what the Vercel serverless function does in production.
      '/api/chat': {
        target: 'https://generativelanguage.googleapis.com',
        changeOrigin: true,
        // rewrite is handled dynamically in useAI.js — we pass the full path in body
        // The proxy just strips /api/chat and we reconstruct in the handler
        rewrite: (path) => path, // keep as-is; handler fn does the routing
        configure: (proxy) => {
          proxy.on('error', (err) => console.error('Vite proxy error:', err))
        }
      }
    }
  }
})
