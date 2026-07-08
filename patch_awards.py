import re

with open("src/shared/utils/streaks.ts", "r") as f:
    content = f.read()

old_catalog = """export const AWARDS_CATALOG: Award[] = [
  { id: 'streak_spark', category: 'daily', name: 'First Spark', description: 'Hit both calorie and protein targets for the first day.', requirement: 'Maintain a 1-day streak', streakRequired: 1, tier: 'bronze', shape: 'hexagon', primaryColor: '#D4FF00', accentColor: '#A8CC00', symbol: '⚡', symbolText: '1' },
  { id: 'streak_starter', category: 'daily', name: 'Streak Starter', description: 'Three consecutive days hitting all targets.', requirement: 'Maintain a 3-day streak', streakRequired: 3, tier: 'bronze', shape: 'hexagon', primaryColor: '#D4FF00', accentColor: '#8FAA00', symbol: '🔥', symbolText: '3' },
  { id: 'streak_builder', category: 'daily', name: 'Habit Builder', description: 'Five days straight. You are building a real habit now.', requirement: 'Maintain a 5-day streak', streakRequired: 5, tier: 'silver', shape: 'hexagon', primaryColor: '#D4FF00', accentColor: '#C0C0C0', symbol: '🏗️', symbolText: '5' },
  { id: 'streak_warrior', category: 'daily', name: 'Discipline Warrior', description: 'Ten consecutive days of discipline. A true warrior.', requirement: 'Maintain a 10-day streak', streakRequired: 10, tier: 'silver', shape: 'hexagon', primaryColor: '#FF4D1C', accentColor: '#C0C0C0', symbol: '⚔️', symbolText: '10' },
  { id: 'streak_legend', category: 'daily', name: 'Streak Legend', description: 'Twenty-one days. You have built a permanent habit. This is identity.', requirement: 'Maintain a 21-day streak', streakRequired: 21, tier: 'gold', shape: 'hexagon', primaryColor: '#FFD700', accentColor: '#FFA500', symbol: '👑', symbolText: '21' },
  { id: 'streak_elite', category: 'daily', name: 'Elite Transformer', description: 'Thirty days of perfect discipline. Elite level achieved.', requirement: 'Maintain a 30-day streak', streakRequired: 30, tier: 'gold', shape: 'hexagon', primaryColor: '#FFD700', accentColor: '#FF8C00', symbol: '💎', symbolText: '30' }
];"""

new_catalog = """export const AWARDS_CATALOG: Award[] = [
  { id: 'streak_1', category: 'daily', name: 'First Spark', description: 'Hit both calorie and protein targets for your first successful day.', requirement: 'Maintain a 1-day streak', streakRequired: 1, tier: 'bronze', shape: 'hexagon', primaryColor: '#D4FF00', accentColor: '#A8CC00', symbol: '⚡', symbolText: '1' },
  { id: 'streak_3', category: 'daily', name: 'Streak Starter', description: 'Three consecutive days hitting all targets.', requirement: 'Maintain a 3-day streak', streakRequired: 3, tier: 'bronze', shape: 'hexagon', primaryColor: '#D4FF00', accentColor: '#8FAA00', symbol: '🔥', symbolText: '3' },
  { id: 'streak_7', category: 'daily', name: 'One Week Strong', description: 'Seven days straight. A full week of perfect discipline.', requirement: 'Maintain a 7-day streak', streakRequired: 7, tier: 'silver', shape: 'hexagon', primaryColor: '#FF4D1C', accentColor: '#C0C0C0', symbol: '📅', symbolText: '7' },
  { id: 'streak_14', category: 'daily', name: 'Consistency Builder', description: 'Fourteen consecutive days. You are building a real habit now.', requirement: 'Maintain a 14-day streak', streakRequired: 14, tier: 'silver', shape: 'hexagon', primaryColor: '#FF4D1C', accentColor: '#C0C0C0', symbol: '🏗️', symbolText: '14' },
  { id: 'streak_30', category: 'daily', name: 'Discipline Master', description: 'Thirty days. One entire month of consistency. Elite level achieved.', requirement: 'Maintain a 30-day streak', streakRequired: 30, tier: 'gold', shape: 'hexagon', primaryColor: '#FFD700', accentColor: '#FF8C00', symbol: '💎', symbolText: '30' },
  { id: 'streak_60', category: 'daily', name: 'Elite Performer', description: 'Sixty consecutive days. Unwavering focus and dedication.', requirement: 'Maintain a 60-day streak', streakRequired: 60, tier: 'gold', shape: 'hexagon', primaryColor: '#FFD700', accentColor: '#FF8C00', symbol: '🚀', symbolText: '60' },
  { id: 'streak_100', category: 'daily', name: 'Unbreakable', description: 'One hundred days of perfect discipline. You are unstoppable.', requirement: 'Maintain a 100-day streak', streakRequired: 100, tier: 'gold', shape: 'hexagon', primaryColor: '#00E5FF', accentColor: '#00B3CC', symbol: '🛡️', symbolText: '100' },
  { id: 'streak_180', category: 'daily', name: 'Legend', description: 'Half a year of unbroken consistency. A true legend.', requirement: 'Maintain a 180-day streak', streakRequired: 180, tier: 'gold', shape: 'hexagon', primaryColor: '#B100FF', accentColor: '#8B00CC', symbol: '👑', symbolText: '180' },
  { id: 'streak_365', category: 'daily', name: 'LeanIQA Champion', description: 'A full year of mastery. You have conquered the journey.', requirement: 'Maintain a 365-day streak', streakRequired: 365, tier: 'gold', shape: 'hexagon', primaryColor: '#FF0055', accentColor: '#CC0044', symbol: '🏆', symbolText: '365' }
];"""

content = content.replace(old_catalog, new_catalog)

with open("src/shared/utils/streaks.ts", "w") as f:
    f.write(content)
