import re

with open('vite.config.ts', 'r') as f:
    content = f.read()

manual_chunks = """          manualChunks: (id) => {
            if (id.includes('node_modules/recharts') || id.includes('node_modules/d3')) {
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
            if (id.includes('node_modules/@sentry')) {
              return 'sentry';
            }
            if (id.includes('node_modules/posthog-js')) {
              return 'posthog';
            }
            if (id.includes('node_modules/@google/genai')) {
              return 'google-genai';
            }
          }"""

content = re.sub(r'manualChunks: \(id\) => \{.*?\}(?=\s*\}\s*\})', manual_chunks, content, flags=re.DOTALL)

with open('vite.config.ts', 'w') as f:
    f.write(content)
