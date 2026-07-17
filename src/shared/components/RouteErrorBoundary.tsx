import { useRouteError } from 'react-router-dom';
import { useEffect } from 'react';

export function RouteErrorBoundary() {
  const error = useRouteError() as any;

  useEffect(() => {
    // Automatically reload on chunk load error
    if (
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('Importing a module script failed') ||
      error?.name === 'ChunkLoadError'
    ) {
      window.location.reload();
    }
  }, [error]);

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-[#0A0A0A] text-white px-6">
      <div className="w-16 h-16 rounded-full bg-[rgba(255,77,28,0.1)] flex items-center justify-center mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FF4D1C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      </div>
      <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
      <p className="text-[rgba(255,255,255,0.6)] text-center mb-8 max-w-[280px]">
        {error?.message || "An unexpected error occurred while loading this page."}
      </p>
      <div className="flex gap-4">
        <button 
          onClick={() => window.location.reload()}
          className="bg-[rgba(255,255,255,0.1)] text-white px-6 py-3 rounded-full font-medium active:scale-95 transition-transform"
        >
          Reload Page
        </button>
        <button 
          onClick={() => window.location.href = '/dashboard'}
          className="bg-[#D4FF00] text-black px-6 py-3 rounded-full font-semibold active:scale-95 transition-transform"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
