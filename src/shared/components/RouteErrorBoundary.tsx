import { useRouteError } from 'react-router-dom';
import { useEffect } from 'react';

function isChunkLoadError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const message = (error as { message?: string }).message ?? '';
  const name = (error as { name?: string }).name ?? '';
  return (
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Importing a module script failed') ||
    name === 'ChunkLoadError'
  );
}

export function RouteErrorBoundary() {
  const error = useRouteError();

  useEffect(() => {
    if (isChunkLoadError(error)) {
      // A stale chunk after a deploy is expected once. Reload silently.
      window.location.reload();
    }
  }, [error]);

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-[#0A0A0A] text-white px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-[rgba(212,255,0,0.08)] flex items-center justify-center mb-6 border border-[rgba(212,255,0,0.2)]">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#D4FF00"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12a9 9 0 1 1-3-6.7" />
          <polyline points="21 3 21 9 15 9" />
        </svg>
      </div>

      <h1 className="text-[22px] font-semibold tracking-tight mb-2">
        Something interrupted the app
      </h1>
      <p className="text-[14px] text-[rgba(255,255,255,0.6)] leading-relaxed max-w-[300px] mb-8">
        This usually fixes itself with a quick reload. Your data is safe — nothing was lost.
      </p>

      <button
        onClick={() => window.location.reload()}
        className="bg-[#D4FF00] text-black px-8 py-3.5 rounded-full font-semibold text-[15px] active:scale-95 transition-transform min-h-[48px]"
      >
        Reload
      </button>

      <button
        onClick={() => {
          window.location.href = '/dashboard';
        }}
        className="mt-3 text-[14px] font-medium text-[rgba(255,255,255,0.55)] hover:text-white transition-colors min-h-[44px]"
      >
        Back to Dashboard
      </button>
    </div>
  );
}