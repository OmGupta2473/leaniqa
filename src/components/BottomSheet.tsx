import { ReactNode, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useScrollLock } from '../hooks/useScrollLock';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  maxHeight?: string;
}

export function BottomSheet({ isOpen, onClose, children, maxHeight = '90dvh' }: BottomSheetProps) {
  useScrollLock(isOpen);
  const sheetContentRef = useRef<HTMLDivElement>(null);

  // Whenever the sheet opens, force ITS OWN internal content to start at its own top.
  // This is independent of the page behind it — the sheet is a fresh surface every time it opens.
  useEffect(() => {
    if (isOpen && sheetContentRef.current) {
      sheetContentRef.current.scrollTop = 0;
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'flex-end',
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '480px',
              margin: '0 auto',
              background: 'rgba(22,22,24,0.99)',
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
              borderRadius: '20px 20px 0 0',
              borderTop: '0.5px solid rgba(255,255,255,0.12)',
              maxHeight,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div
              ref={sheetContentRef}
              style={{
                overflowY: 'auto',
                paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)',
              }}
            >
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
