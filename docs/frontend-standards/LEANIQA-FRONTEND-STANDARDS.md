# LeanIQA Frontend Standards (Apple-style, smooth, professional)

**Read this whole file before you write or change ANY frontend code.**
Put it in the repo at `docs/frontend-standards/LEANIQA-FRONTEND-STANDARDS.md`. The reference implementation of everything below is the Weekly Report v2 screen (`src/features/reports/components/weekly/`): when unsure, copy how that screen does it.

Values in this file come from your real code (`src/index.css` `@theme`, `features/reports/components/motion.ts`, `weeklyReport.css`). Contrast ratios are calculated, not measured on a device.

---

## 0. The 15 iron rules (break one and you must STOP and ask)

1. **Never use Tailwind `text-[Npx]` classes.** `src/index.css` remaps many of them with `!important` (for example `text-[17px]` renders at 20px, `text-[32px]` at 40px). Use the type roles in section 2.2.
2. **Animate only `transform`, `opacity` and SVG `stroke-dashoffset`.** Never animate `width`, `height`, `top`, `left`, `box-shadow`, `filter` or `backdrop-filter`.
3. **At most 2 `backdrop-filter` layers on screen at once** (the sheet scrim is one). Cards get their "glass" from gradient fills, not blur.
4. **At most 1 looping animation on screen** (a skeleton pulse counts). Everything else plays once.
5. **Every screen wraps its animated content in `<MotionConfig reducedMotion="user">`.** (The app has no global one yet.)
6. **Every interactive thing is a real `<button>` or `<a>/<Link>`.** Never a clickable `div`. Minimum hit area 44×44 px.
7. **Never remove the focus ring.** Never use `outline-none` (a global rule makes it remove focus entirely).
8. **Every screen has all five states:** loading, empty, error (with retry), offline, and filled. Plus "first-time user".
9. **No new npm dependency** without the lead's written approval. Icons: `lucide-react` only. No Tabler, no emoji as UI icons (emoji only for award symbols).
10. **Days are IST date keys** (`getKolkataDateString()` from `@/shared/utils/timezone`). Never `new Date().toISOString().slice(0,10)` or browser-local dates.
11. **No pure black page backgrounds.** Pages use `var(--color-bg-base)` (`#080809`).
12. **No magic colours or sizes.** Use the tokens in section 2. If a value is missing, STOP and ask.
13. **Pages never add their own bottom padding, `min-h-[100dvh]` or `env(safe-area-inset-*)`.** `AppLayout` already pads the bottom (100px). The app's `viewport-fit=cover` is not set, so safe-area values are 0 today.
14. **Pure logic lives in `utils/` with Vitest tests.** Components only render. No `any`. No `console.log` (use `devLog`/`devWarn` from `@/shared/utils/logger`).
15. **Health-safe copy.** Never praise eating far below target, never give medical claims, never call rule-based text "AI".

---

## 1. Procedure for every UI task (do these in order)

1. **Restate** the task in 2 lines and list the screens/components you will touch. Anything else is out of scope.
2. **List the states** the screen needs (loading, empty, error, offline, filled, first-time, long text, 0/1/many items).
3. **Find the reusable parts**: open the Weekly Report components first (`WeekHeader`, `MetricCompareCard`, `InsightsCard`, `WeekHistorySheet`, `weeklyReport.css`). Reuse patterns. Do not invent new ones.
4. **Pick tokens** from section 2 only (colour, type role, spacing, radius, material).
5. **Pick motion** from section 3 only (named spring or easing). Decide what animates on entrance, on press, on change.
6. **Build presentational components first** (props in, JSX out, no data fetching), then the container that fetches.
7. **Style in a feature CSS file** with a short prefix (like `wr-`), imported by the page so it code-splits. Do not edit `src/index.css`.
8. **Accessibility pass** (section 7) while building, not after.
9. **Verify** (section 11): typecheck, tests, build, preview at 360 / 390 / 430 / 1280 px, reduced-motion on.
10. **Report** with real command output. Anything you could not check goes under "NOT VERIFIED".

---

## 2. Foundations (exact values)

### 2.1 Colour

