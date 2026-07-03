import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createPersistConfig } from '../utils';

export interface ReportState {
  selectedWeek: string | null;
  setSelectedWeek: (week: string | null) => void;

  expandedInsights: string[];
  toggleInsightExpanded: (insightId: string) => void;

  currentReportPage: string;
  setCurrentReportPage: (page: string) => void;

  reportFilters: Record<string, any>;
  setReportFilters: (filters: Record<string, any>) => void;

  reportSorting: { field: string; direction: 'asc' | 'desc' } | null;
  setReportSorting: (sorting: { field: string; direction: 'asc' | 'desc' } | null) => void;

  visualizationSettings: Record<string, any>;
  setVisualizationSettings: (settings: Record<string, any>) => void;

  // Additional WeeklyReport specific states
  activityView: 'dashboard' | 'detail' | 'calendar';
  setActivityView: (view: 'dashboard' | 'detail' | 'calendar') => void;
  
  activityCalendarMonth: string;
  setActivityCalendarMonth: (month: string) => void;

  clearReportStore: () => void;
}

export const useReportStore = create<ReportState>()(
  persist(
    (set) => ({
      selectedWeek: null,
      setSelectedWeek: (selectedWeek) => set({ selectedWeek }),

      expandedInsights: [],
      toggleInsightExpanded: (insightId) => set((state) => ({
        expandedInsights: state.expandedInsights.includes(insightId)
          ? state.expandedInsights.filter(id => id !== insightId)
          : [...state.expandedInsights, insightId]
      })),

      currentReportPage: 'overview',
      setCurrentReportPage: (currentReportPage) => set({ currentReportPage }),

      reportFilters: {},
      setReportFilters: (reportFilters) => set({ reportFilters }),

      reportSorting: null,
      setReportSorting: (reportSorting) => set({ reportSorting }),

      visualizationSettings: {},
      setVisualizationSettings: (visualizationSettings) => set({ visualizationSettings }),

      activityView: 'dashboard',
      setActivityView: (activityView) => set({ activityView }),
      
      activityCalendarMonth: new Date().toISOString(),
      setActivityCalendarMonth: (activityCalendarMonth) => set({ activityCalendarMonth }),

      clearReportStore: () => set({
        selectedWeek: null,
        expandedInsights: [],
        currentReportPage: 'overview',
        reportFilters: {},
        reportSorting: null,
        visualizationSettings: {},
        activityView: 'dashboard',
        activityCalendarMonth: new Date().toISOString()
      })
    }),
    createPersistConfig('leaniqa-report-store', (state) => ({
      currentReportPage: state.currentReportPage,
      reportFilters: state.reportFilters,
      reportSorting: state.reportSorting,
      visualizationSettings: state.visualizationSettings,
      activityView: state.activityView,
      activityCalendarMonth: state.activityCalendarMonth
    }))
  )
);
