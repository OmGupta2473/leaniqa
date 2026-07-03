import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createPersistConfig } from '../utils';

export interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
  data?: any;
  weekKey: string;
  timestamp?: number;
}

interface ChatState {
  chatHistory: ChatMessage[];
  addChatMessage: (msg: Omit<ChatMessage, 'weekKey'>) => void;
  clearOldChats: () => void;
  clearChatStore: () => void;
}

function getWeekKey(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
  return `${d.getUTCFullYear()}-W${weekNo}`;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
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
      clearChatStore: () => set({ chatHistory: [] }),
    }),
    createPersistConfig('leaniqa-chat-store', (state) => ({
      chatHistory: state.chatHistory
    }))
  )
);
