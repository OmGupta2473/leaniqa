import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DailyLog {
  date: string;
  caloriesConsumed: number;
  proteinConsumed: number;
  calorieTarget: number;
  proteinTarget: number;
  calorieUnderTarget: boolean;
  proteinHitTarget: boolean;
}

export interface Award {
  id: string;
  category: string;
  name: string;
  description: string;
  requirement: string;
  streakRequired: number;
  tier: string;
  shape: string;
  primaryColor: string;
  accentColor: string;
  symbol: string;
  symbolText: string;
  earned?: boolean;
  earnedDate?: string | null;
}

export const AWARDS_CATALOG: Award[] = [
  // ── CALORIE AWARDS ──────────────────────────────────────────
  {
    id: 'cal_spark',
    category: 'calories',
    name: 'First Spark',
    description: 'Stayed within your calorie target for the very first day.',
    requirement: 'Maintain a 1-day calorie streak',
    streakRequired: 1,
    tier: 'bronze',
    shape: 'hexagon',
    primaryColor: '#D4FF00',
    accentColor: '#A8CC00',
    symbol: '⚡',
    symbolText: '1'
  },
  {
    id: 'cal_starter',
    category: 'calories',
    name: 'Calorie Starter',
    description: 'Three consecutive days under your calorie target. The habit is forming.',
    requirement: 'Maintain a 3-day calorie streak',
    streakRequired: 3,
    tier: 'bronze',
    shape: 'hexagon',
    primaryColor: '#D4FF00',
    accentColor: '#8FAA00',
    symbol: '🔥',
    symbolText: '3'
  },
  {
    id: 'cal_builder',
    category: 'calories',
    name: 'Calorie Builder',
    description: 'Five days straight. You are building a real habit now.',
    requirement: 'Maintain a 5-day calorie streak',
    streakRequired: 5,
    tier: 'silver',
    shape: 'hexagon',
    primaryColor: '#D4FF00',
    accentColor: '#C0C0C0',
    symbol: '🏗️',
    symbolText: '5'
  },
  {
    id: 'cal_warrior',
    category: 'calories',
    name: 'Calorie Warrior',
    description: 'Ten consecutive days of discipline. A true warrior of the deficit.',
    requirement: 'Maintain a 10-day calorie streak',
    streakRequired: 10,
    tier: 'silver',
    shape: 'hexagon',
    primaryColor: '#FF4D1C',
    accentColor: '#C0C0C0',
    symbol: '⚔️',
    symbolText: '10'
  },
  {
    id: 'cal_legend',
    category: 'calories',
    name: 'Calorie Legend',
    description: 'Twenty-one days. You have built a permanent habit. This is identity.',
    requirement: 'Maintain a 21-day calorie streak',
    streakRequired: 21,
    tier: 'gold',
    shape: 'hexagon',
    primaryColor: '#FFD700',
    accentColor: '#FFA500',
    symbol: '👑',
    symbolText: '21'
  },
  {
    id: 'cal_elite',
    category: 'calories',
    name: 'Elite Cutter',
    description: 'Thirty days of perfect calorie discipline. Elite level achieved.',
    requirement: 'Maintain a 30-day calorie streak',
    streakRequired: 30,
    tier: 'gold',
    shape: 'hexagon',
    primaryColor: '#FFD700',
    accentColor: '#FF8C00',
    symbol: '💎',
    symbolText: '30'
  },

  // ── PROTEIN AWARDS ───────────────────────────────────────────
  {
    id: 'pro_ignite',
    category: 'protein',
    name: 'Protein Ignite',
    description: 'Hit your protein target on the very first day. Muscles are watching.',
    requirement: 'Hit protein target for 1 day',
    streakRequired: 1,
    tier: 'bronze',
    shape: 'shield',
    primaryColor: '#FF4D1C',
    accentColor: '#FF6B40',
    symbol: '💪',
    symbolText: '1'
  },
  {
    id: 'pro_builder',
    category: 'protein',
    name: 'Muscle Builder',
    description: 'Three days of hitting protein. Your muscle preservation protocol is active.',
    requirement: 'Hit protein target for 3 consecutive days',
    streakRequired: 3,
    tier: 'bronze',
    shape: 'shield',
    primaryColor: '#FF4D1C',
    accentColor: '#CC3300',
    symbol: '🏋️',
    symbolText: '3'
  },
  {
    id: 'pro_defender',
    category: 'protein',
    name: 'Muscle Defender',
    description: 'Five days straight. Your lean mass is being protected at every meal.',
    requirement: 'Hit protein target for 5 consecutive days',
    streakRequired: 5,
    tier: 'silver',
    shape: 'shield',
    primaryColor: '#FF4D1C',
    accentColor: '#C0C0C0',
    symbol: '🛡️',
    symbolText: '5'
  },
  {
    id: 'pro_titan',
    category: 'protein',
    name: 'Protein Titan',
    description: 'Ten days of hitting your protein target. Muscle loss is not happening to you.',
    requirement: 'Hit protein target for 10 consecutive days',
    streakRequired: 10,
    tier: 'silver',
    shape: 'shield',
    primaryColor: '#378ADD',
    accentColor: '#C0C0C0',
    symbol: '⚡',
    symbolText: '10'
  },
  {
    id: 'pro_immortal',
    category: 'protein',
    name: 'Protein Immortal',
    description: 'Twenty-one days. Your muscle is immortal. The lean body is inevitable.',
    requirement: 'Hit protein target for 21 consecutive days',
    streakRequired: 21,
    tier: 'gold',
    shape: 'shield',
    primaryColor: '#FFD700',
    accentColor: '#378ADD',
    symbol: '🦾',
    symbolText: '21'
  },
  {
    id: 'pro_god',
    category: 'protein',
    name: 'Protein God',
    description: 'Thirty days. Lean mass fully protected. Nothing will stop your transformation.',
    requirement: 'Hit protein target for 30 consecutive days',
    streakRequired: 30,
    tier: 'gold',
    shape: 'shield',
    primaryColor: '#FFD700',
    accentColor: '#FF4D1C',
    symbol: '🔱',
    symbolText: '30'
  }
];

