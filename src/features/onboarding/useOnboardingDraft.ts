import { useState, useEffect, useCallback } from 'react';
import { EMPTY_DRAFT, type OnboardingDraft } from './types';

/**
 * localStorage-backed draft for the onboarding v2 flow.
 *
 * - reads on mount (so a refresh resumes mid-flow)
 * - writes on every change
 * - `clearDraft` is called by the parent after a successful commit
 */
export function useOnboardingDraft(userId: string) {
  const key = `leaniqa-onboarding-v2:${userId}`;
  const [draft, setDraftState] = useState<OnboardingDraft | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      setDraftState(raw ? { ...EMPTY_DRAFT, ...JSON.parse(raw) } : EMPTY_DRAFT);
    } catch {
      setDraftState(EMPTY_DRAFT);
    } finally {
      setIsLoading(false);
    }
  }, [key]);

  const setDraft = useCallback((updater: OnboardingDraft | ((prev: OnboardingDraft) => OnboardingDraft)) => {
    setDraftState((prev) => {
      if (!prev) return prev;
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [key]);

  const clearDraft = useCallback(() => {
    try { localStorage.removeItem(key); } catch {}
  }, [key]);

  return { draft, setDraft, clearDraft, isLoading };
}
