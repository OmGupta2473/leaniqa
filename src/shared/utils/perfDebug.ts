import React, { ProfilerOnRenderCallback, useEffect, useRef } from 'react';

// PERF DEBUG
export const onRenderCallback: ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime,
  interactions
) => {
  if (import.meta.env.DEV) {
    if (actualDuration > 5) {
      console.log(`[PERF][${id}] ${phase} | actual: ${actualDuration.toFixed(2)}ms | base: ${baseDuration.toFixed(2)}ms | commit: ${commitTime}`);
    }
  }
};

export function useRenderTracker(componentName: string) {
  const renderCount = useRef(0);
  if (import.meta.env.DEV) {
    renderCount.current += 1;
    console.log(`[PERF RENDER] ${componentName} render #${renderCount.current}`);
  }
}

export function useHeavyEffectTracker(effectName: string, fn: () => void | (() => void), deps?: React.DependencyList) {
  useEffect(() => {
    if (import.meta.env.DEV) {
      const start = performance.now();
      const cleanup = fn();
      const end = performance.now();
      const duration = end - start;
      if (duration > 16) {
        console.warn(`[PERF EFFECT WARN] ${effectName} took ${duration.toFixed(2)}ms`);
      } else {
        console.log(`[PERF EFFECT] ${effectName} took ${duration.toFixed(2)}ms`);
      }
      return cleanup;
    } else {
      return fn();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