function loadDailyLogs(): DailyLog[] {
  try {
    const raw = localStorage.getItem('leaniqa_daily_logs');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveDailyLogs(logs: DailyLog[]) {
  try {
    localStorage.setItem('leaniqa_daily_logs', JSON.stringify(logs));
  } catch { console.warn('Storage write failed'); }
}

function loadEarnedDates(): Record<string, string> {
  try {
    const raw = localStorage.getItem('leaniqa_earned_dates');
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveEarnedDates(dates: Record<string, string>) {
  try {
    localStorage.setItem('leaniqa_earned_dates', JSON.stringify(dates));
  } catch { console.warn('Storage write failed'); }
}

function getLocalDateDaysAgo(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Converts a YYYY-MM-DD string to a UTC day-number (days since epoch), immune to DST and local timezone drift
export function toUtcDayNumber(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}

function calculateCalorieStreak(dailyLogs: DailyLog[]): number {
  if (dailyLogs.length === 0) return 0;

  const sorted = [...dailyLogs]
    .filter(l => l.caloriesConsumed > 0)
    .sort((a, b) => toUtcDayNumber(b.date) - toUtcDayNumber(a.date));

  if (sorted.length === 0) return 0;

  const todayDayNum = toUtcDayNumber(getLocalDateDaysAgo(0));
  let streak = 0;

  for (let i = 0; i < sorted.length; i++) {
    const logDayNum = toUtcDayNumber(sorted[i].date);
    const expectedDayNum = todayDayNum - i;

    // Exact day-number match required — no tolerance needed since both sides are
    // integer day-numbers, immune to DST and timezone offset entirely.
    if (logDayNum !== expectedDayNum) break;

    if (sorted[i].calorieUnderTarget) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function calculateProteinStreak(dailyLogs: DailyLog[]): number {
  if (dailyLogs.length === 0) return 0;

  const sorted = [...dailyLogs]
    .filter(l => l.proteinConsumed > 0)
    .sort((a, b) => toUtcDayNumber(b.date) - toUtcDayNumber(a.date));

  if (sorted.length === 0) return 0;

  const todayDayNum = toUtcDayNumber(getLocalDateDaysAgo(0));
  let streak = 0;

  for (let i = 0; i < sorted.length; i++) {
    const logDayNum = toUtcDayNumber(sorted[i].date);
    const expectedDayNum = todayDayNum - i;

    if (logDayNum !== expectedDayNum) break;

    if (sorted[i].proteinHitTarget) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function allTimeBestStreak(logs: DailyLog[], hitPredicate: (l: DailyLog) => boolean): number {
  const sorted = [...logs].sort((a, b) => toUtcDayNumber(a.date) - toUtcDayNumber(b.date));
  let best = 0;
  let current = 0;
  let prevDayNum: number | null = null;

  for (const log of sorted) {
    const dayNum = toUtcDayNumber(log.date);
    if (hitPredicate(log)) {
      if (prevDayNum !== null && dayNum === prevDayNum + 1) {
        current++;
      } else {
        current = 1;
      }
      best = Math.max(best, current);
    } else {
      current = 0;
    }
    prevDayNum = dayNum;
  }

  return best;
}

// INVARIANT: computeEarnedAwards must use the exact same day-contiguity algorithm
// (toUtcDayNumber-based) and the exact same "today inclusive" rule as
// calculateCalorieStreak/calculateProteinStreak. If these ever diverge again,
// the Dashboard streak chip and the Awards Hall unlock state will disagree —
// this was a real shipped bug once. Do not reintroduce a `logsToConsider` filter
// that excludes today's date from award-eligibility calculations.
function computeEarnedAwards(dailyLogs: DailyLog[]): Award[] {
  // IMPORTANT: today is now INCLUDED, matching calculateCalorieStreak/calculateProteinStreak exactly.
  // This guarantees the Dashboard streak chip and the Awards Hall unlock state can never disagree.
  const bestCal = allTimeBestStreak(dailyLogs, l => l.calorieUnderTarget && l.caloriesConsumed > 0);
  const bestPro = allTimeBestStreak(dailyLogs, l => l.proteinHitTarget && l.proteinConsumed > 0);

  return AWARDS_CATALOG.map(award => ({
    ...award,
    earned: award.category === 'calories'
      ? bestCal >= award.streakRequired
      : bestPro >= award.streakRequired,
    earnedDate: null
  }));
}

export interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
  data?: any;
  weekKey: string;
  timestamp?: number;
}

interface AppState {
  currentScreen: string;
  setScreen: (screen: string) => void;
  clearStore: () => void;
  onboardingData?: any;
  setOnboardingData: (data: any) => void;
  onboardingCompleted: boolean;
  setOnboardingCompleted: (completed: boolean) => void;
  goalSetCompleted: boolean;
  setGoalSetCompleted: (completed: boolean) => void;
  chatHistory: ChatMessage[];
  addChatMessage: (msg: Omit<ChatMessage, 'weekKey'>) => void;
  clearOldChats: () => void;
  
  dailyLogs: DailyLog[];
  calorieStreak: number;
  proteinStreak: number;
  earnedAwards: Award[];
  updateDailyLogs: (logs: DailyLog[]) => void;
  syncFromMetrics: (metrics: any[]) => void;
}

function getWeekKey(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
  return `${d.getUTCFullYear()}-W${weekNo}`;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => {
      // Initialize state from local storage on load
      const initialLogs = loadDailyLogs();
      const earnedDates = loadEarnedDates();
      
      const initialCalorieStreak = calculateCalorieStreak(initialLogs);
      const initialProteinStreak = calculateProteinStreak(initialLogs);
      
      let initialAwards = computeEarnedAwards(initialLogs);
      initialAwards = initialAwards.map(a => ({
        ...a,
        earnedDate: earnedDates[a.id] || null
      }));

      return {
        currentScreen: 'onboard',
        setScreen: (screen) => set({ currentScreen: screen }),
        clearStore: () => set({ currentScreen: 'onboard', onboardingData: undefined, onboardingCompleted: false, goalSetCompleted: false, chatHistory: [], dailyLogs: [], calorieStreak: 0, proteinStreak: 0, earnedAwards: computeEarnedAwards([]) }),
        setOnboardingData: (data) => set({ onboardingData: data }),
        onboardingCompleted: false,
        setOnboardingCompleted: (completed) => set({ onboardingCompleted: completed }),
        goalSetCompleted: false,
        setGoalSetCompleted: (completed) => set({ goalSetCompleted: completed }),
        chatHistory: [],
        addChatMessage: (msg) => {
          const weekKey = getWeekKey();
          set((state) => ({
            chatHistory: [...state.chatHistory, { ...msg, weekKey, timestamp: Date.now() }]
          }));
        },
        clearOldChats: () => {
          const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
          set((state) => ({
            chatHistory: state.chatHistory.filter(m => (m.timestamp || 0) > sevenDaysAgo)
          }));
        },
        
        dailyLogs: initialLogs,
        calorieStreak: initialCalorieStreak,
        proteinStreak: initialProteinStreak,
        earnedAwards: initialAwards,
        
        updateDailyLogs: (logs) => {
          saveDailyLogs(logs);
          const calStreak = calculateCalorieStreak(logs);
          const proStreak = calculateProteinStreak(logs);
          let newAwards = computeEarnedAwards(logs);
          
          // Check for newly earned awards and save their dates
          const currentEarnedDates = loadEarnedDates();
          let datesUpdated = false;
          const todayIso = getLocalDateDaysAgo(0);
          
          newAwards = newAwards.map(award => {
            if (award.earned) {
              if (currentEarnedDates[award.id]) {
                return { ...award, earnedDate: currentEarnedDates[award.id] };
              } else {
                currentEarnedDates[award.id] = todayIso;
                datesUpdated = true;
                return { ...award, earnedDate: todayIso };
              }
            }
            return award;
          });
          
          if (datesUpdated) {
            saveEarnedDates(currentEarnedDates);
          }
          
          set({
            dailyLogs: logs,
            calorieStreak: calStreak,
            proteinStreak: proStreak,
            earnedAwards: newAwards
          });
        },

        syncFromMetrics: (metrics) => {
          if (!metrics || metrics.length === 0) return;
          
          const logs: DailyLog[] = metrics
            .filter(m => m.actual_calories > 0 || m.actual_protein > 0) // only logged days
            .map(m => ({
              date: m.date,
              caloriesConsumed: m.actual_calories,
              proteinConsumed: m.actual_protein,
              calorieTarget: m.target_calories,
              proteinTarget: m.target_protein,
              calorieUnderTarget: m.actual_calories > 0 && m.actual_calories <= m.target_calories,
              proteinHitTarget: m.actual_protein > 0 && m.actual_protein >= m.target_protein
            }));
          
          saveDailyLogs(logs);
          const calStreak = calculateCalorieStreak(logs);
          const proStreak = calculateProteinStreak(logs);
          let newAwards = computeEarnedAwards(logs);
          
          const currentEarnedDates = loadEarnedDates();
          let datesUpdated = false;
          const todayIso = getLocalDateDaysAgo(0);
          
          newAwards = newAwards.map(award => {
            if (award.earned) {
              if (currentEarnedDates[award.id]) {
                return { ...award, earnedDate: currentEarnedDates[award.id] };
              } else {
                currentEarnedDates[award.id] = todayIso;
                datesUpdated = true;
                return { ...award, earnedDate: todayIso };
              }
            }
            return award;
          });
          
          if (datesUpdated) saveEarnedDates(currentEarnedDates);
          
          set({
            dailyLogs: logs,
            calorieStreak: calStreak,
            proteinStreak: proStreak,
            earnedAwards: newAwards
          });
        }
      };
    },
    {
      name: 'leaniqa-nav',
      partialize: (state) => ({ 
        currentScreen: state.currentScreen, 
        onboardingData: state.onboardingData, 
        onboardingCompleted: state.onboardingCompleted,
        goalSetCompleted: state.goalSetCompleted,
        chatHistory: state.chatHistory
      }),
    }
  )
);
