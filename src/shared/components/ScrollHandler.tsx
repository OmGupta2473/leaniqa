import { useLayoutEffect, useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

// Safely use layout effect for SSR if needed
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function ScrollHandler() {
  const location = useLocation();
  const navType = useNavigationType();
  const currentKey = useRef(location.key);
  const lastScrollPos = useRef(0);
  const timeoutRef = useRef<number | null>(null);

  useIsomorphicLayoutEffect(() => {
    const scrollContainer = document.querySelector('.app-scroll') as HTMLDivElement | null;
    if (!scrollContainer) return;

    if (navType === 'POP') {
      // Browser back/forward: restore from session storage
      const savedPosition = sessionStorage.getItem(`scroll-${location.key}`);
      if (savedPosition) {
        scrollContainer.scrollTop = parseInt(savedPosition, 10);
      }
    } else {
      // New navigation: scroll to top
      scrollContainer.scrollTop = 0;
    }

    currentKey.current = location.key;
    lastScrollPos.current = scrollContainer.scrollTop;
    
    // Save initial position right away
    sessionStorage.setItem(`scroll-${location.key}`, lastScrollPos.current.toString());

    const handleScroll = () => {
      lastScrollPos.current = scrollContainer.scrollTop;
      
      if (timeoutRef.current === null) {
        timeoutRef.current = window.setTimeout(() => {
          sessionStorage.setItem(`scroll-${currentKey.current}`, lastScrollPos.current.toString());
          timeoutRef.current = null;
        }, 150);
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      // Save exact position on unmount before navigating away
      sessionStorage.setItem(`scroll-${currentKey.current}`, lastScrollPos.current.toString());
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [location.key, navType]);

  return null;
}
