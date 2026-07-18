import { useNavigate } from 'react-router-dom';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background-primary text-text-primary px-6">
      <div className="w-16 h-16 rounded-full bg-border-tertiary flex items-center justify-center mb-6">
        <i className="ti ti-map-2 text-3xl text-text-secondary"></i>
      </div>
      <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
      <p className="text-text-secondary text-center mb-10 max-w-[280px]">
        We couldn't find the page you're looking for. It might have been moved or doesn't exist.
      </p>
      <button 
        onClick={() => navigate('/')}
        className="bg-purple text-white px-6 py-3 rounded-full font-medium shadow-lg active:scale-95 transition-transform"
      >
        Return to Dashboard
      </button>
    </div>
  );
}
