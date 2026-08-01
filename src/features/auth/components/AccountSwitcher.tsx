import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Plus, LogOut, X, Loader2 } from 'lucide-react';
import { useMultiAccountStore } from '@/app/store/multiAccountStore';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom';

interface AccountSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccountSwitcher({ isOpen, onClose }: AccountSwitcherProps) {
  const { accounts, activeAccountId } = useMultiAccountStore();
  const navigate = useNavigate();
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);
  
  const savedAccounts = Object.values(accounts);

  const handleSwitch = async (id: string) => {
    if (id === activeAccountId) {
      onClose();
      return;
    }
    
    setSwitchingTo(id);
    try {
      await authService.switchAccount(id);
      window.location.href = '/dashboard'; // Force full reload to ensure clean state
    } catch (e) {
      console.error('Failed to switch account:', e);
      alert("Session expired. Please log in again.");
      navigate('/login');
    } finally {
      setSwitchingTo(null);
      onClose();
    }
  };

  const handleAddAccount = async () => {
    onClose();
    await authService.prepareAddAccount();
    window.location.href = '/login?mode=add_account';
  };

  const handleRemoveAccount = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    
    // Just remove the account from the store if it's not the active one
    if (id === activeAccountId) {
      // If they remove the currently active account, log them out
      await authService.logout(false);
      window.location.href = '/login';
    } else {
      useMultiAccountStore.getState().removeAccount(id);
    }
  };

  if (typeof document === 'undefined') return null;
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-[90%] max-w-[340px] rounded-3xl overflow-hidden"
            style={{
              background: 'rgba(28, 28, 30, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
            }}
          >
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h2 className="text-[17px] font-semibold text-white tracking-tight">Accounts</h2>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3 max-h-[60vh] overflow-y-auto">
              {savedAccounts.map((account) => {
                const isActive = account.id === activeAccountId;
                const isSwitching = switchingTo === account.id;

                return (
                  <button
                    key={account.id}
                    onClick={() => handleSwitch(account.id)}
                    disabled={!!switchingTo}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all duration-200 ${
                      isActive ? 'bg-white/10' : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-lg relative"
                        style={{
                          background: isActive ? 'rgba(212,255,0,0.15)' : 'rgba(255,255,255,0.05)',
                          color: isActive ? '#D4FF00' : 'rgba(255,255,255,0.7)',
                        }}
                      >
                        {account.avatar_url ? (
                          <img src={account.avatar_url} alt={account.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          account.name ? account.name.substring(0, 2).toUpperCase() : 'ME'
                        )}
                        {isActive && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#D4FF00] rounded-full border-2 border-[#1C1C1E] flex items-center justify-center">
                            <Check size={12} className="text-black" strokeWidth={3} />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-start text-left truncate">
                        <span className={`text-[15px] font-medium truncate ${isActive ? 'text-white' : 'text-white/80'}`}>
                          {account.name || 'User'}
                        </span>
                        <span className="text-[13px] text-white/50 truncate w-full">
                          {account.email}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {isSwitching && <Loader2 size={18} className="animate-spin text-white/50" />}
                      {!isActive && !isSwitching && (
                        <div
                          onClick={(e) => handleRemoveAccount(e, account.id)}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                        >
                          <LogOut size={16} />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-3 border-t border-white/5">
              <button
                onClick={handleAddAccount}
                disabled={!!switchingTo}
                className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition-colors text-left"
              >
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/70">
                  <Plus size={24} />
                </div>
                <span className="text-[15px] font-medium text-white/90">
                  Add another account
                </span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
