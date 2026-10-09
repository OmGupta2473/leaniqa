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
              background: 'rgba(0,0,0,0.55)',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              padding: 'env(safe-area-inset-top) 16px env(safe-area-inset-bottom) 16px',
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
              background: 'rgba(22,22,24,0.90)',
              backdropFilter: 'blur(48px) saturate(180%)',
              WebkitBackdropFilter: 'blur(48px) saturate(180%)',
              borderRadius: '24px',
              border: '0.5px solid rgba(255,255,255,0.08)',
              maxHeight: 'calc(100dvh - 120px)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 24px 64px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
          >
            {/* Drag Handle */}
            <div 
              style={{
                width: '32px',
                height: '3.5px',
                background: 'rgba(255,255,255,0.18)',
                borderRadius: '99px',
                margin: '8px auto 0',
                display: 'block',
                flexShrink: 0
              }}
            />

            <div
              ref={sheetContentRef}
              style={{
                overflowY: 'auto',
                paddingBottom: '16px',
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
