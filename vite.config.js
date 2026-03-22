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
    // ── Dev proxy: forwards /api/chat → Anthropic directly ──────────────
    // This mirrors what the Vercel serverless function does in production,
    // so local dev (npm run dev) and deployed Vercel both work identically.
    proxy: {
      '/api/chat': {
        target: 'https://api.anthropic.com',
        changeOrigin: true,
        rewrite: () => '/v1/messages',
        configure: (proxy) => {
          // The proxy rewrites headers so Anthropic receives x-api-key
          proxy.on('proxyReq', (proxyReq, req) => {
            // Move Authorization: Bearer sk-ant-xxx → x-api-key: sk-ant-xxx
            const auth = req.headers['authorization'] || ''
            const key = auth.replace('Bearer ', '').trim()
            if (key) {
              proxyReq.setHeader('x-api-key', key)
              proxyReq.setHeader('anthropic-version', '2023-06-01')
              proxyReq.removeHeader('authorization')
            }
          })
        }
      }
    }
  }
})
