import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg'],
        manifest: {
          name: 'LeanIQA',
          short_name: 'LeanIQA',
          description: 'Your Smart Fitness Companion',
          theme_color: '#080809',
          background_color: '#080809',
          display: 'standalone',
          icons: [
            {
              src: '/favicon.svg',
              sizes: '192x192 512x512',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}']
        }
      })
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules/recharts')) {
              return 'recharts';
            }
            if (id.includes('node_modules/framer-motion') || id.includes('node_modules/motion')) {
              return 'motion';
            }
            if (id.includes('node_modules/@supabase')) {
              return 'supabase';
            }
            if (id.includes('node_modules/@tanstack/react-query')) {
              return 'react-query';
            }
            if (id.includes('node_modules/react-router') || id.includes('node_modules/@remix-run')) {
              return 'react-router';
            }
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/scheduler/')) {
              return 'react-core';
            }
            if (id.includes('node_modules/lucide-react')) {
              return 'lucide-icons';
            }
            if (id.includes('node_modules/date-fns')) {
              return 'date-fns';
            }
            if (id.includes('node_modules/zustand')) {
              return 'zustand';
            }
            if (id.includes('node_modules/clsx') || id.includes('node_modules/tailwind-merge')) {
              return 'ui-utils';
            }
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
  };
});
