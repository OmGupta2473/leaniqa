import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createPersistConfig } from '@/shared/utils/store';

export interface ReportState {
  clearReportStore: () => void;
}

export const useReportStore = create<ReportState>()(
  persist(
    (set) => ({
      clearReportStore: () => set(() => ({})),
    }),
     createPersistConfig('leaniqa-report-store', () => ({}))
  )
);
