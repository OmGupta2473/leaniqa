import re

with open('src/router/routes.tsx', 'r') as f:
    content = f.read()

# Add import
if "import { SaveAccountPrompt }" not in content:
    content = content.replace("import { RouteMetadata } from '@/shared/components/RouteMetadata';", "import { RouteMetadata } from '@/shared/components/RouteMetadata';\nimport { SaveAccountPrompt } from '@/shared/components/SaveAccountPrompt';")

# Add to RootLayout
if "<SaveAccountPrompt />" not in content:
    content = content.replace("<Outlet />", "<Outlet />\n      <SaveAccountPrompt />")

with open('src/router/routes.tsx', 'w') as f:
    f.write(content)
