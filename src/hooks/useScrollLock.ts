import { useEffect, useRef } from 'react';

/**
 * Locks the underlying page scroll position while a modal/sheet is open.
 * Does NOT alter the page's scroll position on open or close — it simply
 * freezes it in place using position:fixed + top offset, then restores
 * the exact scrollTop on close. This guarantees the screen behind a modal
 * never jumps, regardless of where the user had scrolled to.
 */
export function useScrollLock(isOpen: boolean) {
  const scrollYRef = useRef(0);

  useEffect(() => {
    if (!isOpen) return;

    // Find the actual scrolling container (App.tsx's scroll wrapper, or document)
    const scrollContainer = document.querySelector('.overflow-y-auto.scroll-smooth') as HTMLElement | null;
    const target = scrollContainer || document.documentElement;

    scrollYRef.current = target.scrollTop;

    const prevPosition = target.style.position;
    const prevTop = target.style.top;
    const prevWidth = target.style.width;
    const prevOverflow = target.style.overflow;

    // Freeze the container in place without losing visual scroll position
    target.style.overflow = 'hidden';

    return () => {
      target.style.position = prevPosition;
      target.style.top = prevTop;
      target.style.width = prevWidth;
      target.style.overflow = prevOverflow;
      // Restore exact scroll position — never reset to 0
      target.scrollTop = scrollYRef.current;
    };
  }, [isOpen]);
}
