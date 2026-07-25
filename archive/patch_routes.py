import re

with open("src/router/routes.tsx", "r") as f:
    c = f.read()

old_route = """      {
        path: '/',
        element: <Suspense fallback={<ScreenSkeleton />}><LandingPage /></Suspense>,
        handle: { title: 'LeanIQA' }
      },"""

new_route = """      {
        path: '/',
        element: <GuestRoute />,
        children: [
          {
            index: true,
            element: <Suspense fallback={<ScreenSkeleton />}><LandingPage /></Suspense>,
            handle: { title: 'LeanIQA' }
          }
        ]
      },"""

c = c.replace(old_route, new_route)

with open("src/router/routes.tsx", "w") as f:
    f.write(c)

