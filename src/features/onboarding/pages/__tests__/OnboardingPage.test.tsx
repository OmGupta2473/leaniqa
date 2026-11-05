// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

// ═══════════════════════════════════════════════════════════════════════════
// Hoisted mocks
// ═══════════════════════════════════════════════════════════════════════════
const m = vi.hoisted(() => ({
  upsertProfile: vi.fn(),
  upsertGoal: vi.fn(),
  syncCurrentWeekReport: vi.fn(),
  trackEvent: vi.fn(),
  toast: vi.fn(),
}));

// The real supabase.ts throws on module load if VITE_SUPABASE_URL/ANON_KEY are
// missing. PlanScreen never touches supabase, but the transitive import graph
// (OnboardingPage → useAuthSession → authService → offlineSyncService →
// profileService/mealService/weightService) does. Mock it so the module graph
// loads cleanly regardless of env-var presence in the test environment.
vi.mock('@/shared/utils/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
    from: vi.fn(),
  },
}));

vi.mock('@/features/profile/services/profileService', () => ({
  profileService: {
    upsertProfile: m.upsertProfile,
    upsertGoal: m.upsertGoal,
  },
}));

vi.mock('@/features/reports/utils/syncCurrentWeek', () => ({
  syncCurrentWeekReport: m.syncCurrentWeekReport,
}));

vi.mock('@/shared/utils/analytics', () => ({
  analytics: { trackEvent: m.trackEvent },
}));

vi.mock('@/shared/components/Toast', () => ({
  useToast: () => ({ toast: m.toast }),
}));

// ═══════════════════════════════════════════════════════════════════════════
// Imports AFTER mocks. useUserStore and calculatePlan are intentionally real —
// see the file header comment above.
// ═══════════════════════════════════════════════════════════════════════════
import { PlanScreen } from '../OnboardingPage';
import { useUserStore } from '@/features/profile/store/userStore';
import { calculatePlan, type OnboardingInput } from '@/shared/utils/onboardingMath';
import { EMPTY_DRAFT, type OnboardingDraft } from '../../types';

// ═══════════════════════════════════════════════════════════════════════════
// Fixtures
// ═══════════════════════════════════════════════════════════════════════════
// Same inputs onboardingMath.test.ts T-10 uses. PlanScreen builds its own
// `input` object from these same draft fields, so calculatePlan(BASE_INPUT,
// 'cut', 8, 22) in T-8 equals what PlanScreen computes internally
// (gainPace=8 and cutPace=22 are the useState defaults in PlanScreen).
const BASE_INPUT: OnboardingInput = {
  sex: 'Male',
  age: 30,
  heightCm: 180,
  weightKg: 80,
  activity: 'sedentary',
};

// EMPTY_DRAFT spread first so a future field addition to OnboardingDraft
// inherits a safe default without editing this file.
const BASE_DRAFT: OnboardingDraft = {
  ...EMPTY_DRAFT,
  step: 3,
  name: 'Test',
  sex: 'Male',
  age: 30,
  heightCm: 180,
  weightKg: 80,
  activity: 'sedentary',
  dietaryPreference: 'veg',
  goalOverride: 'cut',
  macroOverrides: null,
};

// ═══════════════════════════════════════════════════════════════════════════
// Harness
// ═══════════════════════════════════════════════════════════════════════════
function renderPlanScreen(draft: OnboardingDraft) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const harness: { commit: (() => Promise<void>) | null } = { commit: null };
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <PlanScreen
          draft={draft}
          setDraft={vi.fn()}
          onConsent={(fn) => {
            harness.commit = fn;
          }}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return harness;
}

async function clickStartTracking() {
  // findByRole retries until the button is present (defensive — plan screen
  // render is sync, but this makes the harness robust to future async
  // additions). Assert enabled so a dietaryPreference regression fails loud.
  const btn = await screen.findByRole('button', { name: /start tracking/i });
  expect(btn).not.toBeDisabled();
  fireEvent.click(btn);
}

beforeEach(() => {
  vi.clearAllMocks();
  m.upsertProfile.mockResolvedValue({ id: 'profile-1' });
  m.upsertGoal.mockResolvedValue({ id: 'goal-1' });
  m.syncCurrentWeekReport.mockReturnValue(undefined);

  // Real store is shared across tests. Both tests inspect macroOverrides after
  // commit, so start from the same baseline the app ships with: {} (empty
  // object, not { null, null, null } — that's what T-8 asserts commit writes).
  useUserStore.setState({ macroOverrides: {} });
});

afterEach(() => {
  // No vitest.config.ts → globals:true is off → RTL cannot auto-register
  // afterEach(cleanup). Without this, getByRole('button', { name: /start
  // tracking/i }) starts returning N accumulated copies from N prior tests
  // (exactly the failure mode that hit 2b on the second test).
  cleanup();
});

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════
describe('OnboardingPage — 5.1.6 PlanScreen commit', () => {
  it('T-5.1.6-7: Adjust-sheet overrides reach DB payload + store mirror', async () => {
    const draft: OnboardingDraft = {
      ...BASE_DRAFT,
      macroOverrides: { proteinG: 120, fatG: 50, carbsG: 190 },
    };

    const harness = renderPlanScreen(draft);
    await clickStartTracking();

    expect(harness.commit).toBeTypeOf('function');
    await harness.commit!();

    // DB payload: the Adjust-sheet values win over the computed plan. This is
    // the primary assertion — it proves applyMacroOverrides is wired into
    // the profileService.upsertProfile call in commit.
    expect(m.upsertProfile).toHaveBeenCalledTimes(1);
    expect(m.upsertProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        protein_target: 120,
        fat_target: 50,
        carbs_target: 190,
      }),
    );

    // Store mirror: same three values, keyed by the *_target suffix that
    // useCalculatedProfile's hasExplicitUserCarbsOverride guard (2.6) and
    // the protein-override path (2.13) read at runtime.
    expect(useUserStore.getState().macroOverrides).toEqual({
      protein_target: 120,
      fat_target: 50,
      carbs_target: 190,
    });
  });

  it('T-5.1.6-8: no overrides → plan values flow, store nulled', async () => {
    const draft: OnboardingDraft = {
      ...BASE_DRAFT,
      macroOverrides: null,
    };

    // Recompute the plan the same way PlanScreen does internally. Asserting
    // against the live calculation (not a 176/56/115 snapshot) means this
    // test tracks paceEngine changes automatically — a snapshot would lie.
    const expectedPlan = calculatePlan(BASE_INPUT, 'cut', 8, 22);

    const harness = renderPlanScreen(draft);
    await clickStartTracking();

    expect(harness.commit).toBeTypeOf('function');
    await harness.commit!();

    // DB payload: plan values, not overrides (there are none).
    expect(m.upsertProfile).toHaveBeenCalledTimes(1);
    expect(m.upsertProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        protein_target: expectedPlan.proteinG,
        fat_target: expectedPlan.fatG,
        carbs_target: expectedPlan.carbsG,
      }),
    );

    // Store mirror: all three keys EXPLICITLY nulled. This is the "no stale
    // override from a prior session can mask the fresh DB row" invariant.
    // Asserting the exact key set (not just "empty") catches a future
    // refactor that drops the null assignment and leaves the previous value
    // in place.
    expect(useUserStore.getState().macroOverrides).toEqual({
      protein_target: null,
      fat_target: null,
      carbs_target: null,
    });
  });
});