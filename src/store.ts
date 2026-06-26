import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
      currentScreen: 'onboard',
      setScreen: (screen) => set({ currentScreen: screen }),
      clearStore: () => set({ currentScreen: 'onboard', onboardingData: undefined, onboardingCompleted: false, goalSetCompleted: false, chatHistory: [] }),
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
      }
    }),
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
