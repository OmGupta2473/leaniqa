import re

with open('src/shared/components/Sidebar.tsx', 'r') as f:
    content = f.read()

content = content.replace('import { NavLink } from "react-router-dom";', 'import { NavLink, useNavigate } from "react-router-dom";')

with open('src/shared/components/Sidebar.tsx', 'w') as f:
    f.write(content)

print("Import patched successfully")