| Token / value | Use |
|---|---|
| `--color-bg-base` `#080809` | page background (always) |
| `--color-bg-raised` `#111113`, `--color-bg-elevated` `#1A1A1C`, `--color-bg-overlay` `#222224` | menus, popovers, solid sheets |
| Glass fill (section 2.5) | all cards |
| Text primary `rgba(255,255,255,0.92)` (or `#f5f5f7` on glass screens) | titles, numbers |
| Text secondary `rgba(255,255,255,0.55)` (glass screens: `rgba(235,235,245,0.62)`) | body, captions. Contrast about 5.9:1 on `#080809`: OK |
| Text tertiary `rgba(255,255,255,0.32)` | decoration only. Contrast about 2.6:1: **never for readable text** |
| Quaternary `rgba(255,255,255,0.18)` | disabled, dividers |
| Brand lime `#D4FF00` | primary button, focus ring, "good", selected state. Text on lime is `#0A0A0A` |
| Good `#D4FF00` · Warn `#FFB020` · Bad `#FF5C4D` · Info `#5AC8FA` | semantic. Tinted backgrounds use the same colour at 13–15% alpha |
| Macros: protein lime, carbs `#5AC8FA`, fat `#FFB020` | everywhere macros appear, no exceptions |
| Streak flame `#FF4D1C → #FF8B1C` | streak only |
| Day-bar tiers: great lime→green gradient, okay amber gradient, poor coral gradient | weekly day bars |

**Never use:** `zinc-500/600` for text on dark (fails contrast), legacy `.text-purple/.text-teal/.text-green/.text-pink` (all map to lime), `bg-black`, ad-hoc `rgba(255,255,255,0.0x)` fills.

Colour is never the only signal: pair it with an icon, a sign (+/−) or a word.

### 2.2 Type roles (use these, never `text-[Npx]`)

| Role | Size / weight / tracking / line-height | Use |
|---|---|---|
| Display number | 40–56 / 700 / −0.03em / 1.0, `tabular-nums` | hero stats |
| Screen title | 30 / 700 / −0.02em / 1.1 | one per screen |
| Card title | 17 / 650 / −0.01em / 1.25 | |
| Headline | 15 / 600 / 1.3 | list titles, button text |
| Body | 15 / 400 / 1.45, secondary colour | |
| Caption | 12.5 / 500 / 1.4, secondary colour | helper text |
| Label (eyebrow) | 11 / 600 / +0.08em / UPPERCASE | section labels. 11 is the minimum size anywhere |

Rules: numbers always `font-variant-numeric: tabular-nums`. Thousands use a comma (`2,050`). Units are lighter and smaller than the number (`2,050 kcal`). Sentence case everywhere except Label. Max 2 weights per card.

### 2.3 Spacing (4 px grid)

Allowed values: **4, 8, 12, 16, 20, 24, 32, 40**. Page side padding 16. Gap between cards 14–16. Card padding 20 (hero) or 16 (compact). List row min height 44 (52 when it has two lines). Icon-to-text gap 8–12. Content max width **640 px**, centred.

### 2.4 Radius (tokens in `@theme`)

Chips and pills: full. Icon wells: 11–12. Inputs and small buttons: 14 (`--radius-md`). Compact cards: 20–24. Cards: 28 (`--radius-xl`). Sheet top corners: 28. Progress bars: full.

### 2.5 Materials (the "liquid glass" look without blur)

Use this recipe for every card (copied from `weeklyReport.css`, rename the prefix for your feature):

```css
.xx-glass {
  position: relative;
  border-radius: 28px;
  padding: 20px;
  background: linear-gradient(155deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.036) 46%, rgba(255,255,255,0.05) 100%);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.1), 0 18px 40px -24px rgba(0,0,0,0.9);
}
/* specular rim: bright top-left, dim bottom-right */
.xx-glass::before {
  content: ''; position: absolute; inset: 0; border-radius: inherit; padding: 1px; pointer-events: none;
  background: linear-gradient(145deg, rgba(255,255,255,0.36), rgba(255,255,255,0.06) 30%, rgba(255,255,255,0.02) 62%, rgba(255,255,255,0.14));
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude;
}
```

- Highlight card (the one thing the user should do or read first): lime tint variant (`rgba(212,255,0,0.16)` → `0.05`, lime rim).
- Colour behind the glass: one absolutely-positioned "aurora" layer with 3–5 static `radial-gradient`s spread by **percent** over the page height (see `.wr-aurora`). Static, never animated, no blur filter.
- Depth order: page (`#080809` + aurora) → glass cards → icon wells (inset highlight) → chips.
- The only allowed `backdrop-filter` is on a sheet/modal **scrim**: `blur(18px)` with an opacity fade, never animated itself.

