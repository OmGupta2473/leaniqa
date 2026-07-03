const LEGACY_KEYS = ['physique-nav', 'physique_daily_logs', 'physique_earned_dates'];
LEGACY_KEYS.forEach(key => {
  if (typeof window !== 'undefined') {
    const legacy = localStorage.getItem(key);
    const newKey = key.replace('physique', 'leaniqa');
    if (legacy && !localStorage.getItem(newKey)) {
      localStorage.setItem(newKey, legacy);
      localStorage.removeItem(key);
    }
  }
});

export * from './app';
export * from './auth';
export * from './user';
export * from './nutrition';
export * from './dashboard';
export * from './reports';
export * from './awards';
export * from './chat';
