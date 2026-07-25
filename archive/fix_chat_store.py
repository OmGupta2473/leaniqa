import re

with open("src/app/store/chatStore.ts", "r") as f:
    content = f.read()

old_content = """export interface ChatMessage {
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
);"""

new_content = """export interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
  data?: any;
  weekKey: string;
  timestamp?: number;
}

interface ChatState {
  chatHistory: ChatMessage[];
  userId: string | null;
  dateKey: string | null;
  initializeSession: (userId: string) => void;
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

function getLocalDateKey(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      chatHistory: [],
      userId: null,
      dateKey: null,
      initializeSession: (userId: string) => {
        const dateKey = getLocalDateKey();
        set((state) => {
          if (state.userId !== userId || state.dateKey !== dateKey) {
            return { userId, dateKey, chatHistory: [] };
          }
          return state;
        });
      },
      addChatMessage: (msg) => {
        const weekKey = getWeekKey();
        const dateKey = getLocalDateKey();
        set((state) => {
          // If the date has changed while chatting, clear history first
          if (state.dateKey !== dateKey) {
             return {
               dateKey,
               chatHistory: [{ ...msg, weekKey, timestamp: Date.now() }]
             };
          }
          return {
            chatHistory: [...state.chatHistory, { ...msg, weekKey, timestamp: Date.now() }]
          };
        });
      },
      clearOldChats: () => {
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        set((state) => ({
          chatHistory: state.chatHistory.filter(m => (m.timestamp || 0) > sevenDaysAgo)
        }));
      },
      clearChatStore: () => set({ chatHistory: [], userId: null, dateKey: null }),
    }),
    createPersistConfig('leaniqa-chat-store', (state) => ({
      chatHistory: state.chatHistory,
      userId: state.userId,
      dateKey: state.dateKey
    }))
  )
);"""

if old_content in content:
    content = content.replace(old_content, new_content)
    with open("src/app/store/chatStore.ts", "w") as f:
        f.write(content)
    print("chatStore.ts updated successfully")
else:
    print("Failed to match old content in chatStore.ts")