### 2.6 Icons

`lucide-react` only. Sizes 16 / 18 / 20 / 24. Stroke width 1.75–2.25 (default 2). Always decorative (`aria-hidden`) unless the icon is the only content of a button (then the button has `aria-label`). Icon wells: 32×32, radius 11, `rgba(255,255,255,0.07)` + inset top highlight, tinted variants at 14–15% alpha.

### 2.7 Layers (z-index scale: use only these)

content 0 · sticky header 20 · bottom nav 50 · modal scrim 100 · sheet 110 · celebration 120 · toast 9999.

---

## 3. Motion (exact)

Principle: motion explains cause and effect, is quick, and never blocks. Springs for things that move, short eases for things that fade. Everything must be interruptible (do not use long `delay` for interactive controls).

**Import presets, do not invent timings.** From `@/features/reports/components/motion` (a move to `shared/` is a separate task):

| Name | Value | Use |
|---|---|---|
| `springTap` | spring 400 / 25 | press feedback, toggles, chips |
| `transitionFadeSlide` | spring 300 / 30 | cards entering, selection changes |
| `transition.springFast` | spring 300 / 30 / mass 0.6 | small UI (menus, popovers) |
| `slideUpVariants` | spring 320 / 32 / mass 0.9, exit 0.28 s ease-in | bottom sheets |
| `springSettle` | spring 120 / 14 | number count-up (`AnimatedNumber`, `CountUp`) |
| `ease.outExpo` `[0.16,1,0.3,1]` | 0.4–0.6 s | page/section reveal |
| `ease.smooth` `[0.4,0,0.2,1]` | 0.15–0.25 s | fades, colour changes |
| `transitionStagger` | 0.05 s | gap between siblings |

Rules:
- **Entrance:** cards `opacity 0→1`, `y 14→0`, `transitionFadeSlide`. Stagger 0.05 s, **capped at 8 items** (later items appear together). Total entrance ≤ 600 ms.
- **Press:** `whileTap={{ scale: 0.97 }}` with `springTap`. Buttons 0.97, large cards 0.985. No bounce on release.
- **Hover:** only inside `@media (hover: hover) and (pointer: fine)`. Never `whileHover` on touch (it sticks).
- **Progress and rings:** animate `scaleX` (bars, `transform-origin: left`) or `stroke-dashoffset` (rings), 0.9–1.1 s `ease.outExpo`.
- **Numbers:** count up once on first show with `springSettle`; never re-count on every re-render.
- **Selection change** (segment, day, tab): cross-fade 0.16 s (`AnimatePresence mode="wait"`) plus 8 px `y`. No height animation.
- **Sheets:** slide up with `slideUpVariants`, scrim fades 0.25 s. Dismiss: Escape, scrim tap, close button.
- **Shared element:** `layoutId` only for the active tab/segment indicator.
- **Reduced motion:** wrap the screen in `<MotionConfig reducedMotion="user">`. In that mode transforms are skipped and content simply appears. Also add `@media (prefers-reduced-motion: reduce)` in your CSS to stop any CSS animation.
- **Haptics:** `haptics.tap()` on selection/press, `haptics.success()` on completion. They use `navigator.vibrate`, so they work on **Android only** (silent on iPhone): never rely on them.

Pattern (copy this shape):

```tsx
import { MotionConfig, motion } from 'motion/react';
import { springTap, transitionFadeSlide, transitionStagger } from '@/features/reports/components/motion';

<MotionConfig reducedMotion="user">
  {items.map((item, i) => (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...transitionFadeSlide, delay: Math.min(i, 7) * transitionStagger }}
    >
      <motion.button type="button" whileTap={{ scale: 0.97 }} transition={springTap} className="xx-row">…</motion.button>
    </motion.div>
  ))}
</MotionConfig>
```

---

## 4. Component recipes

