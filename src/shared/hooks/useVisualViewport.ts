import { useState, useEffect } from 'react';

export function useVisualViewport() {
  const [viewportOffset, setViewportOffset] = useState(0);

  useEffect(() => {
    if (!window.visualViewport) return;

    const visualViewport = window.visualViewport;

    // Keyboard height, computed as the gap between the layout viewport
    // (window.innerHeight) and the visual viewport (visualViewport.height).
    //
    // This is invariant to page scroll: visualViewport.height does not
    // change when the user scrolls, only when the visible region shrinks.
    //
    // Platform behaviour:
    //   iOS Safari:
    //     layout viewport does NOT shrink → offset = keyboard height
    //   Android Chrome (interactive-widget=resizes-content):
    //     layout viewport DOES shrink → offset = 0, browser reflows natively
    //   Android Chrome (older / no resizes-content support):
    //     layout viewport does NOT shrink → offset = keyboard height
    //
    // In every case the formula gives the right answer, and the caller
    // can safely `marginBottom: offset` without knowing the platform.
    const handleResize = () => {
      const offset = Math.max(0, window.innerHeight - visualViewport.height);
      setViewportOffset(offset);
    };

    visualViewport.addEventListener('resize', handleResize);
    visualViewport.addEventListener('scroll', handleResize);
    // window.resize covers cases where the visual viewport does not fire
    // (URL bar collapse, orientation change, some Android quirks).
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    handleResize();

    return () => {
      visualViewport.removeEventListener('resize', handleResize);
      visualViewport.removeEventListener('scroll', handleResize);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
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
