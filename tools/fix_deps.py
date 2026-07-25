import json

with open('package.json', 'r') as f:
    data = json.load(f)

dev_deps = data.get('devDependencies', {})
if 'dependencies' not in data:
    data['dependencies'] = {}

for k, v in dev_deps.items():
    data['dependencies'][k] = v

data['devDependencies'] = {}

with open('package.json', 'w') as f:
    json.dump(data, f, indent=2)

print("Merged devDependencies into dependencies")
