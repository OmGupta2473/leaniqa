import { useNetworkConnectivity } from '@/shared/hooks/useNetworkConnectivity';
import { WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function OfflineBanner() {
  const isOnline = useNetworkConnectivity();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 bg-[#FF4D1C] text-white text-xs font-semibold px-4 py-2 flex items-center justify-center gap-2 shadow-lg"
        >
          <WifiOff size={14} />
          <span>You are offline. Changes will sync when connected.</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
