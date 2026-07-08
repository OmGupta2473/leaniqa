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
import { motion } from 'motion/react';

// SVG Icons
const GoogleIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.8 15.72 17.58V20.34H19.29C21.37 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4"/>
    <path d="M12 23C14.97 23 17.46 22.02 19.29 20.34L15.72 17.58C14.73 18.24 13.48 18.64 12 18.64C9.13 18.64 6.7 16.7 5.81 14.12H2.14V16.97C3.96 20.58 7.69 23 12 23Z" fill="#34A853"/>
    <path d="M5.81 14.12C5.58 13.44 5.45 12.73 5.45 12C5.45 11.27 5.58 10.56 5.81 9.88V7.03H2.14C1.39 8.52 0.95 10.21 0.95 12C0.95 13.79 1.39 15.48 2.14 16.97L5.81 14.12Z" fill="#FBBC05"/>
    <path d="M12 5.36C13.62 5.36 15.07 5.92 16.21 7.01L19.36 3.86C17.46 2.08 14.97 1 12 1C7.69 1 3.96 3.42 2.14 7.03L5.81 9.88C6.7 7.3 9.13 5.36 12 5.36Z" fill="#EA4335"/>
  </svg>
);

const DumbbellIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M14.4 14.4 9.6 9.6"/>
    <path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z"/>
    <path d="m21.5 21.5-1.4-1.4"/>
    <path d="M3.9 3.9 2.5 2.5"/>
    <path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z"/>
  </svg>
);

