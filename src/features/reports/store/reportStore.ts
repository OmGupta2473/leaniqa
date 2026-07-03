import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createPersistConfig } from '@/shared/utils/store';

export interface ReportState {
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
      activityView: 'dashboard',
      setActivityView: (activityView) => set({ activityView }),
      
      activityCalendarMonth: new Date().toISOString(),
      setActivityCalendarMonth: (activityCalendarMonth) => set({ activityCalendarMonth }),

      clearReportStore: () => set({
        activityView: 'dashboard',
        activityCalendarMonth: new Date().toISOString()
      })
    }),
    createPersistConfig('leaniqa-report-store', (state) => ({
      activityView: state.activityView,
      activityCalendarMonth: state.activityCalendarMonth
    }))
  )
);
