import json
import os

with open('package.json', 'r') as f:
    data = json.load(f)

# Remove server-related scripts
if 'start' in data['scripts']:
    del data['scripts']['start']

data['scripts']['build'] = "vite build"
data['scripts']['dev'] = "vite"

# Write back
with open('package.json', 'w') as f:
    json.dump(data, f, indent=2)

# Delete server.ts
if os.path.exists('server.ts'):
    os.remove('server.ts')
    print("Deleted server.ts")

if os.path.exists('dist/server.cjs'):
    os.remove('dist/server.cjs')
