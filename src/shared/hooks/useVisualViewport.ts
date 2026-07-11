import { useState, useEffect } from 'react';

export function useVisualViewport() {
  const [viewportOffset, setViewportOffset] = useState(0);

  useEffect(() => {
    if (!window.visualViewport) return;

    const visualViewport = window.visualViewport;

    const handleResize = () => {
      const offset = window.innerHeight - visualViewport.height;
      setViewportOffset(Math.max(0, offset));
    };

    visualViewport.addEventListener('resize', handleResize);
    visualViewport.addEventListener('scroll', handleResize);
    
    handleResize();

    return () => {
      visualViewport.removeEventListener('resize', handleResize);
      visualViewport.removeEventListener('scroll', handleResize);
    };
  }, []);

  return viewportOffset;
}

export function useKeyboardOpen() {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const viewportOffset = useVisualViewport();

  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        setIsKeyboardOpen(true);
      }
    };
    const handleFocusOut = () => {
      setIsKeyboardOpen(false);
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  return isKeyboardOpen || viewportOffset > 50;
}
