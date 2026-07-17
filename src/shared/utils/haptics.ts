export const haptics = {
  isSupported: () => typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator,
  
  // Very light tap for minor actions
  tap: () => {
    if (haptics.isSupported()) {
      try { navigator.vibrate(10); } catch (e) {}
    }
  },
  
  // Medium tap for standard actions (saving, logging)
  medium: () => {
    if (haptics.isSupported()) {
      try { navigator.vibrate(20); } catch (e) {}
    }
  },
  
  // Success pattern (e.g., short, short) for unlocking, completing tasks
  success: () => {
    if (haptics.isSupported()) {
      try { navigator.vibrate([30, 50, 30]); } catch (e) {}
    }
  },
  
  // Warning or error
  warning: () => {
    if (haptics.isSupported()) {
      try { navigator.vibrate([40, 40, 40]); } catch (e) {}
    }
  }
};
