import json

with open('package.json', 'r') as f:
    data = json.load(f)

data['scripts'] = {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "tsc --noEmit"
}

with open('package.json', 'w') as f:
    json.dump(data, f, indent=2)
