import json

with open('package.json', 'r') as f:
    data = json.load(f)

data['scripts'] = {
    "dev": "vite",
    "build": "vite build",
    "clean": "rm -rf dist",
    "lint": "tsc --noEmit",
    "preview": "vite preview"
}

with open('package.json', 'w') as f:
    json.dump(data, f, indent=2)

print("Fixed scripts")
