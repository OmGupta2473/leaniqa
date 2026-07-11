import { ReactNode, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useScrollLock } from '@/shared/hooks/useScrollLock';
import { slideUpVariants } from '@/features/reports/components/motion';

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
          transition={{ duration: 0.25 }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.72)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'flex-end',
          }}
          onClick={onClose}
        >
          <motion.div
            variants={slideUpVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '480px',
              margin: '0 auto',
              background: 'rgba(16,16,18,0.98)',
              backdropFilter: 'blur(48px)',
              WebkitBackdropFilter: 'blur(48px)',
              borderRadius: '24px 24px 0 0',
              borderTop: '0.5px solid rgba(255,255,255,0.1)',
              maxHeight,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Drag Handle */}
            <div 
              style={{
                width: '36px',
                height: '4px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '99px',
                margin: '10px auto 0',
                display: 'block',
                flexShrink: 0
              }}
            />

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
