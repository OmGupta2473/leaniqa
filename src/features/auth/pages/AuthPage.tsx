import { Logo } from "@/shared/components/Logo";
// OAUTH SETUP REQUIRED:
// 1. Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client ID
// 2. Authorized JavaScript origins: http://localhost:3000 (dev) + https://leaniqa.com (prod)
// 3. Authorized redirect URIs: https://YOUR_PROJECT.supabase.co/auth/v1/callback
//    (Get exact URL from: Supabase Dashboard → Authentication → Providers → Google → Callback URL)
// 4. Supabase Dashboard → Authentication → URL Configuration:
//    Site URL: http://localhost:3000
//    Redirect URLs: http://localhost:3000/** (note the /** wildcard)
// 5. If OAuth consent screen is in "Testing" mode, add your email as a test user.

import { useState, FormEvent } from 'react';
import { supabase } from '@/shared/utils/supabase';
import { Mail, Apple } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { pageVariants, hover, tap } from '@/features/reports/components/motion';
import { haptics } from '@/shared/utils/haptics';
import { useToast } from '@/shared/components/Toast';

// SVG Icons
const GoogleIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.8 15.72 17.58V20.34H19.29C21.37 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4"/>
    <path d="M12 23C14.97 23 17.46 22.02 19.29 20.34L15.72 17.58C14.73 18.24 13.48 18.64 12 18.64C9.13 18.64 6.7 16.7 5.81 14.12H2.14V16.97C3.96 20.58 7.69 23 12 23Z" fill="#34A853"/>
    <path d="M5.81 14.12C5.58 13.44 5.45 12.73 5.45 12C5.45 11.27 5.58 10.56 5.81 9.88V7.03H2.14C1.39 8.52 0.95 10.21 0.95 12C0.95 13.79 1.39 15.48 2.14 16.97L5.81 14.12Z" fill="#FBBC05"/>
    <path d="M12 5.36C13.62 5.36 15.07 5.92 16.21 7.01L19.36 3.86C17.46 2.08 14.97 1 12 1C7.69 1 3.96 3.42 2.14 7.03L5.81 9.88C6.7 7.3 9.13 5.36 12 5.36Z" fill="#EA4335"/>
  </svg>
);