export function AuthPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);

  const handleEmailLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    const { error } = await supabase.auth.signInWithOtp({ 
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: window.location.origin,
      }
    });
    
    if (error) {
      if (error.message.includes('fetch') || error.message.includes('Network')) {
        setMessage('No internet connection. Please check your network and try again.');
      } else if (error.message.includes('rate limit') || error.message.includes('429')) {
        setMessage('Too many requests. Please wait a minute before trying again.');
      } else {
        setMessage('Could not send the login link. Please try again.');
      }
    } else {
      setIsOtpSent(true);
      setMessage('');
    }
    
    setLoading(false);
  };

  const handleOAuthLogin = async (provider: 'google' | 'apple') => {
    setLoading(true);
    setMessage('');
    const { error } = await supabase.auth.signInWithOAuth({ 
      provider,
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) {
      if (error.message.includes('fetch') || error.message.includes('Network')) setMessage("Network offline");
      else if (error.message.toLowerCase().includes('exchange') || error.message.toLowerCase().includes('redirect_uri_mismatch')) setMessage("Google sign-in configuration error. Please contact support or use email sign-in.");
      else setMessage("Authentication failed");
      setLoading(false);
    }
  };

  const showEmailSuggestion = message.includes("Authentication failed") || message.includes("configuration error");

  return (
    <div className="min-h-[100dvh] w-full flex-1 flex flex-col lg:flex-row bg-[#0A0A0A] text-white overflow-x-hidden">
      
      {/* Hero Section */}
      <div className="relative flex flex-col p-6 sm:p-8 lg:p-12 xl:p-16 overflow-hidden lg:border-r border-white/5 lg:bg-[#0F0F11] w-full lg:w-1/2 flex-shrink-0 min-h-[40vh]">
        
        {/* Desktop glow effects */}
        <div className="hidden lg:block absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#D4FF00]/10 blur-[120px] pointer-events-none" />
        <div className="hidden lg:block absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#D4FF00]/5 blur-[120px] pointer-events-none" />
        
        {/* Header / Logo */}
        <div className="flex flex-col lg:flex-row items-center gap-4 lg:gap-3 mt-4 sm:mt-6 lg:mt-0 lg:absolute lg:top-12 lg:left-12 xl:top-16 xl:left-16 z-10 w-full lg:w-auto">
           <div className="w-16 h-16 lg:w-12 lg:h-12 rounded-[18px] lg:rounded-xl bg-[#D4FF00]/10 flex items-center justify-center border border-[#D4FF00]/20 shadow-[0_0_30px_rgba(212,255,0,0.15)] lg:shadow-none">
              <DumbbellIcon className="w-8 h-8 lg:w-6 lg:h-6 text-[#D4FF00]" />
           </div>
           <span className="text-[28px] lg:text-[24px] font-bold tracking-tight">LeanIQA</span>
        </div>

        {/* Mobile Subtitle */}
        <p className="lg:hidden text-[16px] text-white/60 font-medium tracking-tight mt-2 text-center w-full max-w-[280px] self-center">
           Your AI Body Transformation Coach
        </p>
        
        {/* Desktop Hero Content */}
        <div className="hidden lg:flex flex-col justify-center flex-1 z-10 w-full max-w-[500px] lg:self-center py-10 mt-20 lg:mt-0 pt-20 lg:pt-32 pb-10">
           <h2 className="text-[clamp(36px,4vw,56px)] font-bold tracking-tight leading-[1.1] text-white mb-6 xl:mb-8">
              Your AI Body <br/><span className="text-[#D4FF00]">Transformation Coach</span>
           </h2>
           <p className="text-[clamp(16px,1.5vw,18px)] text-white/60 font-medium tracking-tight leading-relaxed mb-8 xl:mb-12 max-w-[400px]">
              Track nutrition. Build consistency. Transform your physique with precision.
           </p>
           
           <div className="flex flex-col gap-5 xl:gap-6">
             <div className="flex items-center gap-4 text-[15px] xl:text-[16px] text-white/80 font-medium">
                <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-[#D4FF00] text-sm flex-shrink-0">✓</div>
                AI Nutrition Coach
             </div>
             <div className="flex items-center gap-4 text-[15px] xl:text-[16px] text-white/80 font-medium">
                <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-[#D4FF00] text-sm flex-shrink-0">✓</div>
                Daily Progress Tracking
             </div>
             <div className="flex items-center gap-4 text-[15px] xl:text-[16px] text-white/80 font-medium">
                <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-[#D4FF00] text-sm flex-shrink-0">✓</div>
                Secure Authentication
             </div>
           </div>
        </div>
        
        {/* Trusted By (Desktop Only) */}
        <div className="hidden lg:block z-10 text-[14px] text-white/40 font-medium lg:self-start">
           Trusted by athletes and fitness enthusiasts.
        </div>
      </div>

      {/* Right Column / Mobile Auth Card */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-8 lg:p-12 xl:p-16 relative w-full lg:w-1/2 flex-shrink-0 min-h-0">
        
        

        <div className="w-full max-w-[420px] lg:max-w-[480px] lg:bg-[#141416]/90 lg:backdrop-blur-2xl lg:border border-white/10 rounded-[24px] lg:rounded-[28px] p-0 lg:p-10 lg:shadow-2xl relative z-10 my-4 lg:my-0 flex-shrink-0">
           
           <div className="text-center mb-8 hidden lg:block">
              <h2 className="text-[28px] font-bold tracking-tight text-white mb-2">Welcome</h2>
              <p className="text-[15px] text-white/50 font-medium">Sign in to continue your journey</p>
           </div>

           <div className="space-y-4">
              <button 
                 onClick={() => handleOAuthLogin('google')}
                 disabled={loading}
                 className="w-full h-[56px] lg:h-[60px] flex items-center justify-center gap-3 bg-white hover:bg-white/90 active:scale-[0.98] transition-all rounded-[16px] text-[#0A0A0A] text-[16px] font-bold tracking-tight disabled:opacity-50"
              >
                 <GoogleIcon className="w-6 h-6" /> Continue with Google
              </button>
              
              <button 
                 onClick={() => window.alert('This feature is currently unavailable.')}
                 disabled={loading}
                 className="w-full h-[56px] lg:h-[60px] flex items-center justify-center gap-3 bg-[#1C1C1E] hover:bg-[#2C2C2E] active:scale-[0.98] transition-all border border-white/5 rounded-[16px] text-white text-[16px] font-bold tracking-tight disabled:opacity-50 opacity-50 cursor-not-allowed"
              >
                 <Apple className="w-[24px] h-[24px]" fill="currentColor" strokeWidth={0} /> Continue with Apple
              </button>
           </div>

           {showEmailSuggestion && (
             <motion.div 
               initial={{ opacity: 0, height: 0 }}
               animate={{ opacity: 1, height: 'auto' }}
               className="mt-5 border border-[#D4FF00]/20 bg-[#D4FF00]/5 text-[#D4FF00] p-4 rounded-[12px] text-[14px] text-center font-medium"
             >
               Having trouble with Google? Try email sign-in below.
             </motion.div>
           )}

           <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-[1px] bg-white/10"></div>
              <div className="text-[12px] font-bold text-white/40 uppercase tracking-[0.08em] whitespace-nowrap">OR CONTINUE WITH EMAIL</div>
              <div className="flex-1 h-[1px] bg-white/10"></div>
           </div>

           <form onSubmit={handleEmailLogin} className="space-y-5">
              {!isOtpSent ? (
                 <>
                    <div>
                       <input
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={loading}
                          className="w-full h-[56px] lg:h-[60px] px-5 bg-[#0A0A0A] lg:bg-[#0A0A0A] border border-white/10 text-white placeholder:text-white/30 rounded-[16px] focus:outline-none focus:border-[#D4FF00]/50 focus:ring-1 focus:ring-[#D4FF00]/50 transition-all text-[16px] font-medium"
                          required
                       />
                    </div>
                    <button 
                       type="submit" 
                       disabled={loading || !email}
                       className="w-full h-[56px] lg:h-[60px] flex items-center justify-center bg-[#D4FF00] hover:bg-[#bce600] active:scale-[0.98] transition-all rounded-[16px] text-[#0A0A0A] text-[16px] font-bold tracking-tight disabled:opacity-50 disabled:active:scale-100"
                    >
                       {loading ? 'Sending link...' : 'Continue'}
                    </button>
                 </>
              ) : (
                <motion.div 
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="text-center space-y-5 py-4"
                >
                   <div className="w-20 h-20 rounded-full bg-[#D4FF00]/10 flex items-center justify-center mx-auto border border-[#D4FF00]/20">
                      <Mail className="w-10 h-10 text-[#D4FF00]" />
                   </div>
                   <div>
                       <h3 className="text-[24px] font-bold text-white mb-2 tracking-tight">Check your inbox</h3>
                       <p className="text-[16px] text-white/60 font-medium leading-relaxed">
                          We sent a secure link to <br/><span className="text-white break-all">{email}</span>
                       </p>
                   </div>
                   <button
                      type="button"
                      onClick={() => { setIsOtpSent(false); setMessage(''); }}
                      className="text-[14px] text-[#D4FF00] font-semibold hover:opacity-80 transition-opacity mt-4 bg-[#D4FF00]/10 px-5 py-2.5 rounded-full"
                   >
                      Use a different email
                   </button>
                </motion.div>
              )}
           </form>

           {message && !showEmailSuggestion && (
              <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className={`text-center text-[14px] font-medium mt-6 p-4 rounded-[12px] ${message.includes('could not') || message.includes('No internet') || message.includes('Too many') || message.includes('failed') ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-[#D4FF00]/10 text-[#D4FF00] border border-[#D4FF00]/20'}`}
              >
                 {message}
              </motion.div>
           )}

        </div>

        {/* Footer */}
        <div className="w-full flex justify-center lg:absolute lg:bottom-8 lg:left-0 mt-auto lg:mt-0">
           <div className="flex gap-6 text-[13px] lg:text-[14px] font-medium text-white/30 pt-8 lg:pt-0 pb-4 lg:pb-0">
             <span className="hover:text-white/60 transition-colors cursor-pointer">Privacy Policy</span>
             <span className="hover:text-white/60 transition-colors cursor-pointer">Terms of Service</span>
           </div>
        </div>
      </div>
    </div>
  );
}