| Component | Exact spec |
|---|---|
| **Page shell** | `max-width: 640px; margin: 0 auto; padding: 16px 16px 28px`. Content in a vertical stack with `gap: 14px`. One `<h1>` (Screen title). No own header bar when the global `Header` is showing. |
| **Card** | the glass recipe (2.5). Title (Card title role) + optional Label above it. Clickable cards are a `<button>`/`<Link>` wrapper with press feedback. |
| **Primary button** | lime fill `#D4FF00`, text `#0A0A0A` 15/650, height 52, radius full, side padding 24, full width on mobile forms. Disabled: 40% opacity, no press animation. Loading: spinner replaces label, width unchanged. |
| **Secondary button** | glass fill (`rgba(255,255,255,0.08)`), text primary, height 48, radius full. |
| **Text button** | lime text 15/600, min hit area 44. |
| **Destructive** | secondary style with Bad `#FF5C4D` text; always confirmed in a sheet; offer Undo toast where possible. |
| **Icon button** | 44×44, radius full, glass fill, `aria-label` required. |
| **Chip / pill** | height 24–28, padding 0 10, 12/600, radius full, tint at 13–15% alpha of the semantic colour. |
| **Segmented control** | track `rgba(255,255,255,0.06)`, radius full, height 40; active pill slides with `layoutId` + `springTap`. |
| **List row** | min height 44 (52 two-line), 16 side padding, hairline divider `rgba(255,255,255,0.08)`, chevron right for navigation. |
| **Progress bar** | height 8, radius full, track `rgba(255,255,255,0.08)`, fill animates `scaleX`. Over-target colours: warn then bad, never a different shape. |
| **Ring** | SVG, stroke 10, round caps, gradient stroke, animate `stroke-dashoffset`; centre shows the number (Display number role). |
| **Input** | height 52, radius 14, fill `rgba(255,255,255,0.06)`, 16 px text minimum (iOS zoom; `index.css` already forces `max(16px, …)`), visible label above (not placeholder-only), inline error text below in Bad colour with `aria-describedby`. Use the existing `SmoothInput`. |
| **Bottom sheet** | scrim `rgba(0,0,0,0.5)` + `blur(18px)`; panel radius 28 top, glass-solid fill (`bg-elevated`), grabber 40×5, max-height 82dvh, list scrolls inside with `overscroll-behavior: contain`. `role="dialog" aria-modal="true" aria-labelledby`, focus moves to the close button, **Tab stays inside**, Escape closes, focus returns to the opener, background scroll locked with `useScrollLock`. |
| **Toast** | use the existing `Toast` provider. Success 2.5 s, error 4 s, with Undo 5 s. |
| **Skeleton** | same outer size and radius as the real card, `rgba(255,255,255,0.06)` blocks, **one** pulse on the wrapper (opacity 0.6↔1, 1.4 s). Show only if loading lasts > 150 ms. Must not cause layout shift when content arrives. |
| **Empty state** | icon well (40) + 17/650 title + 15 body (1–2 lines) + one primary button. Never a blank card. |
| **Error state** | warn icon well + "Couldn't load this" + body + "Try again" button wired to `refetch`. |
| **Offline** | if there is cached data show it with a small "Offline" chip; if not, show the offline message and a "Retry" button. |
| **Chart** | plain SVG (no new chart library). One accent colour, 2 px lines, round joins, last point emphasised, no gridlines except a faint baseline, values in text for screen readers. |

---

## 5. Screen states checklist (every screen must pass)

- Loading skeleton matches layout (no jump). · Empty (0 items) · Error with retry · Offline · Partial data (some fields null: show "–", never `NaN`/`undefined`) · 1 item · many items (100+) · long text (wraps or truncates with ellipsis, never overflows) · first-time user · very small screen 360 px · large phone 430 px · desktop 1280 px (content stays 640 px wide) · reduced motion · keyboard only.

---

## 6. Data and behaviour rules

- Components never call Supabase. Pattern: `services/*Service.ts` → `hooks/use*.ts` (TanStack Query) → container component → presentational components.
- Query keys: `[feature, ...params]`. Data that changes while the screen is open: `staleTime: 0`, `refetchOnMount: 'always'`. Immutable data: `staleTime: Infinity`.
- Writes are **optimistic** with rollback and an error toast. Debounce typing 300 ms. Disable a button while its request is in flight.
- Never block the whole screen for a non-critical request; render what you have.
- Navigation state lives in the URL (`useSearchParams`), validated: bad values fall back to a safe default.
- Scroll: the scroll container is `.app-scroll`. Reset it on route/param change (`document.querySelector('.app-scroll')?.scrollTo(0, 0)`).
- Lazy routes: `lazy(() => import(...).then(m => ({ default: m.Page })))` with a skeleton `Suspense` fallback.
- Time and dates: IST keys for logic; display as `Oct 4 – Oct 10, 2026`, `Thursday, Oct 8`.
- Units: `kcal`, `g`, `kg`, `%`. Numbers rounded for display (calories and grams whole, weight 1 decimal).

