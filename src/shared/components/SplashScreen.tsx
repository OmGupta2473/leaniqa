import { motion, AnimatePresence } from 'motion/react';

interface SplashScreenProps {
  isLoading: boolean;
}

export function SplashScreen({ isLoading }: SplashScreenProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#080809]"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ 
              scale: 1, 
              opacity: 1,
              filter: ['drop-shadow(0 0 0px rgba(212,255,0,0))', 'drop-shadow(0 0 20px rgba(212,255,0,0.15))', 'drop-shadow(0 0 0px rgba(212,255,0,0))']
            }}
            transition={{ 
              scale: { duration: 0.8, ease: 'easeOut' },
              opacity: { duration: 0.8, ease: 'easeOut' },
              filter: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
            }}
            className="flex flex-col items-center"
          >
            <img src="/logo.png" alt="LeanIQA Logo" className="w-48 h-48 sm:w-64 sm:h-64 lg:w-80 lg:h-80 object-contain" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
