import re

with open("src/router/routes.tsx", "r") as f:
    content = f.read()

# Add import for LandingPage
import_str = "const LandingPage = lazy(() => import('@/features/landing/pages/LandingPage').then(module => ({ default: module.LandingPage })));"
if import_str not in content:
    content = content.replace("const NotFoundPage", import_str + "\nconst NotFoundPage")

# Replace RootRedirect at '/' with LandingPage inside GuestRoute
old_root = """      {
        path: '/',
        element: <RootRedirect />
      },"""

new_root = """      {
        path: '/',
        element: <GuestRoute />,
        children: [
          {
            index: true,
            element: <Suspense fallback={<ScreenSkeleton />}><LandingPage /></Suspense>,
            handle: { title: 'LeanIQA - AI Body Transformation Coach' }
          }
        ]
      },"""

content = content.replace(old_root, new_root)

with open("src/router/routes.tsx", "w") as f:
    f.write(content)
