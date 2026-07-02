import { useRouteError, useNavigate } from 'react-router-dom';

export function RouteErrorBoundary() {
  const error = useRouteError() as any;
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background-primary text-text-primary px-6">
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
        <i className="ti ti-alert-triangle text-3xl text-red-500"></i>
      </div>
      <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
      <p className="text-text-secondary text-center mb-8 max-w-[280px]">
        {error?.message || "An unexpected error occurred while loading this page."}
      </p>
      <div className="flex gap-4">
        <button 
          onClick={() => window.location.reload()}
          className="bg-border-tertiary text-text-primary px-6 py-3 rounded-full font-medium active:scale-95 transition-transform"
        >
          Reload Page
        </button>
        <button 
          onClick={() => navigate('/')}
          className="bg-purple text-white px-6 py-3 rounded-full font-medium shadow-lg active:scale-95 transition-transform"
        >
          Go Home
        </button>
      </div>
    </div>
  );
}
