import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createPersistConfig } from '../utils';

export interface DashboardState {
  // Chart selection and time range
  selectedChart: string;
  setSelectedChart: (chart: string) => void;
  
  timeRange: string;
  setTimeRange: (range: string) => void;

  // Widget visibility
  expandedCards: string[];
  toggleCardExpanded: (cardId: string) => void;
  
  collapsedWidgets: string[];
  toggleWidgetCollapsed: (widgetId: string) => void;

  // Filters & preferences
  dashboardFilters: Record<string, any>;
  setDashboardFilters: (filters: Record<string, any>) => void;
  
  temporaryPreferences: Record<string, any>;
  setTemporaryPreferences: (prefs: Record<string, any>) => void;

  clearDashboardStore: () => void;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      selectedChart: 'calories',
      setSelectedChart: (selectedChart) => set({ selectedChart }),

      timeRange: '7d',
      setTimeRange: (timeRange) => set({ timeRange }),

      expandedCards: [],
      toggleCardExpanded: (cardId) => set((state) => ({
        expandedCards: state.expandedCards.includes(cardId)
          ? state.expandedCards.filter(id => id !== cardId)
          : [...state.expandedCards, cardId]
      })),

      collapsedWidgets: [],
      toggleWidgetCollapsed: (widgetId) => set((state) => ({
        collapsedWidgets: state.collapsedWidgets.includes(widgetId)
          ? state.collapsedWidgets.filter(id => id !== widgetId)
          : [...state.collapsedWidgets, widgetId]
      })),

      dashboardFilters: {},
      setDashboardFilters: (dashboardFilters) => set({ dashboardFilters }),

      temporaryPreferences: {},
      setTemporaryPreferences: (temporaryPreferences) => set((state) => ({
        temporaryPreferences: { ...state.temporaryPreferences, ...temporaryPreferences }
      })),

      clearDashboardStore: () => set({
        expandedCards: [],
        collapsedWidgets: [],
      }),
    }),
    createPersistConfig('leaniqa-dashboard-store', (state) => ({
      selectedChart: state.selectedChart,
      timeRange: state.timeRange,
      expandedCards: state.expandedCards,
      collapsedWidgets: state.collapsedWidgets,
      dashboardFilters: state.dashboardFilters,
      temporaryPreferences: state.temporaryPreferences
    }))
  )
);
