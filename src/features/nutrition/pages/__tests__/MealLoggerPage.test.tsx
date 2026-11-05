// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

// ═══════════════════════════════════════════════════════════════════════════
// Hoisted mocks
// ═══════════════════════════════════════════════════════════════════════════
const m = vi.hoisted(() => ({
  invoke: vi.fn(),
  getSession: vi.fn(),
  refreshSession: vi.fn(),
  getUserId: vi.fn(),
  toast: vi.fn(),
  refetchCredits: vi.fn(),
  // Mutable credits value the mocked useAiCredits hook returns. Tests that
  // need a different remaining count (T-4 for 0, T-5 for 1) reassign
  // m.creditsOverride.value before render; beforeEach resets it so a
  // lowered `remaining` can't leak into the next test. vi.clearAllMocks()
  // does NOT reset plain-object properties — hence the explicit reset.
  creditsOverride: {
    value: { used: 0, limit: 25, remaining: 25 },
  },
}));

vi.mock('@/shared/utils/supabase', () => ({
  supabase: {
    auth: { getSession: m.getSession, refreshSession: m.refreshSession },
    functions: { invoke: m.invoke },
    from: vi.fn(),
  },
}));

vi.mock('@/features/auth/services/authService', () => ({
  authService: { getUserId: m.getUserId },
}));

vi.mock('@/router/useAuthSession', () => ({
  useAuthSession: () => ({
    session: { user: { id: 'test-user', is_anonymous: false } },
    loading: false,
  }),
}));

vi.mock('@/shared/hooks/useCalculatedProfile', () => ({
  useCalculatedProfile: () => ({
    profileData: {
      name: 'Test', age: 30, weightKg: 80, targetWeightKg: 75,
      currentBodyFatPct: 20, targetBodyFatPct: 15,
      dailyCalorieGoal: 2000, targetMacros: { protein: 150, fat: 60, carbs: 200 },
      proteinMid: 150, dietaryPreference: 'veg',
    },
    profile: null, goal: null, hasCompletedOnboarding: true, isLoading: false,
  }),
}));

vi.mock('@/features/nutrition/hooks/useAiCredits', () => ({
  useAiCredits: () => ({
    credits: m.creditsOverride.value,
    isLoading: false,
    refetch: m.refetchCredits,
  }),
}));

vi.mock('@/features/nutrition/hooks/useDailyNutrition', () => ({
  useDailyNutrition: () => ({
    meals: [], isMealsLoading: false, isMealsError: false,
    refetchMeals: vi.fn(), isProfileLoading: false,
    proteinTarget: 150, dailyTargetKcal: 2000, fatTarget: 60, carbsTarget: 200,
    eatenKcal: 0, eatenProtein: 0, eatenFat: 0, eatenCarbs: 0,
    remainingKcal: 2000, remainingProtein: 150,
    remaining: { calories: 2000, protein: 150, fat: 60, carbs: 200 },
    calPct: 0, proPct: 0, fatPct: 0, carbPct: 0, completionScore: 0,
    isOnline: true,
  }),
}));

vi.mock('@/shared/hooks/useNetworkConnectivity', () => ({
  useNetworkConnectivity: () => true,
}));

vi.mock('@/shared/hooks/useVisualViewport', () => ({
  useVisualViewport: () => 0,
  useKeyboardOpen: () => false,
}));

vi.mock('@/shared/components/Toast', () => ({
  useToast: () => ({ toast: m.toast }),
}));

vi.mock('@/features/nutrition/utils/mealSync', () => ({
  onMealSaved: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/features/profile/services/profileService', () => ({
  profileService: {
    getProfile: vi.fn().mockResolvedValue({ id: 'test-user', dietary_preference: 'veg' }),
    getGoal: vi.fn().mockResolvedValue({ goal_type: 'cut' }),
  },
}));

