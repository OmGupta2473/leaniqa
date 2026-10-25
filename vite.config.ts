import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        includeAssets: ['LQ-64.png', 'LQ-192.png', 'logo.png'],
        manifest: false,
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [
            /^\/api\//,
            /^\/functions\//,
            /^\/\.well-known\//,
          ],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'google-fonts-stylesheets',
                expiration: { maxEntries: 4, maxAgeSeconds: 604800 },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-webfonts',
                expiration: { maxEntries: 8, maxAgeSeconds: 31536000 },
              },
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      })
    ],
    build: { outDir: 'dist', emptyOutDir: true,
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules/recharts') || id.includes('node_modules/d3')) return 'recharts';
            if (id.includes('node_modules/framer-motion') || id.includes('node_modules/motion')) return 'motion';
            if (id.includes('node_modules/@supabase')) return 'supabase';
            if (id.includes('node_modules/@tanstack/react-query')) return 'react-query';
            if (id.includes('node_modules/react-router') || id.includes('node_modules/@remix-run')) return 'react-router';
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/scheduler/')) return 'react-core';
            if (id.includes('node_modules/lucide-react')) return 'lucide-icons';
            if (id.includes('node_modules/date-fns')) return 'date-fns';
            if (id.includes('node_modules/zustand')) return 'zustand';
            if (id.includes('node_modules/clsx') || id.includes('node_modules/tailwind-merge')) return 'ui-utils';
            if (id.includes('node_modules/@sentry')) return 'sentry';
            if (id.includes('node_modules/posthog-js')) return 'posthog';
          }
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    test: {
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/.kilo/**',
        '**/coverage/**',
      ],
    },
  };
});
