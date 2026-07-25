import re

with open("src/shared/utils/streaks.ts", "r") as f:
    content = f.read()

# Modify calculateBestStreak
old_calculateBestStreak = """export function calculateBestStreak(metrics: DbDailyMetric[], predicate: (m: DbDailyMetric) => boolean): number {
  if (!metrics || metrics.length === 0) return 0;
  
  const sorted = [...metrics].sort((a, b) => toUtcDay(a.date) - toUtcDay(b.date));
  
  let best = 0;
  let current = 0;
  let prevDayNum: number | null = null;
  
  for (const m of sorted) {
    const dayNum = toUtcDay(m.date);
    if (predicate(m)) {"""

new_calculateBestStreak = """export function calculateBestStreak(metrics: DbDailyMetric[], predicate: (m: DbDailyMetric) => boolean): number {
  if (!metrics || metrics.length === 0) return 0;
  
  const sorted = [...metrics].sort((a, b) => toUtcDay(a.date) - toUtcDay(b.date));
  const todayDayNum = toUtcDay(new Date());
  
  let best = 0;
  let current = 0;
  let prevDayNum: number | null = null;
  
  for (const m of sorted) {
    const dayNum = toUtcDay(m.date);
    
    // Streak logic must ignore today's metrics as they are still in progress
    if (dayNum >= todayDayNum) {
      continue;
    }

    if (predicate(m)) {"""

content = content.replace(old_calculateBestStreak, new_calculateBestStreak)

with open("src/shared/utils/streaks.ts", "w") as f:
    f.write(content)
