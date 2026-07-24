import { createRoot } from 'react-dom/client';
import App from './app/App.tsx';
import { AppProvider } from './app/providers/AppProvider';
import { initCrashReporting, SentryErrorBoundary } from './shared/utils/logger';
import './index.css';

// Initialize crash reporting before anything else
initCrashReporting();

// One-time branding migration for localStorage keys
const migrateLocalStorage = () => {
  const migrations: Record<string, string> = {
    'physique-nav': 'leaniqa-nav',
    'physique_daily_logs': 'leaniqa_daily_logs',
    'physique_earned_dates': 'leaniqa_earned_dates'
  };

  try {
    for (const [oldKey, newKey] of Object.entries(migrations)) {
      const oldVal = localStorage.getItem(oldKey);
      if (oldVal !== null) {
        if (localStorage.getItem(newKey) === null) {
          localStorage.setItem(newKey, oldVal);
        }
        localStorage.removeItem(oldKey);
      }
    }
  } catch (e) {
    console.warn('LocalStorage migration failed:', e);
  }
};

migrateLocalStorage();

createRoot(document.getElementById('root')!).render(
  <SentryErrorBoundary fallback={<div className="flex h-screen items-center justify-center p-4 text-center bg-black text-white"><p>An unexpected error occurred. Please reload the page.</p></div>}>
    <AppProvider>
      <App />
    </AppProvider>
  </SentryErrorBoundary>,
);
