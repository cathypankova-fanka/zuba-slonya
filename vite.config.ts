import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

// Для GitHub Pages игра лежит в подпапке: VITE_BASE=/zuba-slonya/ (в dev остаётся '/')
const BASE = process.env.VITE_BASE ?? '/';

export default defineConfig(() => {
  return {
    base: BASE,
    plugins: [
      {
        // Пути вида "/assets/..." в коде и JSON переписываем под base при сборке
        name: 'base-aware-asset-paths',
        enforce: 'pre' as const,
        apply: 'build' as const,
        transform(code: string, id: string) {
          if (BASE === '/') return null;
          if (!/[\\/]src[\\/].*\.(tsx?|json)$/.test(id)) return null;
          if (!code.includes('/assets/')) return null;
          return { code: code.replace(/(["'`])\/assets\//g, `$1${BASE}assets/`), map: null };
        },
      },
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'favicon.ico',
          'favicon-32.png',
          'apple-touch-icon.png',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'pwa-maskable-512x512.png',
        ],
        manifest: {
          id: BASE,
          name: 'Анюткина игра',
          short_name: 'Анюткина игра',
          description:
            'Весёлая игра для малышей: рисуем фейс-арт и украшаем футболки с персонажами сказок и семьи.',
          theme_color: '#FAF8F4',
          background_color: '#FAF8F4',
          display: 'standalone',
          start_url: BASE,
          scope: BASE,
          icons: [
            {
              src: `${BASE}pwa-192x192.png`,
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: `${BASE}pwa-512x512.png`,
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: `${BASE}pwa-maskable-512x512.png`,
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,jpg,webp,svg,woff,woff2}'],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          // Только сборочные js/css с хэшем в имени не требуют ревизии. Картинки из public/assets
          // (герои, реакции) меняются под тем же именем — им нужна ревизия, иначе кэш навсегда старый.
          dontCacheBustURLsMatching: /-[A-Za-z0-9_-]{8}\.(?:js|css)$/,
          runtimeCaching: [
            {
              // Голоса помощников (mp3): кэшируются при первом проигрывании, дальше работают офлайн
              urlPattern: /\/assets\/voices\/.*\.mp3$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'voices',
                rangeRequests: true,
                cacheableResponse: { statuses: [200] },
                expiration: { maxEntries: 1400 },
              },
            },
            {
              // Мультики из «Телевизора»: кэшируются целиком для офлайна,
              // Range-запросы (перемотка) отдаются из кэша
              urlPattern: /\/assets\/tv\/.*\.mp4$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'tv-videos',
                rangeRequests: true,
                cacheableResponse: {
                  statuses: [200],
                },
                expiration: {
                  maxEntries: 40,
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
      // Copies src/assets into dist/ so root-relative URLs like
      // "/src/assets/images/..." (e.g. generate_image output) still resolve
      // in production builds. Do not remove.
      {
        name: 'copy-unbundled-src-assets',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(__dirname, 'dist');
          const srcAssets = path.resolve(__dirname, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, {recursive: true, force: true});
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
