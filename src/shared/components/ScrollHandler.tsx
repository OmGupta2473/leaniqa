import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

export function ScrollHandler() {
  const location = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    const scrollContainer = document.querySelector('.app-scroll') as HTMLDivElement | null;
    
    if (!scrollContainer) return;

    if (navType === 'POP') {
      // Browser back/forward: restore from session storage
      const savedPosition = sessionStorage.getItem(`scroll-${location.key}`);
      if (savedPosition) {
        requestAnimationFrame(() => {
          scrollContainer.scrollTop = parseInt(savedPosition, 10);
        });
      }
    } else {
      // New navigation: scroll to top
      requestAnimationFrame(() => {
        scrollContainer.scrollTop = 0;
      });
    }

    const handleScroll = () => {
      sessionStorage.setItem(`scroll-${location.key}`, scrollContainer.scrollTop.toString());
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [location.key, navType]);

  return null;
}
