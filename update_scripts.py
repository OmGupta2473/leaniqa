import json

with open('package.json', 'r') as f:
    data = json.load(f)

data['scripts']['build'] = "vite build"
data['scripts']['start'] = "node server.ts"

with open('package.json', 'w') as f:
    json.dump(data, f, indent=2)