---

## 7. Accessibility (exact)

- Semantics: buttons are `<button type="button">`, navigation is `<Link>`. Headings in order (`h1` once, then `h2`). Landmarks: do not nest `<nav>`.
- Labels: icon-only buttons have `aria-label`. Toggles use `aria-pressed`; tabs `role="tab"` + `aria-selected`; progress has `role="progressbar"` with `aria-valuenow/min/max`.
- Focus: visible lime ring (global `:focus-visible` already exists; do not remove). Logical tab order; focus moves into a dialog and returns on close.
- Contrast: body text ≥ 4.5:1, large text and icons ≥ 3:1. Tertiary text colour is banned for readable text.
- Targets ≥ 44×44 px with ≥ 8 px between neighbours.
- Live regions: toasts `aria-live="polite"` (errors `role="alert"`). Loading states `aria-busy="true"` on the region.
- Motion: reduced-motion honoured (rule 5). No flashing.
- Text zoom to 200% must not clip content: use `min-height`, not fixed heights, for text containers.

---

## 8. Performance budgets

- Page chunk ≤ 60 kB JS (≤ 20 kB gzip) and ≤ 15 kB CSS. (Weekly Report v2: 31 kB / 9 kB gzip and 9 kB CSS.)
- ≤ 2 `backdrop-filter` layers; no `filter: blur()` on scrolling content; no `mix-blend-mode` on lists.
- Lists over 100 rows: render in pages of 50 or use CSS `content-visibility: auto`. No full-list animations.
- `will-change` only on the element currently animating, removed after.
- Memoise only expensive pure computations (`useMemo`) and stable callbacks passed to memoised children. Do not wrap everything in `memo`.
- No network or heavy compute in render. Derived data comes from pure functions in `utils/` (tested).
- Check with Chrome DevTools "4× CPU slowdown": scrolling and entrance animation must stay smooth (no dropped frames you can see).

---

## 9. Copy and tone

- Sentence case, short, supportive, second person ("You logged 6 of 7 days"). No shaming ("failed", "bad", "lazy"). No exclamation marks except real celebrations (awards).
- Always say what to do next ("Add a protein-first food at your next meal").
- Rule-based text is labelled "Coach insights" / "Based on your logs". Only a real model may use the word "AI".
- Health safety: never praise eating well below target; never suggest eating below the user's own target; no diagnoses or medical claims; flag fast weight loss gently.
- Indian context: prices in ₹, IST, food examples that work for vegetarian and non-vegetarian users ("dal, paneer, curd, eggs, chicken, fish or whey, whichever fits your diet").
- Plan wording: say "Unlimited detailed meal history while Premium is active". Never "lifetime".

---

## 10. Code conventions

- Folders: `features/<name>/{pages,components,services,hooks,utils,store}`. Components in PascalCase files, hooks `useX.ts`, utils camelCase. One component per file, ≤ 250 lines (split if larger).
- Presentational components take typed props and never fetch. Containers wire hooks to presentational components.
- Styling: feature CSS file with a prefix (`wr-`, `ps-`…) for materials, type roles and anything with gradients; Tailwind utilities only for simple layout (flex, gap, grid, hidden). No inline `style` except dynamic values (width %, CSS variables).
- Imports use `@/`. No default exports for components. No `any`; no `as unknown as` except at a Supabase boundary with a comment.
- Tests: Vitest for every pure function and every rule; UI is checked with the preview harness and screenshots.
- Do not touch these inside feature work (report them instead): `src/index.css`, `AppLayout`, `Header`, `BottomNav`, `routes.tsx` (except the lead-approved lines), `authService`.

---

## 11. Verification protocol (before you say "done")

1. `npm run lint` (typecheck): no new error vs baseline; **zero** errors in files you touched.
2. `npm test`: no new failure; new logic has tests.
3. `npm run build`: succeeds; report the chunk sizes of your page (limits in section 8).
4. Preview every state at **360, 390, 430 and 1280 px** (use a preview harness with sample data like `docs/weekly-report/dev-preview/`). Take screenshots and compare them to the previous screens. Delete the harness before committing.
5. Reduced-motion on: everything still appears and works.
6. Keyboard only: reach every control, see the focus ring, Escape closes overlays.
7. Run the self-review (section 12) and paste its result.

