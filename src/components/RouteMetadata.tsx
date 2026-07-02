import { useEffect } from 'react';
import { useMatches } from 'react-router-dom';

export function RouteMetadata() {
  const matches = useMatches();

  useEffect(() => {
    // Find the deepest route match that has a handle with a title
    const match = matches.slice().reverse().find(m => m.handle && (m.handle as any).title);
    
    if (match) {
      const handle = match.handle as { title: string; description?: string };
      document.title = handle.title ? `${handle.title} | LeanIQA` : 'LeanIQA';
      
      if (handle.description) {
        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
          metaDescription = document.createElement('meta');
          metaDescription.setAttribute('name', 'description');
          document.head.appendChild(metaDescription);
        }
        metaDescription.setAttribute('content', handle.description);
      }
    } else {
      document.title = 'LeanIQA';
    }
  }, [matches]);

  return null;
}
