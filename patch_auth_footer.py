import re

with open('src/features/auth/pages/AuthPage.tsx', 'r') as f:
    content = f.read()

# Make sure useNavigate is imported
if 'import { useNavigate' not in content:
    content = content.replace("import { useState, FormEvent, useEffect } from 'react';", "import { useState, FormEvent, useEffect } from 'react';\nimport { useNavigate } from 'react-router-dom';")

# Ensure navigate is declared in the component
if 'const navigate = useNavigate();' not in content:
    content = content.replace("export function AuthPage() {\n", "export function AuthPage() {\n  const navigate = useNavigate();\n")

# Replace footer buttons
old_footer = """          {/* Footer */}
          <div className="flex justify-center gap-6 text-[12px] font-medium text-[rgba(255,255,255,0.3)] mt-8">
            <button type="button" className="hover:text-[rgba(255,255,255,0.6)] transition-colors cursor-pointer min-h-[44px] min-w-[44px]">Privacy Policy</button>
            <button type="button" className="hover:text-[rgba(255,255,255,0.6)] transition-colors cursor-pointer min-h-[44px] min-w-[44px]">Terms of Service</button>
          </div>"""

new_footer = """          {/* Footer */}
          <div className="flex justify-center gap-6 text-[12px] font-medium text-[rgba(255,255,255,0.3)] mt-8">
            <button onClick={() => navigate('/privacy')} type="button" className="hover:text-[rgba(255,255,255,0.6)] transition-colors cursor-pointer min-h-[44px] min-w-[44px]">Privacy Policy</button>
            <button onClick={() => navigate('/terms')} type="button" className="hover:text-[rgba(255,255,255,0.6)] transition-colors cursor-pointer min-h-[44px] min-w-[44px]">Terms of Service</button>
          </div>"""

content = content.replace(old_footer, new_footer)

with open('src/features/auth/pages/AuthPage.tsx', 'w') as f:
    f.write(content)
