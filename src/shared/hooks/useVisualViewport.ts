import { useState, useEffect } from 'react';

export function useVisualViewport() {
  const [viewportOffset, setViewportOffset] = useState(0);

  useEffect(() => {
    if (!window.visualViewport) return;

    const visualViewport = window.visualViewport;

    const handleResize = () => {
      // Calculate how much the visual viewport has shrunk from the window inner height
      // This happens when the virtual keyboard is shown
      const offset = window.innerHeight - visualViewport.height;
      
      // On some devices, offset might be a bit off due to safe areas, 
      // but it's generally close to the keyboard height.
      setViewportOffset(Math.max(0, offset));
    };

    visualViewport.addEventListener('resize', handleResize);
    visualViewport.addEventListener('scroll', handleResize);
    
    // Initial calculation
    handleResize();

    return () => {
      visualViewport.removeEventListener('resize', handleResize);
      visualViewport.removeEventListener('scroll', handleResize);
    };
  }, []);

  return viewportOffset;
}