**Definition of done:** all 7 steps pass, the diff touches only the files you listed, and the report is complete.

---

## 12. Anti-patterns → replacements

| Do not | Do instead |
|---|---|
| `text-[17px]`, `text-[10px]`, any `text-[Npx]` | type role class in the feature CSS (2.2) |
| `<div onClick>` | `<button type="button">` |
| `className="outline-none"` | keep the default focus ring |
| `bg-black`, `#000` page | `var(--color-bg-base)` |
| `backdrop-blur-xl` on every card | glass gradient recipe (2.5); blur only on a scrim |
| Animate `width`/`height`/`box-shadow` | animate `transform: scale…` / opacity; use `scaleX` for bars |
| `whileHover` on all devices | `@media (hover:hover) and (pointer:fine)` CSS hover |
| `animate-pulse` on many items | one pulse on the skeleton wrapper |
| Infinite glow/pulse loops | a static gradient glow |
| `transition-all` | name the property (`transform`, `opacity`) |
| `min-h-[100dvh]`, `pb-[calc(100px+env(safe-area-inset-bottom))]` in a page | nothing: `AppLayout` already handles it |
| Hard-coded `#D4FF00`, `rgba(255,255,255,0.03)` in TSX | token / feature CSS variable |
| `text-zinc-500` on dark | secondary text colour |
| `new Date().toISOString().slice(0,10)` | `getKolkataDateString()` |
| Fetching inside a presentational component | hook + service |
| Placeholder-only inputs | visible label |
| Emoji as UI icons | lucide icon |
| `alert()` / `confirm()` | sheet + toast |
| Loading spinner for the whole page | skeleton in the same layout |
| New library "just for this" | ask the lead; prefer plain SVG/CSS |

---

## 13. Known app-wide issues (do NOT fix in feature work; list them in your report if they affect you)

`viewport-fit=cover` missing (safe-area = 0) · no global `MotionConfig` · motion presets live under `features/reports` · global `Header` icons are clickable divs and use a Tabler CDN icon · `BottomNav` renders a nested `<nav>` · some pages add their own bottom padding on top of `AppLayout` · `useAuthSession` is mounted in many places · `authService.getUserId()` can sign the user out when offline · legacy CSS classes in `index.css` (`premium-*`, `stat-tile`, `award-*`, `physique-*`) are used by older screens: do not add new uses.

---

## 14. Prompts

### 14.1 The lead's UI request template (fill this in for every UI change)

```
SCREEN / FEATURE: <name and route>
GOAL (one sentence): <what the user can do or understand after this change>
WHAT MUST STAY THE SAME: <behaviour, data, routes>
STATES TO COVER: loading / empty / error / offline / filled / first-time / <extra>
DATA: <which service/hook, or "sample data only">
REFERENCE: <screenshot or "match the Weekly Report v2 style">
EXTRA RULES: <anything special>
```

### 14.2 Kickoff prompt for the codebase AI

```
Read docs/frontend-standards/LEANIQA-FRONTEND-STANDARDS.md completely before doing anything.
Then do this UI task exactly: <paste the filled template>.
Follow section 1 step by step. Obey the 15 iron rules. Maximum 2 attempts per failing command, then stop and show me the output.
Only touch files you list in step 1. When finished, run section 11 and send the report with real command output.
```

### 14.3 Self-review the AI must paste at the end

```
[ ] No text-[Npx] classes, no inline font sizes
[ ] Only transform/opacity/stroke-dashoffset animated; no looping animation beyond one skeleton
[ ] <= 2 backdrop-filter layers; none on cards
[ ] MotionConfig reducedMotion="user" wraps the screen
[ ] All interactive elements are buttons/links, >= 44px, with labels; focus ring visible
[ ] Loading / empty / error / offline / filled states all built and previewed
[ ] Tokens only (colour, spacing, radius, type); no magic values
[ ] IST date keys; no browser-local dates
[ ] No new dependency; lucide icons only
[ ] Copy is sentence case, supportive, health-safe; no "AI" label on rule-based text
[ ] Previewed at 360 / 390 / 430 / 1280 px; screenshots attached
[ ] typecheck, tests, build: outputs pasted; chunk size within budget
[ ] Diff touches only the listed files
```