export function AuthPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEmailSuggestion, setShowEmailSuggestion] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);

  const handleEmailLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithOtp({ 
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/dashboard`,
      }
    });
    
    if (error) {
      if (error.message.includes('fetch') || error.message.includes('Network')) {
        toast({ type: 'warning', message: 'No internet connection. Please check your network and try again.' });
      } else if (error.message.includes('rate limit') || error.message.includes('429')) {
        toast({ type: 'warning', message: 'Too many requests. Please wait a minute before trying again.' });
      } else {
        toast({ type: 'error', message: 'Could not send the login link. Please try again.' });
      }
    } else {
      setIsOtpSent(true);
      haptics.success();
      toast({ type: 'success', message: 'Magic link sent! Check your email.' });
    }
    
    setLoading(false);
  };

  const handleOAuthLogin = async (provider: 'google' | 'apple') => {
    setLoading(true);
    setShowEmailSuggestion(false);
    const { error } = await supabase.auth.signInWithOAuth({ 
      provider,
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    });
    if (error) {
      if (error.message.includes('fetch') || error.message.includes('Network')) {
        toast({ type: 'warning', message: 'Network offline' });
      }
      else if (error.message.toLowerCase().includes('exchange') || error.message.toLowerCase().includes('redirect_uri_mismatch')) {
        toast({ type: 'error', message: 'Google sign-in configuration error. Please contact support or use email sign-in.' });
        setShowEmailSuggestion(true);
      }
      else {
        toast({ type: 'error', message: 'Authentication failed' });
        setShowEmailSuggestion(true);
      }
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#080809] min-h-dvh flex items-center justify-center px-6 overflow-x-hidden text-white w-full">
      <AnimatePresence mode="wait">
        <motion.div
          key="auth-page"
          variants={pageVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="w-full max-w-[400px] mx-auto"
        >
          {/* Logo / Brand Section */}
          <div 
            className="flex flex-col items-center justify-center mb-10 text-center cursor-pointer transition-opacity hover:opacity-80"
            onClick={() => window.location.href = '/'}
          >
            <Logo className="w-16 h-16 mb-4 drop-shadow-[0_8px_32px_rgba(0,0,0,0.15)]" />
            <h1 className="text-[28px] font-semibold tracking-tight">LeanIQA</h1>
          </div>

          <div className="space-y-4">
            <motion.button 
                whileHover={hover.subtle}
                whileTap={tap.scale}
                onClick={() => handleOAuthLogin('google')}
                disabled={loading}
                className="btn-ghost w-full"
            >
                <GoogleIcon className="w-5 h-5 shrink-0" /> Continue with Google
            </motion.button>
            
            <motion.button 
                whileHover={hover.subtle}
                whileTap={tap.scale}
                onClick={() => toast({ type: 'info', message: 'This feature is currently unavailable.' })}
                disabled={loading}
                className="btn-ghost w-full opacity-50 cursor-not-allowed"
            >
                <Apple className="w-5 h-5 shrink-0" fill="currentColor" strokeWidth={0} /> Continue with Apple
            </motion.button>
          </div>

          {showEmailSuggestion && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-5 border border-[rgba(212,255,0,0.25)] bg-[rgba(212,255,0,0.1)] text-[#D4FF00] p-3 rounded-[20px] text-[14px] text-center font-medium"
            >
              Having trouble with Google? Try email sign-in below.
            </motion.div>
          )}

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-[0.5px] bg-[rgba(255,255,255,0.18)]"></div>
            <div className="text-[11px] font-semibold text-[rgba(255,255,255,0.18)] uppercase tracking-wide whitespace-nowrap">OR CONTINUE WITH</div>
            <div className="flex-1 h-[0.5px] bg-[rgba(255,255,255,0.18)]"></div>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            {!isOtpSent ? (
                <>
                  <div>
                      <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        className="input-apple"
                        required
                      />
                  </div>
                  <motion.button 
                      whileHover={hover.glow}
                      whileTap={tap.scale}
                      type="submit" 
                      disabled={loading || !email}
                      className="btn-primary w-full disabled:opacity-50"
                  >
                      {loading ? 'Sending link...' : 'Continue with Email'}
                  </motion.button>
                </>
            ) : (
              <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-4 py-2"
              >
                  <div className="w-16 h-16 rounded-full bg-[rgba(212,255,0,0.1)] flex items-center justify-center mx-auto border border-[rgba(212,255,0,0.2)]">
                    <Mail className="w-8 h-8 text-[#D4FF00]" />
                  </div>
                  <div>
                      <h3 className="text-[22px] font-bold text-white mb-2 tracking-tight">Check your inbox</h3>
                      <p className="text-[15px] text-[rgba(255,255,255,0.55)] leading-relaxed">
                        We sent a secure link to <br/><span className="text-white break-all">{email}</span>
                      </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setIsOtpSent(false); setMessage(''); }}
                    className="text-[14px] text-[#D4FF00] font-semibold hover:opacity-80 transition-opacity mt-4 bg-[rgba(212,255,0,0.1)] px-5 py-2.5 rounded-full"
                  >
                    Use a different email
                  </button>
              </motion.div>
            )}
          </form>

          {/* Footer */}
          <div className="flex justify-center gap-6 text-[12px] font-medium text-[rgba(255,255,255,0.3)] mt-8">
            <span className="hover:text-[rgba(255,255,255,0.6)] transition-colors cursor-pointer">Privacy Policy</span>
            <span className="hover:text-[rgba(255,255,255,0.6)] transition-colors cursor-pointer">Terms of Service</span>
          </div>

        </motion.div>
      </AnimatePresence>
    </div>
  );
}

