import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/shared/utils/supabase';
import { Turnstile } from '@marsidev/react-turnstile';
import { Mail, AlertTriangle, X, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Logo } from '@/shared/components/Logo';
import { useToast } from '@/shared/components/Toast';

export function DeleteAccountPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !turnstileToken || submitting) return;
    setSubmitting(true);

    const redirectTo = `${window.location.origin}/delete-account/confirm`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: redirectTo,
        captchaToken: turnstileToken,
      },
    });

    setSubmitting(false);

    if (error) {
      if (error.message.includes('captcha')) {
        toast({ type: 'warning', message: 'Please complete the verification and try again.' });
      } else {
        toast({ type: 'error', message: 'Could not send the verification link. Please try again.' });
      }
      return;
    }

    setSent(true);
  };

  const handleResend = () => {
    setSent(false);
    setEmail('');
    setTurnstileToken(null);
  };

  if (sent) {
    return (
      <div className="bg-[#080809] min-h-dvh flex items-center justify-center px-6 overflow-x-hidden text-white w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[420px] mx-auto py-12"
        >
          <div className="flex justify-center mb-10">
            <Logo className="w-10 h-10" />
          </div>

          <h1 className="text-[28px] font-semibold tracking-tight text-center mb-4">
            Check your email
          </h1>

          <p className="text-[15px] text-[rgba(255,255,255,0.55)] leading-relaxed text-center mb-8">
            If an account exists for <span className="text-white break-all">{email}</span>, we&apos;ve sent a verification link.
            <br />
            Open it on this device to continue.
          </p>

          <button
            type="button"
            onClick={handleResend}
            className="w-full text-[14px] text-[#D4FF00] font-semibold hover:opacity-80 transition-opacity mt-4 bg-[rgba(212,255,0,0.1)] px-5 py-2.5 min-h-[44px] rounded-full"
          >
            Use a different email
          </button>

          <div className="flex justify-center gap-6 text-[12px] font-medium text-[rgba(255,255,255,0.3)] mt-10">
            <button onClick={() => navigate('/')} type="button" className="hover:text-[rgba(255,255,255,0.6)] transition-colors cursor-pointer min-h-[44px] min-w-[44px]">Back to LeanIQA</button>
            <a href="/privacy" className="hover:text-[rgba(255,255,255,0.6)] transition-colors cursor-pointer min-h-[44px] min-w-[44px]">Privacy Policy</a>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-[#080809] min-h-dvh flex items-center justify-center px-6 overflow-x-hidden text-white w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[420px] mx-auto py-12"
      >
        <div className="flex justify-center mb-10">
          <Logo className="w-10 h-10" />
        </div>

        <h1 className="text-[28px] font-semibold tracking-tight text-center mb-4">
          Delete your LeanIQA account
        </h1>

        <p className="text-[15px] text-[rgba(255,255,255,0.55)] leading-relaxed text-center mb-8">
          Enter the email address associated with your LeanIQA account.
          We&apos;ll send you a verification link. After you confirm, you&apos;ll have
          24 hours to cancel before the account is permanently deleted.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="delete-email-input" className="sr-only">Email address</label>
            <input
              id="delete-email-input"
              type="email"
              inputMode="email"
              placeholder="you@example.com"
              aria-label="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              className="input-apple min-h-[44px]"
              required
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={submitting || !email || !turnstileToken}
            className="btn-primary w-full disabled:opacity-50 min-h-[48px]"
          >
            {submitting ? 'Sending…' : 'Send verification link'}
          </motion.button>
        </form>

        <div className="flex justify-center pt-4">
          <Turnstile
            siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
            options={{ appearance: 'interaction-only', theme: 'dark' }}
            onSuccess={(token) => setTurnstileToken(token)}
            onError={() => setTurnstileToken(null)}
            onExpire={() => setTurnstileToken(null)}
          />
        </div>

        <div className="flex flex-col items-center gap-3 pt-6 text-[14px]">
          <button
            onClick={() => navigate('/')}
            type="button"
            className="text-[#D4FF00] hover:text-white transition-colors min-h-[44px]"
          >
            Back to LeanIQA
          </button>
          <a
            href="/privacy"
            className="text-[#D4FF00] hover:text-white transition-colors min-h-[44px]"
          >
            Read our Privacy Policy
          </a>
        </div>
      </motion.div>
    </div>
  );
}