vi.mock('@/features/reports/services/complianceService', () => ({
  complianceService: {
    recalculateDayScore: vi.fn().mockResolvedValue(null),
    updateTodayScore: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock('@/features/reports/services/reportService', () => ({
  reportService: { getDailyMetrics: vi.fn().mockResolvedValue([]) },
}));

vi.mock('@/features/pricing/hooks/useEntitlements', () => ({
  useEntitlements: () => ({
    plan: 'premium',
    entitlements: {
      aiParsesPerDay: 25, historyDays: null, weeklyReports: 'full',
      macroBalance: true, coachSummary: 'full', exports: true, projections: 'advanced',
    },
  }),
}));

vi.mock('@/features/nutrition/services/mealService', () => ({
  mealService: {
    addMeal: vi.fn().mockResolvedValue({ id: 'meal-1' }),
    getFirstMealDate: vi.fn().mockResolvedValue(null),
    deleteMeal: vi.fn(),
    updateMeal: vi.fn(),
  },
}));

vi.mock('@/features/nutrition/services/chatService', () => ({
  fetchTodayMessages: vi.fn().mockResolvedValue([]),
  saveMessage: vi.fn().mockResolvedValue(undefined),
}));

// ═══════════════════════════════════════════════════════════════════════════
// Import component AFTER mocks. zustand stores are NOT mocked — used real.
// No vi.hoisted-created stores means no TDZ hazard, and jsdom localStorage
// backs persist middleware just like production.
// ═══════════════════════════════════════════════════════════════════════════
import { MealLoggerPage } from '../MealLoggerPage';
import { useNutritionStore } from '@/features/nutrition/store/nutritionStore';
import { useAppStore } from '@/app/store/appStore';
import { useChatStore } from '@/app/store/chatStore';
import { mealService } from '@/features/nutrition/services/mealService';

// ═══════════════════════════════════════════════════════════════════════════
// Harness
// ═══════════════════════════════════════════════════════════════════════════
function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <MealLoggerPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

async function openLogModal() {
  fireEvent.click(screen.getByLabelText('Log a meal'));
  await waitFor(() => expect(screen.getByLabelText('Meal description')).toBeInTheDocument());
}

function sendMeal(text: string) {
  const input = screen.getByLabelText('Meal description') as HTMLInputElement;
  fireEvent.change(input, { target: { value: text } });
  fireEvent.keyDown(input, { key: 'Enter' });
}

beforeEach(() => {
  vi.clearAllMocks();
  m.getSession.mockResolvedValue({
    data: { session: { access_token: 'tok', user: { id: 'test-user' } } },
    error: null,
  });
  m.getUserId.mockResolvedValue('test-user');

  // clearAllMocks() does NOT reset plain-object properties; a test that
  // lowered `remaining` to force the AiLimitNudge must not leak into the
  // next test's render.
  m.creditsOverride.value = { used: 0, limit: 25, remaining: 25 };

  // Real stores are shared across tests — reset to initial state.
  useNutritionStore.setState({
    searchText: '', aiParsingLoading: false, aiStatus: 'online',
    selectedMealSlot: 'lunch',
  });
  useAppStore.setState({ activeModal: null });
  useChatStore.setState({ chatHistory: [], userId: null, dateKey: null });
});

afterEach(() => {
  // This repo has no vitest.config.ts (uses per-file `// @vitest-environment`
  // docblocks), so Vitest's `globals: true` is off and @testing-library/react
  // cannot auto-register afterEach(cleanup). Without an explicit cleanup each
  // render appends a new <div> to document.body, and screen.getByLabelText
  // ('Log a meal') starts returning N accumulated FAB copies from N prior
  // tests — every test after the first fails with "Found multiple elements".
  cleanup();
  // T-3 / T-4 / T-6 stub VITE_RESOLVE_V2_ENABLED=false to exercise the v1-only
  // path. Without this, the stub leaks into the next test (clearAllMocks
  // doesn't undo env stubs) and every subsequent test runs on the wrong
  // resolver branch.
  vi.unstubAllEnvs();
});

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════
describe('MealLoggerPage — 5.1.6', () => {
  it('T-5.1.6-1: v2 partial resolution falls through to parse-meal; no auto-retry (fromV2FallbackRef gate)', async () => {
    m.invoke.mockImplementation((name: string) => {
      if (name === 'resolve-meal-v2') {
        return Promise.resolve({
          data: {
            items: [{
              food_id: 1, canonical_name: 'roti', input_term: 'roti',
              grams: 80, kcal: 238, protein: 8.8, fat: 4, carbs: 40.8, fiber: 3.9,
              unit: null, quantity: 2, weight_basis: 'unknown',
              quantity_source: 'user_provided', oil_review_needed: false,
            }],
            unresolved_items: [{ input_term: 'sabzi', quantity: 1, unit: null }],
            totals: { kcal: 238, protein: 8.8, fat: 4, carbs: 40.8, fiber: 3.9 },
            meal_confidence: 0.5,
            needs_confirmation: true,
            layers_used: ['exact', 'ambiguous'],
            source: 'v2_kb_primary',
          },
          error: null,
        });
      }
      if (name === 'parse-meal') {
        return Promise.resolve({
          data: {
            calories: 300, protein: 15, fat: 8, carbs: 40,
            confidence: 50, foods_detected: ['roti', 'sabzi'],
            source: 'llm', request_id: 'req-1',
            unresolved_items: [{ input_term: 'sabzi' }],
          },
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: { message: `unexpected invoke(${name})` } });
    });

    renderPage();
    await openLogModal();
    sendMeal('2 roti and sabzi');

    await waitFor(() => {
      expect(m.invoke).toHaveBeenCalledWith('resolve-meal-v2', expect.anything());
      expect(m.invoke).toHaveBeenCalledWith('parse-meal', expect.anything());
    });

    const calls = m.invoke.mock.calls;
    const v2Idx = calls.findIndex((c: any) => c[0] === 'resolve-meal-v2');
    const v1Idx = calls.findIndex((c: any) => c[0] === 'parse-meal');
    expect(v2Idx).toBeGreaterThanOrEqual(0);
    expect(v1Idx).toBeGreaterThan(v2Idx);

    // The assertion this test exists for: parse-meal called EXACTLY ONCE.
    const parseMealCalls = calls.filter((c: any) => c[0] === 'parse-meal');
    expect(parseMealCalls).toHaveLength(1);

    await waitFor(() =>
      expect(screen.getByText(/couldn't confidently identify/i)).toBeInTheDocument(),
    );
  });

  it('T-5.1.6-2: v2 transport error falls through to parse-meal; no auto-retry', async () => {
    m.invoke.mockImplementation((name: string) => {
      if (name === 'resolve-meal-v2') {
        return Promise.resolve({
          data: null,
          error: { message: 'transport down' },
        });
      }
      if (name === 'parse-meal') {
        return Promise.resolve({
          data: {
            calories: 300, protein: 15, fat: 8, carbs: 40,
            confidence: 50, foods_detected: ['roti', 'sabzi'],
            source: 'llm', request_id: 'req-1',
            unresolved_items: [{ input_term: 'sabzi' }],
          },
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: { message: `unexpected invoke(${name})` } });
    });

    renderPage();
    await openLogModal();
    sendMeal('2 roti and sabzi');

    await waitFor(() => {
      expect(m.invoke).toHaveBeenCalledWith('resolve-meal-v2', expect.anything());
      expect(m.invoke).toHaveBeenCalledWith('parse-meal', expect.anything());
    });

    const calls = m.invoke.mock.calls;
    const v2Idx = calls.findIndex((c: any) => c[0] === 'resolve-meal-v2');
    const v1Idx = calls.findIndex((c: any) => c[0] === 'parse-meal');
    expect(v2Idx).toBeGreaterThanOrEqual(0);
    expect(v1Idx).toBeGreaterThan(v2Idx);

    // The assertion this test exists for: fromV2FallbackRef gates the auto
    // retry, so parse-meal is called exactly once.
    const parseMealCalls = calls.filter((c: any) => c[0] === 'parse-meal');
    expect(parseMealCalls).toHaveLength(1);

    await waitFor(() =>
      expect(screen.getByText(/couldn't confidently identify/i)).toBeInTheDocument(),
    );
  });

  it('T-5.1.6-3: v1 control path preserves auto-retry (fromV2FallbackRef=false)', async () => {
    // Force the v1-only path. Without this, .env.local's
    // VITE_RESOLVE_V2_ENABLED=true routes the request through resolve-meal-v2,
    // which sets fromV2FallbackRef=true on error and suppresses the auto-retry
    // this test is supposed to observe.
    vi.stubEnv('VITE_RESOLVE_V2_ENABLED', 'false');

    m.invoke.mockImplementation((name: string) => {
      if (name === 'parse-meal') {
        return Promise.resolve({
          data: {
            calories: 300, protein: 15, fat: 8, carbs: 40,
            confidence: 50, foods_detected: ['roti', 'sabzi'],
            source: 'llm', request_id: 'req-1',
            unresolved_items: [{ input_term: 'sabzi' }],
          },
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: { message: `unexpected invoke(${name})` } });
    });

    renderPage();
    await openLogModal();
    sendMeal('2 roti and sabzi');

    // The v1-only path must call parse-meal twice: once on send, once on the
    // bounded auto-retry. fromV2FallbackRef is never set here.
    await waitFor(
      () => {
        const parseMealCalls = m.invoke.mock.calls.filter((c: any) => c[0] === 'parse-meal');
        expect(parseMealCalls).toHaveLength(2);
      },
      { timeout: 3000 },
    );

    expect(m.invoke.mock.calls.find((c: any) => c[0] === 'resolve-meal-v2')).toBeUndefined();

    await waitFor(() =>
      expect(screen.getByText(/couldn't confidently identify/i)).toBeInTheDocument(),
    );
  });

  it('T-5.1.6-4: 429 daily limit redirects to CustomMealModal with pre-fill + banner', async () => {
    vi.stubEnv('VITE_RESOLVE_V2_ENABLED', 'false');
    m.creditsOverride.value = { used: 25, limit: 25, remaining: 0 };

    m.invoke.mockImplementation((name: string) => {
      if (name === 'parse-meal') {
        return Promise.resolve({
          data: null,
          error: {
            message: 'Daily AI limit reached',
            context: {
              json: async () => ({
                error: 'Daily AI limit reached',
                error_code: 'daily_limit',
              }),
            },
          },
        });
      }
      return Promise.resolve({ data: null, error: { message: `unexpected invoke(${name})` } });
    });

    renderPage();
    await openLogModal();
    sendMeal('2 roti and sabzi');

    // parse-meal returns 429 → onSuccess → setModalOpen(false) → setTimeout 300 → setIsCustomMealModalOpen(true).
    await waitFor(
      () => expect(screen.getByRole('dialog', { name: /create custom meal/i })).toBeInTheDocument(),
      { timeout: 2000 },
    );

    // Pre-fill: the raw user input carried into pendingCustomMealName.
    // The modal's useEffect sets the name after mount (260ms focus timer),
    // so wait for the value rather than asserting synchronously.
    await waitFor(() => {
      const nameInput = screen.getByPlaceholderText('e.g. Chicken Salad') as HTMLInputElement;
      expect(nameInput.value).toBe('2 roti and sabzi');
    });

    // Banner: unique to the ai_limit path (the AiLimitNudge on the page has
    // different copy, so "log it manually below" only matches the modal banner).
    expect(screen.getByText(/log it manually below/i)).toBeInTheDocument();
  });

  it('T-5.1.6-5: AiLimitNudge "Log manually" pre-fills CustomMealModal without banner', async () => {
    // remaining === 1 is the state where AiLimitNudge renders.
    m.creditsOverride.value = { used: 24, limit: 25, remaining: 1 };

    renderPage();

    // Type the raw meal, then click "Log manually" from the nudge.
    await openLogModal();
    const inputField = screen.getByLabelText('Meal description') as HTMLInputElement;
    fireEvent.change(inputField, { target: { value: 'chicken salad' } });
    await waitFor(() =>
      expect(useNutritionStore.getState().searchText).toBe('chicken salad'),
    );

    fireEvent.click(screen.getByRole('button', { name: /log manually/i }));

    // CustomMealModal mounts ~300ms after the click.
    await waitFor(
      () => expect(screen.getByRole('dialog', { name: /create custom meal/i })).toBeInTheDocument(),
      { timeout: 2000 },
    );

    await waitFor(() => {
      const nameInput = screen.getByPlaceholderText('e.g. Chicken Salad') as HTMLInputElement;
      expect(nameInput.value).toBe('chicken salad');
    });

    // The nudge path must NOT show the limit banner (reason is null, not 'ai_limit').
    expect(screen.queryByText(/log it manually below/i)).not.toBeInTheDocument();
  });

  it('T-5.1.6-6: KB-source parse auto-logs without showing the pending-meal card', async () => {
    vi.stubEnv('VITE_RESOLVE_V2_ENABLED', 'false');

    m.invoke.mockImplementation((name: string) => {
      if (name === 'parse-meal') {
        return Promise.resolve({
          data: {
            calories: 350, protein: 15, fat: 8, carbs: 45, fiber: 2,
            confidence: 95, foods_detected: ['2 roti', '1 katori dal'],
            source: 'kb', request_id: 'req-kb',
          },
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: { message: `unexpected invoke(${name})` } });
    });

    renderPage();
    await openLogModal();
    sendMeal('2 roti and 1 katori dal');

    // High-confidence KB source → auto-log via confirmMealMutation → mealService.addMeal.
    await waitFor(
      () => expect(vi.mocked(mealService.addMeal)).toHaveBeenCalledTimes(1),
      { timeout: 2000 },
    );

    // No pending-meal card ("Here is the estimated nutrition...") was shown.
    expect(screen.queryByText(/Here is the estimated nutrition/i)).not.toBeInTheDocument();

    // Success toast fired.
    expect(m.toast).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'success',
        message: expect.stringContaining('Logged ✓'),
      }),
    );
  });
});