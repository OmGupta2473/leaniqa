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

function calculateCalorieStreak(dailyLogs: DailyLog[]): number {
  const sorted = [...dailyLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < sorted.length; i++) {
    const logDate = new Date(sorted[i].date);
    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);
    const isSameDay = logDate.toDateString() === expectedDate.toDateString();
    if (!isSameDay) break;
    if (sorted[i].calorieUnderTarget) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function calculateProteinStreak(dailyLogs: DailyLog[]): number {
  const sorted = [...dailyLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < sorted.length; i++) {
    const logDate = new Date(sorted[i].date);
    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);
    const isSameDay = logDate.toDateString() === expectedDate.toDateString();
    if (!isSameDay) break;
    if (sorted[i].proteinHitTarget) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function computeEarnedAwards(dailyLogs: DailyLog[]): Award[] {
  function allTimeBestCalStreak(logs: DailyLog[]) {
    const sorted = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let best = 0, current = 0;
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].calorieUnderTarget) {
        if (i === 0) { current = 1; continue; }
        const prev = new Date(sorted[i-1].date);
        const curr = new Date(sorted[i].date);
        const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
        current = diff === 1 ? current + 1 : 1;
      } else {
        current = 0;
      }
      best = Math.max(best, current);
    }
    return Math.max(best, current);
  }

  function allTimeBestProStreak(logs: DailyLog[]) {
    const sorted = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let best = 0, current = 0;
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].proteinHitTarget) {
        if (i === 0) { current = 1; continue; }
        const prev = new Date(sorted[i-1].date);
        const curr = new Date(sorted[i].date);
        const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
        current = diff === 1 ? current + 1 : 1;
      } else {
        current = 0;
      }
      best = Math.max(best, current);
    }
    return Math.max(best, current);
  }

  const bestCal = allTimeBestCalStreak(dailyLogs);
  const bestPro = allTimeBestProStreak(dailyLogs);

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
          const todayIso = new Date().toISOString().split('T')[0];
          
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
        }
      };
    },
    {
      name: 'physique-nav',
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
