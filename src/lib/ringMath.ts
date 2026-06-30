/**
 * Maps a current/goal pair to SVG stroke-dasharray/offset values for a progress ring.
 * Handles overachievement (current > goal) by capping the visual ring fill at 100%
 * and returning an `overflow` flag so the UI can render a distinct "completed lap"
 * tip indicator rather than letting the stroke silently exceed the circle.
 */
export interface RingGeometry {
  radius: number;
  circumference: number;
  percent: number;       // 0-100+, uncapped, for display text
  visualPercent: number;  // 0-100, capped, for stroke-dashoffset math
  dashOffset: number;
  isOverflow: boolean;    // true if current > goal
  overflowLaps: number;   // how many full goal-multiples have been completed (for multi-loop visuals)
}

export function computeRingGeometry(current: number, goal: number, size: number, strokeWidth: number): RingGeometry {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const safeGoal = goal > 0 ? goal : 1;
  const rawPercent = (current / safeGoal) * 100;
  const percent = Math.max(0, rawPercent);
  const visualPercent = Math.min(100, percent);
  const isOverflow = current > goal && goal > 0;
  const overflowLaps = isOverflow ? Math.floor(current / safeGoal) : 0;

  const dashOffset = circumference - (visualPercent / 100) * circumference;

  return {
    radius,
    circumference,
    percent,
    visualPercent,
    dashOffset,
    isOverflow,
    overflowLaps,
  };
}
