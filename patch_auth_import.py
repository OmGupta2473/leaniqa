import re

with open('src/features/auth/pages/AuthPage.tsx', 'r') as f:
    content = f.read()

content = content.replace("import { useLocation } from 'react-router-dom';", "import { useLocation, useNavigate } from 'react-router-dom';")

with open('src/features/auth/pages/AuthPage.tsx', 'w') as f:
    f.write(content)
