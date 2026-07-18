import re

with open("vite.config.ts", "r") as f:
    c = f.read()

c = c.replace(
    "includeAssets: ['favicon.svg'],",
    "includeAssets: ['favicon.svg', 'pwa-192x192.png', 'pwa-512x512.png', 'maskable-512x512.png'],"
)

old_icons = """          icons: [
            {
              src: '/favicon.svg',
              sizes: '192x192 512x512',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            }
          ]"""

new_icons = """          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ]"""

c = c.replace(old_icons, new_icons)

with open("vite.config.ts", "w") as f:
    f.write(c)

