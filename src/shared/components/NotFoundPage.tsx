import { useNavigate } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { motion } from 'motion/react';

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#080809] text-white px-6">
      <div className="w-16 h-16 rounded-full bg-[rgba(212,255,0,0.1)] border border-[rgba(212,255,0,0.2)] flex items-center justify-center mb-6">
        <Compass className="w-8 h-8 text-[#D4FF00]" />
      </div>
      <h1 className="text-2xl font-bold mb-2 tracking-tight">Page Not Found</h1>
      <p className="text-[rgba(255,255,255,0.55)] text-center mb-10 max-w-[280px]">
        We couldn't find the page you're looking for. It might have been moved or doesn't exist.
      </p>
      <motion.button 
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate('/')}
        className="bg-[#D4FF00] text-black px-8 py-3.5 rounded-full font-semibold shadow-lg transition-transform"
      >
        Return to Home
      </motion.button>
    </div>
  );
}
