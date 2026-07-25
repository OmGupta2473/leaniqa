import json

with open("tsconfig.json", "r") as f:
    content = json.load(f)

if "exclude" not in content:
    content["exclude"] = []
if "dist" not in content["exclude"]:
    content["exclude"].append("dist")

with open("tsconfig.json", "w") as f:
    json.dump(content, f, indent=2)
