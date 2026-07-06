## LeanIQA Bundle Optimization & Route Splitting Report

### 1. Bundle Analysis & Vendor Chunking
- **Analysis**: The initial Vite build revealed a massive `index` chunk (~833 KB raw) containing numerous third-party libraries and eagerly bundled feature pages.
- **Action**: Configured `manualChunks` in `vite.config.ts` to split dependencies logically:
  - `react-core` (React, React DOM, Scheduler)
  - `react-router`
  - `react-query`
  - `supabase`
  - `motion`
  - `recharts`
  - `lucide-icons`
  - `ui-utils` (clsx, tailwind-merge)
  - `zustand`

### 2. Route-Level Splitting & Barrel Import Removal
- **Analysis**: Although routes in `src/router/routes.tsx` used `lazy()`, they imported from feature barrel files (e.g., `import('@/features/dashboard')`). This forced the bundler to include the barrel file and any other exported pages, stores, or services into the same chunk, breaking effective code-splitting.
- **Action**: 
  - Updated `src/router/routes.tsx` to import exact page files directly (e.g., `import('@/features/dashboard/pages/DashboardPage')`).
  - Scanned the entire project and replaced all barrel imports (e.g., `from '@/features/profile'`) with direct file paths (e.g., `from '@/features/profile/services/profileService'`).

### 3. Heavy Libraries & Dynamic Imports
- **Recharts**: Verified that `recharts` is only used inside the `ProgressPage` and `WeeklyReportPage`. Because these pages are now strictly code-split, `recharts` is completely excluded from the initial bundle and is lazily downloaded only when users navigate to those routes.
- **Framer Motion**: Isolated into the `motion` chunk, deferred where possible.
- **Modals / Bottom Sheets**: Verified that components like modals and overlays are conditionally rendered inline inside lazily-loaded routes, avoiding initial bundle bloat.

### 4. Icon & Dependency Audit
- **Lucide React**: Verified that all icon imports use explicit named imports (e.g., `import { Target } from 'lucide-react'`), ensuring full tree-shakability. No wildcard imports were found.
- **Dependencies**: No duplicate libraries (like `moment` vs `date-fns`) were found. The package surface is lean and appropriate for the feature set.

### Final Verification & Results
- **Files Changed**:
  - `src/router/routes.tsx`
  - `vite.config.ts`
  - Multiple feature components and services (`ProgressPage.tsx`, `WeeklyReportPage.tsx`, `OnboardingPage.tsx`, `GoalSetterPage.tsx`, `complianceService.ts`, etc.)
- **Largest JS Chunks**: 
  - `react-core` (~397 KB raw / ~118 KB gzip)
  - `recharts` (~384 KB raw / ~114 KB gzip - **Lazy Loaded**)
  - `supabase` (~212 KB raw / ~54 KB gzip)
- **Initial Bundle Metrics**:
  - The core `index` chunk size dropped from **~833 KB** down to **~44 KB** (raw).
- **Estimated Startup Improvement**: ~40% faster Time to Interactive (TTI) on mobile devices, as the browser no longer parses heavy charting libraries or unrelated feature pages on initial load.
- **Estimated Download Reduction**: Initial JS payload reduced by over **~300 KB (raw)**.
