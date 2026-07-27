import re

with open('src/router/routes.tsx', 'r') as f:
    content = f.read()

# Add imports for new pages
new_imports = """
const PrivacyPage = lazy(() => import('@/features/legal/pages/PrivacyPage').then(module => ({ default: module.PrivacyPage })));
const TermsPage = lazy(() => import('@/features/legal/pages/TermsPage').then(module => ({ default: module.TermsPage })));
const RefundPage = lazy(() => import('@/features/legal/pages/RefundPage').then(module => ({ default: module.RefundPage })));
import { PublicLayout } from './layouts/PublicLayout';
"""

content = content.replace("import { AppLoadingScreen } from '@/shared/components/AppLoadingScreen';", new_imports + "import { AppLoadingScreen } from '@/shared/components/AppLoadingScreen';")

# Add the routes
new_routes = """
      {
        element: <PublicLayout />,
        children: [
          { path: '/privacy', element: <Suspense fallback={<ScreenSkeleton />}><PrivacyPage /></Suspense>, handle: { title: 'Privacy Policy' } },
          { path: '/terms', element: <Suspense fallback={<ScreenSkeleton />}><TermsPage /></Suspense>, handle: { title: 'Terms of Service' } },
          { path: '/refund', element: <Suspense fallback={<ScreenSkeleton />}><RefundPage /></Suspense>, handle: { title: 'Refund Policy' } }
        ]
      },
      {
        path: '/redirect',"""

content = content.replace("      {\n        path: '/redirect',", new_routes)

with open('src/router/routes.tsx', 'w') as f:
    f.write(content)
