import sys

with open('vite.config.ts', 'r') as f:
    content = f.read()

target = """        includeAssets: ['LQ.png'],
        manifest: {
          name: 'LeanIQA',
          short_name: 'LeanIQA',
          description: 'Your Smart Fitness Companion',
          theme_color: '#080809',
          background_color: '#080809',
          display: 'standalone',
          icons: [
            {
              src: 'LQ.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'LQ.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'LQ.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },"""

replacement = """        includeAssets: ['LQ-64.png', 'LQ-192.png', 'LQ-512.png', 'LQ.png'],
        manifest: {
          name: 'LeanIQA',
          short_name: 'LeanIQA',
          description: 'Your Smart Fitness Companion',
          theme_color: '#080809',
          background_color: '#080809',
          display: 'standalone',
          icons: [
            {
              src: 'LQ-192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'LQ-512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'LQ-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: 'LQ.png',
              sizes: '1254x1254',
              type: 'image/png'
            }
          ]
        },"""

if target in content:
    content = content.replace(target, replacement)
    with open('vite.config.ts', 'w') as f:
        f.write(content)
    print("Replaced successfully")
else:
    print("Target not found!")
