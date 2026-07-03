import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const LEGACY_KEYS = ['physique-nav', 'physique_daily_logs', 'physique_earned_dates'];
LEGACY_KEYS.forEach(key => {
  // Only migrate if new key doesn't exist yet
  const legacy = localStorage.getItem(key);
  const newKey = key.replace('physique', 'leaniqa');
  if (legacy && !localStorage.getItem(newKey)) {
    localStorage.setItem(newKey, legacy);
    localStorage.removeItem(key);
  }
});

export interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
  data?: any;
  weekKey: string;
  timestamp?: number;
}

interface AppState {
  clearStore: () => void;
  onboardingData?: any;
  setOnboardingData: (data: any) => void;
  editProfileMode: boolean;
  setEditProfileMode: (v: boolean) => void;
  chatHistory: ChatMessage[];
  addChatMessage: (msg: Omit<ChatMessage, 'weekKey'>) => void;
  clearOldChats: () => void;
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
    (set, get) => ({
      clearStore: () => set({ onboardingData: undefined, editProfileMode: false, chatHistory: [] }),
      setOnboardingData: (data) => set({ onboardingData: data }),
      editProfileMode: false,
      setEditProfileMode: (v) => set({ editProfileMode: v }),
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
    }),
    {
      name: 'leaniqa-nav',
      partialize: (state) => ({ 
        onboardingData: state.onboardingData, 
        chatHistory: state.chatHistory
      }),
    }
  )
);
