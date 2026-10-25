import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/shared/utils/supabase';
import { authService } from '@/features/auth/services/authService';
import { useAuthSession } from '@/router/useAuthSession';
import { AlertTriangle, X, Loader2, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Logo } from '@/shared/components/Logo';
import { useToast } from '@/shared/components/Toast';

const CONFIRM_CALLBACK_ERRORS: Record<string, string> = {
  otp_expired: 'This link has expired. Please request a new one.',
  access_denied: 'This link is invalid or has already been used.',
  invalid_request: 'This link is invalid. Please request a new one.',
};

export function DeleteAccountConfirmPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { session, loading: sessionLoading } = useAuthSession();

  const [confirmLoading, setConfirmLoading] = useState(false);
  const [requested, setRequested] = useState(false);
  const [callbackError, setCallbackError] = useState<string | null>(null);
  const [callbackErrorCode, setCallbackErrorCode] = useState<string | null>(null);
  const [showExpiredLink, setShowExpiredLink] = useState(false);

  // Handle callback errors from magic link (e.g., otp_expired)
  useEffect(() => {
    const params = new URLSearchParams(location.search);

    const code = params.get('error_code');
    const description = params.get('error_description');

    if (!code && !description) return;

    const friendly =
      (code && CONFIRM_CALLBACK_ERRORS[code]) ||
      (description ? decodeURIComponent(description.replace(/\+/g, ' ')) : null);

    if (friendly) {
      setCallbackError(friendly);
      setCallbackErrorCode(code);
      if (code === 'otp_expired') {
        setShowExpiredLink(true);
      }
    }

    // Strip the error params so a refresh doesn't re-show the message.
    const url = new URL(window.location.href);
    ['error', 'error_code', 'error_description'].forEach((k) =>
      url.searchParams.delete(k),
    );
    window.history.replaceState({}, '', url.toString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // Helper to check if user is guest
  const isGuest = session?.user?.is_anonymous === true;

  // Determine which UI state to show
  if (sessionLoading) {
    return (
      <div className="bg-[#080809] min-h-dvh flex items-center justify-center px-6 text-white w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-12 h-12 border-4 border-[#D4FF00]/30 border-t-[#D4FF00] rounded-full animate-spin" />
          <p className="text-[14px] text-[rgba(255,255,255,0.55)]">Verifying your link…</p>
        </motion.div>
      </div>
    );
  }

  if (!session) {
    // No session after magic link processing = invalid/expired link
    return (
      <div className="bg-[#080809] min-h-dvh flex items-center justify-center px-6 text-white w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[420px] mx-auto py-12 text-center"
        >
          <div className="flex justify-center mb-10">
            <Logo className="w-10 h-10" />
          </div>

          <div className="w-16 h-16 rounded-full bg-[rgba(255,77,28,0.1)] flex items-center justify-center mx-auto mb-6 border border-[rgba(255,77,28,0.2)]">
            <AlertTriangle size={28} className="text-[#FF4D1C]" />
          </div>

          <h1 className="text-[22px] font-semibold text-white tracking-tight mb-2">
            This link is invalid or has expired
          </h1>

          <p className="text-[14px] text-[rgba(255,255,255,0.55)] leading-relaxed mb-6">
            Request a new verification link from the beginning.
          </p>

          {callbackError && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[12px] text-[rgba(255,255,255,0.4)] mb-6"
            >
              {callbackError}
            </motion.p>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/delete-account')}
            className="btn-primary w-full min-h-[48px]"
          >
            Start over
          </motion.button>

          <div className="flex justify-center gap-6 text-[12px] font-medium text-[rgba(255,255,255,0.3)] mt-10">
            <button onClick={() => navigate('/')} type="button" className="hover:text-[rgba(255,255,255,0.6)] transition-colors cursor-pointer min-h-[44px] min-w-[44px]">Back to LeanIQA</button>
            <a href="/privacy" className="hover:text-[rgba(255,255,255,0.6)] transition-colors cursor-pointer min-h-[44px] min-w-[44px]">Privacy Policy</a>
          </div>
        </motion.div>
      </div>
    );
  }

  if (isGuest) {
    return (
      <div className="bg-[#080809] min-h-dvh flex items-center justify-center px-6 text-white w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[420px] mx-auto py-12 text-center"
        >
          <div className="flex justify-center mb-10">
            <Logo className="w-10 h-10" />
          </div>

          <div className="w-16 h-16 rounded-full bg-[rgba(255,77,28,0.1)] flex items-center justify-center mx-auto mb-6 border border-[rgba(255,77,28,0.2)]">
            <AlertTriangle size={28} className="text-[#FF4D1C]" />
          </div>

          <h1 className="text-[22px] font-semibold text-white tracking-tight mb-2">
            Guest accounts cannot be deleted from the web
          </h1>

          <p className="text-[14px] text-[rgba(255,255,255,0.55)] leading-relaxed mb-6">
            Open the app and use Profile &rarr; Delete account.
          </p>

          <div className="flex justify-center gap-6 text-[12px] font-medium text-[rgba(255,255,255,0.3)] mt-10">
            <button onClick={() => navigate('/')} type="button" className="hover:text-[rgba(255,255,255,0.6)] transition-colors cursor-pointer min-h-[44px] min-w-[44px]">Back to LeanIQA</button>
            <a href="/privacy" className="hover:text-[rgba(255,255,255,0.6)] transition-colors cursor-pointer min-h-[44px] min-w-[44px]">Privacy Policy</a>
          </div>
        </motion.div>
      </div>
    );
  }

  // User is authenticated and not a guest
  if (requested) {
    return (
      <div className="bg-[#080809] min-h-dvh flex items-center justify-center px-6 text-white w-full" role="status" aria-live="polite">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[420px] mx-auto py-12 text-center"
        >
          <div className="flex justify-center mb-10">
            <Logo className="w-10 h-10" />
          </div>

          <div className="w-16 h-16 rounded-full bg-[rgba(212,255,0,0.1)] flex items-center justify-center mx-auto mb-6 border border-[rgba(212,255,0,0.2)]">
            <Loader2 size={28} className="text-[#D4FF00]" />
          </div>

          <h1 className="text-[22px] font-semibold text-white tracking-tight mb-2">
            Deletion scheduled
          </h1>

          <p className="text-[14px] text-[rgba(255,255,255,0.55)] leading-relaxed mb-8">
            Your account will be permanently deleted in 24 hours.
            <br />
            Sign back into the app within that window to cancel.
          </p>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/')}
            className="btn-primary w-full min-h-[48px]"
          >
            Done
          </motion.button>

          <div className="flex justify-center gap-6 text-[12px] font-medium text-[rgba(255,255,255,0.3)] mt-10">
            <button onClick={() => navigate('/')} type="button" className="hover:text-[rgba(255,255,255,0.6)] transition-colors cursor-pointer min-h-[44px] min-w-[44px]">Back to LeanIQA</button>
            <a href="/privacy" className="hover:text-[rgba(255,255,255,0.6)] transition-colors cursor-pointer min-h-[44px] min-w-[44px]">Privacy Policy</a>
          </div>
        </motion.div>
      </div>
    );
  }

  const handleConfirm = async () => {
    setConfirmLoading(true);
    try {
      const { error } = await supabase.functions.invoke('request-account-deletion', {
        body: { action: 'request' },
      });

      if (error) {
        const errorData = error.context?.json ? await error.context.json() : null;
        const errorCode = errorData?.error_code;
        const errorMessage = errorData?.error || error.message;

        if (errorCode === 'already_requested') {
          // Idempotent: already in grace period
          setRequested(true);
        } else {
          toast({ type: 'error', message: errorMessage || 'Could not request deletion. Please try again.' });
          setConfirmLoading(false);
        }
        return;
      }

      setRequested(true);
      // Logout clears caches and navigates; we don't await it.
      void authService.logout();
    } catch (err) {
      toast({ type: 'error', message: 'An unexpected error occurred. Please try again.' });
      setConfirmLoading(false);
    }
  };

  const handleCancel = async () => {
    await authService.logout();
    navigate('/');
  };

  return (
    <div className="bg-[#080809] min-h-dvh flex items-center justify-center px-6 text-white w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[420px] mx-auto py-12"
      >
        <div className="flex justify-center mb-10">
          <Logo className="w-10 h-10" />
        </div>

        <h1 className="text-[28px] font-semibold tracking-tight text-center mb-4">
          Confirm account deletion
        </h1>

        <p className="text-[15px] text-[rgba(255,255,255,0.55)] leading-relaxed text-center mb-8">
          You are signed in as <span className="text-white break-all">{session.user.email}</span>.
          Deleting your account permanently removes your meal history, streaks, and awards.
          You have 24 hours to change your mind after confirming. After that, the deletion
          cannot be undone.
        </p>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleConfirm}
          disabled={confirmLoading}
          className="w-full py-3.5 rounded-full bg-[#FF5C4D] text-white font-semibold text-[15px] transition-opacity disabled:opacity-50 mb-3 min-h-[52px]"
        >
          {confirmLoading ? 'Requesting…' : 'Delete my account'}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCancel}
          disabled={confirmLoading}
          className="w-full py-3 text-center text-[13px] text-[rgba(255,255,255,0.55)] hover:text-white transition-colors disabled:opacity-40 min-h-[44px]"
        >
          Cancel
        </motion.button>

        <div className="flex justify-center gap-6 text-[12px] font-medium text-[rgba(255,255,255,0.3)] mt-10">
          <button onClick={() => navigate('/')} type="button" className="hover:text-[rgba(255,255,255,0.6)] transition-colors cursor-pointer min-h-[44px] min-w-[44px]">Back to LeanIQA</button>
          <a href="/privacy" className="hover:text-[rgba(255,255,255,0.6)] transition-colors cursor-pointer min-h-[44px] min-w-[44px]">Privacy Policy</a>
        </div>
      </motion.div>
    </div>
  );
}