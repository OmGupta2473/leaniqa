import { useEffect } from 'react';

export function KeyboardHandler() {
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent | MouseEvent) => {
      const activeElement = document.activeElement as HTMLElement;
      if (!activeElement) return;

      const isInput = 
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA';

      if (isInput) {
        // Check if the tap is outside the currently focused input
        const target = e.target as HTMLElement;
        if (target !== activeElement && target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && target.tagName !== 'BUTTON') {
            // Unfocus the input to dismiss keyboard
            activeElement.blur();
        }
      }
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('mousedown', handleTouchStart);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('mousedown', handleTouchStart);
    };
  }, []);

  return null;
}
