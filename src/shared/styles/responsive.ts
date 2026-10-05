/**
 * Responsive foundation.
 *
 * Every mobile screen in the app uses the same shell: a fixed header, a
 * flexible middle that shrinks to fit, and a fixed footer. This module
 * provides the one piece of JS that the shell needs: knowing how tall the
 * current viewport is, and whether we're in compact/short territory.
 *
 * All other responsive behavior is CSS-only — see the FLUID TOKENS block
 * below for the clamp() patterns that go with this hook.
 *
 * Thresholds:
 *   - 700px: compact territory (iPhone SE class, older Android mid-range)
 *   - 620px: short territory (worst case; only landscape phones and small SE)
 *
 * On the compact breakpoint, screens should shrink spacing/typography and
 * (where content genuinely can't fit) hide non-essential items. On short,
 * they should do both.
 */

import { useEffect, useState } from 'react';

export const COMPACT_THRESHOLD = 700;
export const SHORT_THRESHOLD = 620;

export interface ViewportState {
  height: number;
  isCompact: boolean;
  isShort: boolean;
}

function readViewport(): ViewportState {
  const height = typeof window !== 'undefined' ? window.innerHeight : 800;
  return {
    height,
    isCompact: height < COMPACT_THRESHOLD,
    isShort: height < SHORT_THRESHOLD,
  };
}

/**
 * Subscribe to viewport height changes.
 *
 * Uses window.innerHeight (not visualViewport) intentionally: keyboard
 * transitions don't need to trigger layout reflows on every keystroke, and
 * the initial value from useState is already correct on first paint — no
 * flash of wrong layout.
 *
 * Consumers should prefer CSS clamp() where possible and only use this hook
 * when they need to conditionally render or hide elements.
 */
export function useViewport(): ViewportState {
  const [state, setState] = useState<ViewportState>(readViewport);

  useEffect(() => {
    const update = () => setState(readViewport());
    window.addEventListener('resize', update, { passive: true });
    window.addEventListener('orientationchange', update, { passive: true });
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  return state;
}

/* ============================================================
 * FLUID TOKENS — reference block
 * ============================================================
 *
 * Copy these patterns when building responsive screens. They key off dvh
 * (dynamic viewport height) so they scale with the phone, not with a fixed
 * pixel assumption.
 *
 *   Fluid heading (page title):
 *     text-[clamp(1.5rem,4.5dvh,2.25rem)]
 *
 *   Fluid subheading (section title):
 *     text-[clamp(0.95rem,2.6dvh,1.15rem)]
 *
 *   Fluid body text:
 *     text-[clamp(0.8rem,2.2dvh,1rem)]
 *
 *   Fluid small / description text:
 *     text-[clamp(0.72rem,1.9dvh,0.875rem)]
 *
 *   Fluid card padding:
 *     p-[clamp(0.7rem,2.2dvh,1.25rem)]
 *
 *   Fluid gap between stacked items:
 *     gap-[clamp(0.4rem,1.4dvh,0.75rem)]
 *
 *   Fluid square icon well:
 *     w-[clamp(2rem,5.5dvh,2.75rem)] h-[clamp(2rem,5.5dvh,2.75rem)]
 *
 *   Fluid page horizontal padding:
 *     px-[clamp(1rem,4vw,1.5rem)]
 *
 *   Fluid bottom safe padding (use with env()):
 *     pb-[max(0.75rem,env(safe-area-inset-bottom))]
 *
 * ============================================================
 * SHELL PATTERN — reference block
 * ============================================================
 *
 * Every full-screen view should follow this structure:
 *
 *   <div className="flex flex-col h-[100dvh] min-h-0">
 *     <header className="flex-shrink-0">...</header>
 *     <main className="flex-1 min-h-0 overflow-y-auto">...</main>
 *     <footer className="flex-shrink-0">...</footer>
 *   </div>
 *
 * The `min-h-0` on <main> is non-negotiable. Without it, flex items refuse
 * to shrink below their content and the container grows instead — which is
 * the exact overflow bug this foundation fixes.
 *
 * Only the <main> element should ever scroll. Header and footer are always
 * visible.
 */