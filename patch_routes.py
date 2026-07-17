import re

with open('src/router/routes.tsx', 'r') as f:
    content = f.read()

# Replace the GuestRoute wrapping the LandingPage
pattern = r"\{\s*path:\s*'/',\s*element:\s*<GuestRoute\s*/>,\s*children:\s*\[\s*\{\s*index:\s*true,\s*element:\s*<Suspense fallback=\{<ScreenSkeleton />\}><LandingPage /></Suspense>,\s*handle:\s*\{\s*title:\s*'LeanIQA'\s*\}\s*\}\s*\]\s*\}"

replacement = """{
        path: '/',
        element: <Suspense fallback={<ScreenSkeleton />}><LandingPage /></Suspense>,
        handle: { title: 'LeanIQA' }
      }"""

new_content = re.sub(pattern, replacement, content)

with open('src/router/routes.tsx', 'w') as f:
    f.write(new_content)

print("Replaced successfully" if new_content != content else "Regex failed")
