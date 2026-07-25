import re

with open('src/shared/components/Sidebar.tsx', 'r') as f:
    content = f.read()

# Add useNavigate import if not present
if "useNavigate" not in content:
    content = content.replace("import { NavLink } from 'react-router-dom';", "import { NavLink, useNavigate } from 'react-router-dom';")

# Add const navigate = useNavigate(); inside Sidebar
if "const navigate = useNavigate();" not in content:
    content = content.replace("export function Sidebar({ className }: { className?: string }) {", "export function Sidebar({ className }: { className?: string }) {\n  const navigate = useNavigate();")

with open('src/shared/components/Sidebar.tsx', 'w') as f:
    f.write(content)

print("Sidebar patched successfully")
